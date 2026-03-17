import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import cv2
import time
import base64
import numpy as np
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

# Use absolute path for log files regardless of launch directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TELEMETRY_LOG = os.path.join(BASE_DIR, "telemetry.log")

# Project Modules
from adaptive_engine import AdaptiveEngine
from confidence_estimator import calculate_confidence_score
from error_tracker import ErrorTracker
from hint_system import RuleBasedHintSystem
from llm_integration import LLMHintGenerator
from database_manager import DatabaseManager
import uuid
import asyncio
from leetcode_fetcher import fetch_leetcode_questions, fetch_question_content, get_snippet_for_lang
from code_executor import run_tests as executor_run_tests

from deepface import DeepFace

app = Flask(__name__)
CORS(app)

# Initialize Face Cascade (Retained for fallback/debugging, DeepFace can also do this)
_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# DeepFace will be used directly in the telemetry endpoint.
# No need for manual model loading here as DeepFace handles its own model management.

_emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

# Global Engine States (For Demo Simplicity, mapped out locally)
# In production, this would be tied to User Session IDs
engine = AdaptiveEngine()
tracker = ErrorTracker()
hint_system = RuleBasedHintSystem(engine, confusion_threshold=6.0) # Lowered for quicker demo feedback
llm_agent = LLMHintGenerator()
db = DatabaseManager()
session_id = str(uuid.uuid4())

# --- Backend Memory ---
active_cpm = 0
is_inactive = False
current_emotion = "neutral"
current_confidence = 0.50

@app.route("/")
def index():
    """Renders the main FaceCode Web Interface."""
    return render_template("index.html")

@app.route("/api/start_session", methods=["GET"])
def start_session():
    """Initializes and returns the first adaptive problem."""
    try:
        # Try to get a real LeetCode question for the first session
        data = asyncio.run(fetch_leetcode_questions(difficulty="EASY", limit=1, skip=0))
        if data["questions"]:
            q = data["questions"][0]
            qdata = asyncio.run(fetch_question_content(q["titleSlug"]))
            problem = {
                "id":           q["titleSlug"],
                "title":        q["title"],
                "difficulty":   "easy",
                "description":  qdata["content"],
                "codeSnippets": qdata["codeSnippets"],
                "sampleTestCase": qdata["sampleTestCase"],
                "tags":         q["topicTags"],
            }
            return jsonify({"problem": problem})
    except Exception as e:
        print(f"Error fetching live question: {e}")
    
    # Fallback to local mock data
    problem = engine.select_problem(0.5) # Neutral start
    return jsonify({"problem": problem})

@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "library": "deepface",
        "labels": _emotion_labels
    })

@app.route("/api/process_telemetry", methods=["POST"])
def process_telemetry():
    """
    Receives frontend telemetry including typing data and webcam frames.
    Returns calculated emotion, confidence, hints, and potential problem shifts.
    """
    global active_cpm, is_inactive, current_emotion, current_confidence
    
    data = request.json
    frame_b64 = data.get('frame_data')
    active_cpm = data.get('cpm', 0)
    is_inactive = data.get('is_inactive', False)
    problem_id = data.get('problem_id', "easy_1")
    
    emotion_found = "neutral"
    
    # 1. Process Webcam Frame for Emotion
    if frame_b64:
        try:
            # Decode base64 image coming from browser canvas
            header, encoded = frame_b64.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # DeepFace analysis
            # img is the decoded CV2 image
            results = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False, silent=True)
            
            with open(TELEMETRY_LOG, "a") as f:
                ts = time.strftime("%Y-%m-%d %H:%M:%S")
                if results and len(results) > 0:
                    # DeepFace returns a list of results (one per face)
                    res = results[0]
                    emotion_found = res['dominant_emotion']
                    confidence = float(res['emotion'][emotion_found] / 100.0) # DeepFace returns percentages
                    
                    f.write(f"[{ts}] DeepFace: Emotion={emotion_found} ({confidence:.2f})\n")
                else:
                    f.write(f"[{ts}] DeepFace: No face detected in frame.\n")
        except Exception as e:
            print(f"Error processing frame with DeepFace: {e}", flush=True)
            with open(TELEMETRY_LOG, "a") as f:
                f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DeepFace Error: {e}\n")

    current_emotion = emotion_found
    
    # 2. Confidence Evaluation
    error_rate = tracker.get_error_rate(problem_id)
    current_confidence = calculate_confidence_score(current_emotion, active_cpm, error_rate, is_inactive)
    
    # 3. Hint System
    is_confused = current_emotion in ['angry', 'sad', 'stressed', 'confused', 'fear']
    hint_system.update_state(is_confused, is_inactive)
    
    auto_hint = hint_system.check_for_hint(problem_id)
    
    # 4. Adaptive Check (If they've been at 100% confidence for a while or dropping)
    # We leave explicit problem switching out of the silent telemetry loop so the 
    # user's code is not abruptly wiped. They decide when to fetch next.
    
    # 5. Log Telemetry to Database
    db.log_telemetry(session_id, problem_id, current_emotion, current_confidence, active_cpm, error_rate, is_confused)

    return jsonify({
        "emotion": current_emotion,
        "confidence": current_confidence,
        "error_rate": error_rate,
        "auto_hint": auto_hint
    })

@app.route("/api/run_code", methods=["POST"])
def run_code():
    """
    Executes user code against test cases via the sandboxed runner.
    Accepts: problem_id, code, language (python|javascript), description, is_submit
    Returns: success, output, test_results, runtime_ms, line_markers
    """
    data = request.json
    problem_id   = data.get('problem_id', '')
    code         = data.get('code', '')
    language     = data.get('language', 'python').lower()
    description  = data.get('description', '')
    is_submit    = data.get('is_submit', False)

    # Run against test cases
    result = executor_run_tests(
        problem_id=problem_id,
        user_code=code,
        description_html=description,
        language=language,
    )

    success = result["success"]
    print(f"[run_code] problem={problem_id} lang={language} passed={success}")
    tracker.log_execution(problem_id, success)
    if is_submit:
        db.log_completion(session_id, problem_id, success)

    return jsonify({
        "success":      success,
        "output":       result["output"],
        "test_results": result["test_results"],
        "runtime_ms":   result["runtime_ms"],
        "line_markers": result.get("line_markers", []),
        "has_test_cases": result.get("has_test_cases", False),
    })

@app.route("/api/get_next_problem", methods=["POST"])
def get_next_problem():
    """Triggered explicitly by the UI when the user wants to move on."""
    try:
        # Determine target difficulty based on current confidence
        target_diff = engine.adjust_difficulty(current_confidence).upper()
        # Fetch a random offset for variety (0 to 100)
        import random
        random_skip = random.randint(0, 50)
        
        data = asyncio.run(fetch_leetcode_questions(difficulty=target_diff, limit=1, skip=random_skip))
        if data["questions"]:
            q = data["questions"][0]
            qdata = asyncio.run(fetch_question_content(q["titleSlug"]))
            problem = {
                "id":           q["titleSlug"],
                "title":        q["title"],
                "difficulty":   target_diff.lower(),
                "description":  qdata["content"],
                "codeSnippets": qdata["codeSnippets"],
                "sampleTestCase": qdata["sampleTestCase"],
                "tags":         q["topicTags"],
            }
            return jsonify({"problem": problem})
    except Exception as e:
        print(f"Error fetching next live question: {e}")

    # Fallback to mock logic
    new_prob = engine.select_problem(current_confidence)
    return jsonify({"problem": new_prob})

@app.route("/api/request_llm_hint", methods=["POST"])
def request_llm_hint():
    """Requests an explicit partial solution from OpenAI API."""
    data = request.json
    prob_title = data.get('title', 'Unknown Problem')
    prob_desc = data.get('description', '')
    code = data.get('code', '')
    
    hint = llm_agent.generate_partial_solution(prob_title, prob_desc, code)
    return jsonify({"hint": hint})

@app.route("/api/generate_scaffold", methods=["POST"])
def generate_scaffold():
    """Generates a boilerplate structure for a problem + language."""
    data = request.json
    prob_title = data.get('title', 'Unknown Problem')
    prob_desc = data.get('description', '')
    language = data.get('language', 'python')
    
    scaffold = llm_agent.generate_scaffold(prob_title, prob_desc, language)
    return jsonify({"scaffold": scaffold})

@app.route("/dashboard")
def dashboard():
    """Renders the Analytics Visualizer"""
    return render_template("dashboard.html")

@app.route("/api/questions", methods=["GET"])
def get_questions():
    """
    Fetches interview questions from LeetCode.
    Matches frontend params: ?difficulty=easy&limit=20&skip=0
    """
    difficulty = request.args.get('difficulty', 'easy')
    limit = int(request.args.get('limit', 20))
    skip = int(request.args.get('skip', 0))
    
    try:
        data = asyncio.run(fetch_leetcode_questions(difficulty=difficulty, limit=limit, skip=skip))
        # Keep total and questions keys to match frontend expectation
        return jsonify(data)
    except Exception as e:
        print(f"Error in /api/questions: {e}")
        return jsonify({"questions": [], "total": 0, "error": str(e)})

@app.route("/api/analytics_data", methods=["GET"])
def analytics_data():
    """Fetches structured analytics data from the SQLite DB"""
    return jsonify(db.get_analytics())

@app.route("/api/question/<slug>", methods=["GET"])
def get_question_content(slug):
    """
    Fetches the full problem data for a LeetCode slug.
    Returns: { content, sampleTestCase, exampleTestcases, codeSnippets }
    """
    try:
        qdata = asyncio.run(fetch_question_content(slug))
        return jsonify(qdata)
    except Exception as e:
        print(f"Error fetching question content for {slug}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=False)
