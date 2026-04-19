import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables (assumes .env is in project root or backend dir)
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: Supabase credentials not found in environment variables.")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL or "", SUPABASE_KEY or "")

app = FastAPI(title="SkillStack API", version="1.0.0")

# Setup CORS to allow Next.js/Vite frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to extract and verify the Supabase JWT
def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    # In a real scenario, we might verify the JWT here. 
    # For now, we'll pass it to Supabase client or trust the client ID in headers.
    return token

@app.get("/")
def read_root():
    return {"status": "ok", "message": "SkillStack API is running"}

@app.get("/api/users/{user_id}/dashboard")
def get_dashboard_data(user_id: str, token: str = Depends(verify_token)):
    """
    Fetch the user's dashboard data including skills and practice logs.
    """
    try:
        # Fetch skills
        skills_res = supabase.table("skills").select("*").eq("user_id", user_id).execute()
        
        # Fetch practice logs
        logs_res = supabase.table("practice_logs").select("*").eq("user_id", user_id).order("completed_at", desc=True).limit(5).execute()
        
        return {
            "skills": skills_res.data,
            "recent_logs": logs_res.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SkillUpdate(BaseModel):
    proficiency: int
    status: str

@app.put("/api/skills/{skill_id}")
def update_skill(skill_id: str, skill_update: SkillUpdate, token: str = Depends(verify_token)):
    """
    Update a skill's proficiency and status.
    """
    try:
        res = supabase.table("skills").update({
            "proficiency": skill_update.proficiency,
            "status": skill_update.status
        }).eq("id", skill_id).execute()
        
        if len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
