import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
import cv2
import time
import base64
import numpy as np
import uuid
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends, APIRouter
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
from auth_utils import get_password_hash, verify_password, create_access_token, decode_access_token

app = FastAPI(title="FaceCode API", version="2.0")
router = APIRouter(prefix="/api")

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
    recent_emotions = [] # Keep track of last N emotions
    last_success = False

state = SessionState()

# --- Auth Dependencies ---
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.get_user_by_id(payload.get("sub"))
    return user

# --- Request Models ---
class TelemetryData(BaseModel):
    frame_data: Optional[str] = None
    cpm: int = 0
    is_inactive: bool = False
    problem_id: str = "easy_1"

class CodeExecutionRequest(BaseModel):
    problem_id: Optional[str] = None
    id: Optional[str] = None
    code: str
    language: Optional[str] = "python"
    is_submit: bool = False
    difficulty: str = "easy"
    tags: list[str] = []
    description: str = ""  # problem HTML for dynamic test extraction

    class Config:
        extra = "allow"

class LLMHintRequest(BaseModel):
    title: str
    description: str
    code: str
    class Config:
        extra = "allow"

class ScaffoldRequest(BaseModel):
    title: str
    description: str
    language: str
    class Config:
        extra = "allow"

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = ""

# --- Auth Endpoints ---
@router.post("/auth/register")
async def register(req: RegisterRequest):
    hashed = get_password_hash(req.password)
    user_id = db.create_user(req.username, hashed, req.full_name)
    if not user_id:
        raise HTTPException(status_code=400, detail="Username already exists")
    token = create_access_token({"sub": str(user_id)})
    return {"token": token, "username": req.username}

@router.post("/auth/login")
async def login(req: LoginRequest):
    user = db.get_user_by_username(req.username)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": str(user["id"])})
    return {"token": token, "username": req.username}

@router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Don't return password hash
    return {"id": user["id"], "username": user["username"], "full_name": user["full_name"]}

@router.get("/start_session")
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
                "titleSlug": q["titleSlug"], # Add slug for consistency
                "title": q["title"],
                "difficulty": "easy",
                "tags": q["topicTags"],
                **content # Flatten description, sampleTestCase, codeSnippets, etc.
            }
        else:
            problem = engine.select_problem(0.5)  # Fallback to local
    except Exception as e:
        print(f"Error starting session: {e}")
        problem = engine.select_problem(0.5)      # Fallback to local
    return {"problem": problem}

@router.post("/process_telemetry")
async def process_telemetry(data: TelemetryData, user = Depends(get_current_user)):
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
    
    # 3. Intervention Logic (Stress/Frustration detection)
    state.recent_emotions.append(emotion_found)
    if len(state.recent_emotions) > 10:
        state.recent_emotions.pop(0)
    
    # Suggest intervention if > 60% of recent emotions are negative
    neg_emotions = [e for e in state.recent_emotions if e in ['angry', 'sad', 'fear', 'disgust']]
    suggest_intervention = len(neg_emotions) > 6 and state.active_cpm < 10

    # 4. DB Logging
    user_id = user["id"] if user else None
    db.log_telemetry(session_id, problem_id, state.current_emotion, state.current_confidence, state.active_cpm, error_rate, is_confused, user_id=user_id)

    return {
        "emotion": state.current_emotion,
        "confidence": state.current_confidence,
        "error_rate": error_rate,
        "auto_hint": auto_hint,
        "suggest_intervention": suggest_intervention
    }

@router.post("/run_code")
async def run_code(req: CodeExecutionRequest, user = Depends(get_current_user)):
    try:
        from code_executor import run_tests
        duration = time.time() - state.problem_start_time
        
        # Use either id or problem_id
        actual_id = req.id or req.problem_id
        if not actual_id:
            raise HTTPException(status_code=400, detail="Missing problem ID")

        # Run against real test cases
        result = run_tests(actual_id, req.code, req.description)
        success = result["success"]

        print(f"[RunCode] Problem: {req.problem_id} (Diff: {req.difficulty}) | Success: {success} | Runtime: {result['runtime_ms']}ms | Duration: {duration:.1f}s")

        tracker.log_execution(req.problem_id, success)
        if req.is_submit:
            user_id = user["id"] if user else None
            db.log_completion(session_id, req.problem_id, success, duration if success else 0, req.difficulty, req.tags, user_id=user_id)

        return {
            "success": success,
            "output": result["output"],
            "test_results": result.get("test_results", []),
            "runtime_ms": result.get("runtime_ms", 0),
            "has_test_cases": result.get("has_test_cases", False),
            "suggest_levelup": success and req.difficulty.lower() in ['easy', 'medium'] # Suggest if passed easy/med
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

@router.post("/get_next_problem")
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
                "titleSlug": q["titleSlug"],
                "title": q["title"],
                "difficulty": target_difficulty.lower(),
                "tags": q["topicTags"],
                **content
            }
        else:
            problem = engine.select_problem(state.current_confidence) # Fallback
    except Exception as e:
        print(f"Error fetching next problem: {e}")
        problem = engine.select_problem(state.current_confidence)     # Fallback
        
    return {"problem": problem}

@router.post("/request_llm_hint")
async def request_llm_hint(req: LLMHintRequest):
    hint = llm_agent.generate_partial_solution(req.title, req.description, req.code)
    return {"hint": hint}

@router.post("/generate_scaffold")
async def generate_scaffold(req: ScaffoldRequest):
    scaffold = llm_agent.generate_scaffold(req.title, req.description, req.language)
    return {"scaffold": scaffold}

@router.get("/analytics_data")
async def get_analytics(user = Depends(get_current_user)):
    user_id = user["id"] if user else None
    return db.get_analytics(user_id=user_id)


@router.get("/questions")
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

@router.get("/question/{title_slug}")
async def get_question_details(title_slug: str):
    """
    GET /api/question/{title_slug}
    Fetches details for a specific LeetCode problem.
    """
    try:
        content = await fetch_question_content(title_slug)
        # We need to return an object that can be merged with the question list item
        return content
    except Exception as e:
        print(f"Error fetching question details for {title_slug}: {e}")
        raise HTTPException(status_code=502, detail=str(e))

# Include router
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    # Use string reference and reload=True for better development experience
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
