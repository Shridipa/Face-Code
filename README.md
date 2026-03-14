# 🧠 FaceCode — Adaptive AI Coding Platform

**FaceCode** is a next-generation intelligent coding environment that dynamically adapts its difficulty and provides real-time AI interventions based on your facial expressions, keystrokes, and live physiological confidence metrics.

By unifying a robust code execution sandbox with cutting-edge computer vision and natural language processing, FaceCode acts as a personalized, empathetic AI Mentor that knows precisely when you're frustrated, focused, or coasting.

---

## ✨ Core Features

1. **Real-Time webcam Telemetry**
   - **Emotion Recognition**: Utilizes `DeepFace` and `FER` to read live emotional states (e.g., Happy, Angry, Fear, Neutral).
   - **Confidence Estimation**: Computes a live "Focus & Confidence" percentage score utilizing `MediaPipe` head-pose approximations and facial landmark stability.
   - **Keystroke Dynamics**: Analyzes WPM (Words Per Minute), CPM (Characters Per Minute), and backspace frequency to track hesitation or coding flow blocks.

2. **Adaptive Difficulty Engine**
   - Calculates a true "Skill Rating" based on solve times, compilation errors, and emotional distress levels during a problem.
   - Automatically throttles or increases the difficulty of subsequent LeetCode challenges fetched from the backend to match the user's flow state optimally.

3. **Context-Aware AI Mentor Interventions**
   - If severe frustration (high anger/sadness + high cognitive load + compilation errors) is detected for an extended period, the AI Mentor (powered by LLMs like Groq/Llama3) triggers a **supportive intervention modal**.
   - Generates contextual hints without giving away the direct answer.

4. **Advanced Analytics Dashboard**
   - **Glassmorphism UI**: A gorgeous, strict monochrome + neon pastel interactive UI built with React.
   - **Efficiency Trends**: Live `<LineChart>` tracking Completion Time vs. Accuracy.
   - **Topic Mastery**: Dynamic CSS Grid Heatmap clustering coding topics by Weak/Moderate/Strong success rates.
   - **Emotional Insights**: Live `<PieChart>` distributing your session's mental state footprints.

---

## 🛠 Tech Stack

### Frontend
* **Core:** React 19, Vite, Javascript
* **UI/Styles:** Vanilla CSS (Glassmorphism design system), Lucide-React icons
* **Editor:** Monaco Editor (`@monaco-editor/react`)
* **Visualization:** Recharts (D3), SVG Progress Rings

### Backend
* **Core:** FastAPI, Python 3.10+
* **AI/CV Models:** OpenCV, DeepFace, MediaPipe, TensorFlow, PyTorch
* **LLM Integration:** Groq API (Llama3-8b-8192) for AI hints
* **Database:** SQLite3 for persistent metrics and adaptive telemetry logs

---

## 🚀 Local Installation

### Prerequisites
1. Python 3.10 or higher
2. Node.js 18+ and npm
3. A `Groq` API Key (for LLM hints)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/Shridipa/Face-Code.git
cd Face-Code

# Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure API Keys
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_key_here
```

### 3. Start the Backend API
Run the FastAPI server from the root directory:
```bash
python main.py
# The local AI models will initialize. The server will host on http://127.0.0.1:8000
```

### 4. Start the Frontend Application
Open a new terminal, navigate to the frontend folder:
```bash
cd frontend
npm install
npm run dev
# The React application will host on http://localhost:5173
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is proprietary and built for demonstration purposes.
