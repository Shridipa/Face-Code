import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import cv2
import time
import base64
import numpy as np
import uuid
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from deepface import DeepFace

# Project Modules
from adaptive_engine import AdaptiveEngine
from confidence_estimator import calculate_confidence_score
from error_tracker import ErrorTracker
from hint_system import RuleBasedHintSystem
from llm_integration import LLMHintGenerator
from database_manager import DatabaseManager
from leetcode_fetcher import fetch_leetcode_questions, fetch_question_content

app = FastAPI(title="FaceCode API", version="2.0")

# Enable CORS for React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State Initialization ---
# Skip pre-load for faster server startup to avoid ERR_CONNECTION_REFUSED on boot
# try:
#     print("Pre-loading DeepFace emotion model...")
#     _dummy_img = np.zeros((48, 48, 3), dtype=np.uint8)
#     DeepFace.analyze(_dummy_img, actions=['emotion'], enforce_detection=False, silent=True)
#     print("DeepFace emotion model loaded successfully.")
# except Exception as e:
#     print(f"Warning: DeepFace pre-load skipped: {e}. Model will load on first request.")


# Global Engine Instances
engine = AdaptiveEngine()
tracker = ErrorTracker()
hint_system = RuleBasedHintSystem(engine, confusion_threshold=6.0)
llm_agent = LLMHintGenerator()
db = DatabaseManager()
session_id = str(uuid.uuid4())

# Active Session Stats
class SessionState:
    active_cpm = 0
    is_inactive = False
    current_emotion = "neutral"
    current_confidence = 0.50
    problem_start_time = time.time()

state = SessionState()

# --- Request Models ---
class TelemetryData(BaseModel):
    frame_data: Optional[str] = None
    cpm: int = 0
    is_inactive: bool = False
    problem_id: str = "easy_1"

class CodeExecutionRequest(BaseModel):
    problem_id: str
    code: str
    is_submit: bool = False
    difficulty: str = "easy"
    tags: list[str] = []
    description: str = ""  # problem HTML for dynamic test extraction

class LLMHintRequest(BaseModel):
    title: str
    description: str
    code: str

# --- API Endpoints ---

@app.get("/api/start_session")
async def start_session():
    # Fetch a random Easy LeetCode problem to start
    state.problem_start_time = time.time()
    try:
        data = await fetch_leetcode_questions(difficulty="EASY", limit=1, skip=0)
        q = data["questions"][0] if data["questions"] else None
        if q:
            content = await fetch_question_content(q["titleSlug"])
            problem = {
                "id": q["titleSlug"],
                "title": q["title"],
                "difficulty": "easy",
                "description": content,
                "tags": q["topicTags"]
            }
        else:
            problem = engine.select_problem(0.5)  # Fallback to local
    except Exception:
        problem = engine.select_problem(0.5)      # Fallback to local
    return {"problem": problem}

@app.post("/api/process_telemetry")
async def process_telemetry(data: TelemetryData):
    state.active_cpm = data.cpm
    state.is_inactive = data.is_inactive
    problem_id = data.problem_id
    
    emotion_found = "neutral"
    
    # 1. Image Processing
    frame_data = data.frame_data
    if frame_data:
        try:
            # Decode base64
            if "," in frame_data:
                header, encoded = frame_data.split(",", 1)
            else:
                encoded = frame_data
                
            img_bytes = base64.b64decode(encoded)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
            res_dict = result[0] if isinstance(result, list) else result
            emotion_found = res_dict.get('dominant_emotion', 'neutral')
        except Exception as e:
            print(f"Error processing frame: {e}")

    state.current_emotion = emotion_found
    
    # 2. Logic Evaluation
    error_rate = tracker.get_error_rate(problem_id)
    state.current_confidence = calculate_confidence_score(state.current_emotion, state.active_cpm, error_rate, state.is_inactive)
    
    is_confused = state.current_emotion in ['angry', 'sad', 'stressed', 'confused', 'fear']
    hint_system.update_state(is_confused, state.is_inactive)
    auto_hint = hint_system.check_for_hint(problem_id)
    
    # 3. DB Logging
    db.log_telemetry(session_id, problem_id, state.current_emotion, state.current_confidence, state.active_cpm, error_rate, is_confused)

    return {
        "emotion": state.current_emotion,
        "confidence": state.current_confidence,
        "error_rate": error_rate,
        "auto_hint": auto_hint
    }

@app.post("/api/run_code")
async def run_code(req: CodeExecutionRequest):
    try:
        from code_executor import run_tests
        duration = time.time() - state.problem_start_time
        
        # Run against real test cases
        result = run_tests(req.problem_id, req.code, req.description)
        success = result["success"]

        print(f"[RunCode] Problem: {req.problem_id} (Diff: {req.difficulty}) | Success: {success} | Runtime: {result['runtime_ms']}ms | Duration: {duration:.1f}s")

        tracker.log_execution(req.problem_id, success)
        if req.is_submit:
            db.log_completion(session_id, req.problem_id, success, duration if success else 0, req.difficulty, req.tags)

        return {
            "success": success,
            "output": result["output"],
            "test_results": result.get("test_results", []),
            "runtime_ms": result.get("runtime_ms", 0),
            "has_test_cases": result.get("has_test_cases", False),
        }
    except Exception as e:
        print(f"[RunCode] CRITICAL ERROR: {e}")
        return {
            "success": False,
            "output": f"⚠️ Server Error during evaluation: {str(e)}",
            "test_results": [],
            "runtime_ms": 0,
            "has_test_cases": False,
        }

@app.post("/api/get_next_problem")
async def get_next_problem():
    state.problem_start_time = time.time()
    # Adaptive logic: determine target difficulty based on confidence
    target_difficulty = engine.adjust_difficulty(state.current_confidence)
    
    try:
        # Fetch 5 problems and pick one randomly so it's not always the same in the list
        import random
        # random skip between 0 and 20 to get variety
        skip_val = random.randint(0, 20)
        data = await fetch_leetcode_questions(difficulty=target_difficulty.upper(), limit=5, skip=skip_val)
        
        if data["questions"]:
            q = random.choice(data["questions"])
            content = await fetch_question_content(q["titleSlug"])
            problem = {
                "id": q["titleSlug"],
                "title": q["title"],
                "difficulty": target_difficulty.lower(),
                "description": content,
                "tags": q["topicTags"]
            }
        else:
            problem = engine.select_problem(state.current_confidence) # Fallback
    except Exception:
        problem = engine.select_problem(state.current_confidence)     # Fallback
        
    return {"problem": problem}

@app.post("/api/request_llm_hint")
async def request_llm_hint(req: LLMHintRequest):
    hint = llm_agent.generate_partial_solution(req.title, req.description, req.code)
    return {"hint": hint}

@app.get("/api/analytics_data")
async def get_analytics():
    return db.get_analytics()


@app.get("/api/questions")
async def get_leetcode_questions(
    difficulty: str = "easy",
    limit: int = 20,
    skip: int = 0,
):
    """
    GET /api/questions?difficulty=easy&limit=20&skip=0
    Fetches live LeetCode problems filtered by difficulty.
    """
    try:
        result = await fetch_leetcode_questions(
            difficulty=difficulty,
            limit=limit,
            skip=skip,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LeetCode API error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Use string reference and reload=True for better development experience
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
