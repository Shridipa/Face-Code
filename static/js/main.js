// Editor Setup using CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
  mode: "python",
  theme: "dracula",
  lineNumbers: true,
  indentUnit: 4,
  smartIndent: true,
  extraKeys: { "Ctrl-Space": "autocomplete" },
});

// Telemetry State
let activeProblemId = null;
let keyStrokeCount = 0;
let lastKeyTime = Date.now();
const TELEMETRY_INTERVAL_MS = 2000; // Check webcam/strokes every 2 seconds

// DOM Elements
const webcam = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const outBox = document.getElementById("output-box");
const hintsArea = document.getElementById("hints-area");
const hintsList = document.getElementById("hints-list");

// 1. Initialize Application
async function initApp() {
  // Request Camera Access Explicitly
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;
  } catch (err) {
    console.error("Webcam Error:", err);
    outBox.innerHTML =
      "<span style='color:red;'>Failed to load webcam. Please grant permissions.</span>";
  }

  // Set Editor keystroke listener for CPM telemetry
  editor.on("change", () => {
    keyStrokeCount++;
    lastKeyTime = Date.now();
  });

  // Fetch initial problem
  await fetchNextProblem();

  // Start Telemetry Tracking Loop
  setInterval(sendTelemetry, TELEMETRY_INTERVAL_MS);

  // Wire up buttons
  const runBtn = document.getElementById("run-btn");
  if (runBtn) runBtn.onclick = runCode;

  const mentorBtn = document.getElementById("llm-hint-btn");
  if (mentorBtn) mentorBtn.onclick = requestLLMHint;

  const nextBtn = document.getElementById("next-problem-btn");
  if (nextBtn) nextBtn.onclick = fetchNextProblem;
}

// 2. Fetch New Problem from Flask Adaptive Engine
async function fetchNextProblem() {
  outBox.innerText = "Requesting adaptive problem...";
  try {
    const response = await fetch("/api/get_next_problem", { method: "POST" });
    const data = await response.json();
    const prob = data.problem;

    if (prob.error) {
      outBox.innerText = `Error: ${prob.error}`;
      return;
    }

    activeProblemId = prob.id;
    document.getElementById("problem-title").innerText = prob.title;
    document.getElementById("problem-difficulty").innerText = prob.difficulty;
    document.getElementById("problem-description").innerText = prob.description;

    // Reset local telemetry
    hintsArea.classList.add("hidden");
    hintsList.innerHTML = "";
    keyStrokeCount = 0;
    lastKeyTime = Date.now();

    editor.setValue(
      "def solution():\n    # Write your code here based on the instructions\n    pass",
    );
    outBox.innerText = `Problem '${prob.title}' loaded. Good luck!`;

    // Did the backend push an immediate hint because we're struggling?
    if (prob.suggested_hint) {
      addHint(prob.suggested_hint, "System Adaptive Auto-Hint");
    }
  } catch (err) {
    outBox.innerText = "Failed to load next problem.";
    console.error(err);
  }
}

// 3. Telemetry Feedback Loop
async function sendTelemetry() {
  if (!activeProblemId) return;

  // Calculate immediate CPM
  const minutesActive = (Date.now() - (lastKeyTime - 60000)) / 60000;
  let cpm = minutesActive > 0 ? keyStrokeCount / minutesActive : 0;

  // Check Inactivity
  const isInactive = Date.now() - lastKeyTime > 10000;

  // Cap CPM logic manually so numbers don't freak out
  if (cpm > 500) cpm = 500;

  // Capture Webcam Frame
  let base64Frame = null;
  if (webcam.readyState === 4) {
    // HAVE_ENOUGH_DATA
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    base64Frame = canvas.toDataURL("image/jpeg", 0.5); // compress
  }

  // Send the Post
  try {
    const response = await fetch("/api/process_telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: activeProblemId,
        cpm: cpm,
        is_inactive: isInactive,
        frame_data: base64Frame,
      }),
    });

    const result = await response.json();

    // Update DOM stats dynamically
    document.getElementById("cpm-display").innerText = `${Math.floor(cpm)} CPM`;
    document.getElementById("error-rate-display").innerText =
      `${Math.floor(result.error_rate * 100)}% Err`;
    document.getElementById("emotion-tag").innerText =
      result.emotion.toUpperCase();

    // Dynamic styling for emotion
    document.getElementById("emotion-tag").style.color = [
      "angry",
      "sad",
      "stressed",
      "confused",
      "fear",
    ].includes(result.emotion)
      ? "#ff5555"
      : "#50fa7b";

    // Confidence Bar
    const confPercent = Math.floor(result.confidence * 100);
    document.getElementById("confidence-label").innerText =
      `Confidence: ${confPercent}%`;
    document.getElementById("confidence-fill").style.width = `${confPercent}%`;

    // Auto hint triggered by RuleBasedHintSystem?
    if (result.auto_hint) {
      addHint(result.auto_hint, "Contextual Predefined Hint");
    }
  } catch (error) {
    console.warn("Telemetry transmission dropped:", error);
  }
}

// 4. Code Execution Simulation
async function runCode() {
  const userCode = editor.getValue();
  outBox.innerText = "> Running...";

  try {
    const response = await fetch("/api/run_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: activeProblemId,
        code: userCode,
      }),
    });

    const result = await response.json();

    if (result.success) {
      outBox.innerHTML = `<span style='color:#50fa7b'>[SUCCESS]</span> ${result.output}`;
    } else {
      outBox.innerHTML = `<span style='color:#ff5555'>[FAILED]</span> ${result.output}`;
    }
  } catch (error) {
    outBox.innerHTML =
      "<span style='color:#ff5555'>Server execution error.</span>";
  }
}

// 5. Explicit LLM Hint Request
async function requestLLMHint() {
  outBox.innerText = "> Contacting AI Mentor...";
  try {
    const response = await fetch("/api/request_llm_hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: document.getElementById("problem-title").innerText,
        description: document.getElementById("problem-description").innerText,
        code: editor.getValue(),
      }),
    });

    const result = await response.json();
    addHint(result.hint, "LLM AI Mentor");
    outBox.innerText = "Mentor provided a hint.";
  } catch (error) {
    outBox.innerText = "Error contacting mentor API.";
  }
}

// Helper to push hints onto the UI safely
function addHint(hintText, sourceName) {
  hintsArea.classList.remove("hidden");
  const li = document.createElement("li");
  li.innerHTML = `<strong>[${sourceName}]</strong><br/> <span style="white-space: pre-wrap; font-family: monospace;">${hintText}</span>`;
  li.style.background = "rgba(189, 147, 249, 0.1)";
  li.style.padding = "10px";
  li.style.borderRadius = "5px";
  li.style.marginTop = "5px";
  li.style.borderLeft = "3px solid #bd93f9";
  hintsList.appendChild(li);
}

// Boot up
window.onload = initApp;
