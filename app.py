import os
import cv2
import time
import base64
import numpy as np
from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model

# Project Modules
from adaptive_engine import AdaptiveEngine
from confidence_estimator import calculate_confidence_score
from error_tracker import ErrorTracker
from hint_system import RuleBasedHintSystem
from llm_integration import LLMHintGenerator
from database_manager import DatabaseManager
import uuid

app = Flask(__name__)

# System State
try:
    print("Loading models...")
    _emotion_model = load_model("emotion_model.h5")
    _emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    # Subset dummy labels for demo if full labels weren't trained properly 
    _dummy_labels = ['angry', 'happy', 'sad']
    
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    _face_cascade = cv2.CascadeClassifier(cascade_path)
except Exception as e:
    print(f"Warning: Model could not be loaded: {e}")

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
    problem = engine.select_problem(0.5) # Neutral start
    return jsonify({"problem": problem})

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
            faces = _face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
            
            # Grabbing the largest face logic
            if len(faces) > 0:
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                (x, y, w, h) = largest_face
                roi = gray[y:y+h, x:x+w]
                
                # Predict
                resized = cv2.resize(roi, (48, 48))
                reshaped = np.reshape(resized / 255.0, (1, 48, 48, 1))
                prediction = _emotion_model.predict(reshaped, verbose=0)
                max_idx = int(np.argmax(prediction))
                
                if prediction.shape[1] == 3:
                    emotion_found = _dummy_labels[max_idx]
                else:
                    emotion_found = _emotion_labels[max_idx] if max_idx < len(_emotion_labels) else "neutral"
        except Exception as e:
            print(f"Error processing frame: {e}")

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
    """Simulates code execution tracking."""
    data = request.json
    problem_id = data.get('problem_id')
    code = data.get('code', '')
    
    # Simplified Demo Logic: Assume it fails roughly 50% of the time, 
    # unless code is > 50 characters, then it succeeds.
    # In a real app, you would pass `code` to a sandboxed execution server (like Docker).
    success = len(code) > 50 
    
    print(f"Executing... Success: {success}")
    tracker.log_execution(problem_id, success)
    db.log_completion(session_id, problem_id, success)
    
    return jsonify({
        "success": success, 
        "output": "Code executed successfully!" if success else "Error: Syntax or Compilation Failure."
    })

@app.route("/api/get_next_problem", methods=["POST"])
def get_next_problem():
    """Triggered explicitly by the UI when the user wants to move on."""
    # Select using current rolling average confidence
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

@app.route("/dashboard")
def dashboard():
    """Renders the Analytics Visualizer"""
    return render_template("dashboard.html")

@app.route("/api/questions", methods=["GET"])
def get_questions():
    """
    Fetches interview questions categorized by difficulty levels.
    Endpoint: /api/questions?difficulty=easy&page=1&per_page=10
    """
    difficulty = request.args.get('difficulty')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    questions = db.get_questions(difficulty=difficulty, page=page, per_page=per_page)
    return jsonify({
        "status": "success",
        "count": len(questions),
        "page": page,
        "difficulty_filter": difficulty if difficulty else "all",
        "questions": questions
    })

@app.route("/api/analytics_data", methods=["GET"])
def analytics_data():
    """Fetches structured analytics data from the SQLite DB"""
    return jsonify(db.get_analytics())

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
