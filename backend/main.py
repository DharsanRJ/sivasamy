import os
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn
import shutil
import uuid
from backend.tasks import process_resume_task
# 1. FIX: Graceful handling of missing env variables
# ---------------------------------------------------------
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

# Create a global placeholder to avoid app crash on startup.
# We will raise 500 errors dynamically if routes are hit without credentials.
if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials missing. API will fail until .env is set.")
    supabase: Optional[Client] = None
else:
    supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY)


app = FastAPI(title="SkillStack API", version="1.0.0")

# ---------------------------------------------------------
# 2. FIX: Correct CORS Configuration
# ---------------------------------------------------------
# allow_origins=["*"] paired with allow_credentials=True is an invalid CORS policy
# and will be blocked by modern browsers. We must specify explicit origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 3. FIX: Safe JWT Token Extraction & Auth Client factory
# ---------------------------------------------------------
def verify_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
    token = authorization.split(" ")[1]
    return token

def get_supabase_client(token: str = Depends(verify_token)) -> Client:
    """
    Creates a scoped Supabase client per request using the user's JWT.
    This solves the Thread-Safety / Global State RLS issue!
    """
    if not supabase or not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Backend not configured with Supabase credentials.")
        
    # Instantiate a fresh client for this request to avoid race conditions
    scoped_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Inject the user's token directly into the headers of this scoped client 
    # so PostgreSQL Row Level Security (RLS) properly applies to this user!
    scoped_client.postgrest.auth(token)
    return scoped_client


@app.get("/")
def read_root() -> Dict[str, str]:
    return {"status": "ok", "message": "SkillStack API is running"}


@app.get("/api/users/{user_id}/dashboard")
def get_dashboard_data(
    user_id: str, 
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Fetch the user's dashboard data including skills and practice logs.
    """
    try:
        # Use the scoped `db` client instead of the global `supabase` client
        skills_res = db.table("skills").select("*").eq("user_id", user_id).execute()
        
        logs_res = db.table("practice_logs").select("*").eq("user_id", user_id).order("completed_at", desc=True).limit(5).execute()
        
        return {
            "skills": getattr(skills_res, "data", []),
            "recent_logs": getattr(logs_res, "data", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 4. FIX: Pydantic Data Validation
# ---------------------------------------------------------
# Prevent DB 500 errors by validating constraint bounds at the API level
class SkillUpdate(BaseModel):
    proficiency: int = Field(..., ge=1, le=5, description="Proficiency level between 1 and 5")
    status: str = Field(..., description="Must be Backlog, Learning, Practicing, or Mastered")


@app.put("/api/skills/{skill_id}")
def update_skill(
    skill_id: str, 
    skill_update: SkillUpdate, 
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Update a skill's proficiency and status.
    """
    # 5. FIX: Restrict status string to valid Enum values
    valid_statuses = ['Backlog', 'Learning', 'Practicing', 'Mastered']
    if skill_update.status not in valid_statuses:
         raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of {valid_statuses}")

    try:
        res = db.table("skills").update({
            "proficiency": skill_update.proficiency,
            "status": skill_update.status
        }).eq("id", skill_id).execute()
        
        data = getattr(res, "data", [])
        if not data or len(data) == 0:
            raise ValueError("Skill not found or you don't have permission to edit it")
            
        return {"status": "success", "data": data[0]}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from backend.ai_engine import generate_practice_tasks, generate_calibration_question, generate_mock_interview

class MockInterviewRequest(BaseModel):
    jd_text: str = Field(..., description="The Job Description text to base the interview on")

class NewSkillRequest(BaseModel):
    name: str = Field(..., min_length=1)
    proficiency: int = Field(1, ge=1, le=5)
    status: str = Field('Backlog')
    category: str = Field('General')

class LogSubmissionRequest(BaseModel):
    task_title: str
    feedback: str
    score: int = Field(100, ge=0, le=100)


@app.post("/api/users/{user_id}/generate-tasks")
def generate_user_tasks(
    user_id: str,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Calls the AI engine to generate strict JSON practice tasks based on the user's skills.
    """
    try:
        # 1. Fetch user's skills
        skills_res = db.table("skills").select("*").eq("user_id", user_id).execute()
        skills = getattr(skills_res, "data", [])
        
        if not skills:
            raise ValueError("No skills found to base tasks on.")
            
        # 2. Generate tasks via AI
        generated_tasks = generate_practice_tasks(skills)
        
        # In a full implementation, you could optionally save these to the database here.
        
        return {"status": "success", "data": generated_tasks}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/skills/{skill_id}/calibrate")
def calibrate_skill(
    skill_id: str,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Generates a calibration question for a specific skill.
    """
    try:
        # 1. Fetch the specific skill to get its name
        res = db.table("skills").select("*").eq("id", skill_id).execute()
        data = getattr(res, "data", [])
        if not data:
            raise ValueError("Skill not found or access denied.")
            
        skill_name = data[0].get("name")
        
        # 2. Generate calibration question
        question_data = generate_calibration_question(skill_name)
        
        return {"status": "success", "data": question_data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/skills")
def add_skill(
    user_id: str,
    skill_req: NewSkillRequest,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Add a new skill manually for a user."""
    valid_statuses = ['Backlog', 'Learning', 'Practicing', 'Mastered']
    if skill_req.status not in valid_statuses:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of {valid_statuses}")
    try:
        res = db.table("skills").insert({
            "user_id": user_id,
            "name": skill_req.name,
            "proficiency": skill_req.proficiency,
            "status": skill_req.status,
            "category": skill_req.category,
        }).execute()
        data = getattr(res, "data", [])
        if not data:
            raise ValueError("Insert failed")
        return {"status": "success", "data": data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/logs")
def get_practice_logs(
    user_id: str,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Fetch recent practice logs for the activity feed."""
    try:
        res = db.table("practice_logs").select("*").eq("user_id", user_id).order("completed_at", desc=True).limit(10).execute()
        return {"status": "success", "data": getattr(res, "data", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/logs")
def submit_lab_log(
    user_id: str,
    log_req: LogSubmissionRequest,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """Save a lab submission as a practice log."""
    try:
        res = db.table("practice_logs").insert({
            "user_id": user_id,
            "task_title": log_req.task_title,
            "feedback": log_req.feedback,
            "score": log_req.score,
        }).execute()
        return {"status": "success", "data": getattr(res, "data", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/interview/mock")
def create_mock_interview(
    user_id: str,
    request: MockInterviewRequest,
    db: Client = Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Generates a mock interview based on a JD and the user's current skills.
    """
    try:
        # 1. Fetch user's skills
        skills_res = db.table("skills").select("*").eq("user_id", user_id).execute()
        skills = getattr(skills_res, "data", [])
        
        if not skills:
            # Fallback to empty list if no skills, AI will just use JD
            skills = []
            
        # 2. Generate interview
        interview_data = generate_mock_interview(request.jd_text, skills)
        
        return {"status": "success", "data": interview_data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/{user_id}/resume/upload")
def upload_resume(
    user_id: str,
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Accepts a PDF resume, saves it temporarily, and triggers background processing.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # Create temp dir if not exists
        os.makedirs("tmp_resumes", exist_ok=True)
        
        # Save file locally
        file_path = f"tmp_resumes/{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Dispatch Celery background task
        # We pass the user's JWT token so the background task can authenticate with Supabase RLS
        process_resume_task.delay(user_id, file_path, token)
        
        return {
            "status": "success", 
            "message": "Resume uploaded successfully. Processing in background."
        }
    except Exception as e:
        import traceback
        print(f"UPLOAD FAILED ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
