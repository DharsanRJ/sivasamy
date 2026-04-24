import os
import json
import PyPDF2
from backend.celery_app import celery_app
from backend.ai_engine import GEMINI_API_KEY, genai
from pydantic import BaseModel, Field
from typing import List
from supabase import create_client

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

class ExtractedSkill(BaseModel):
    name: str = Field(description="Name of the technical skill or technology.")
    proficiency: int = Field(description="Estimated proficiency 1-5 based on context (e.g. years of experience mentioned). Default 2 if unsure.")
    status: str = Field(description="Must be 'Learning' if basic/new, 'Practicing' if intermediate, 'Mastered' if advanced.")

class ResumeAnalysisFormat(BaseModel):
    skills: List[ExtractedSkill]

@celery_app.task
def process_resume_task(user_id: str, file_path: str, token: str):
    """
    Background task to parse a PDF resume and extract skills into the DB.
    """
    try:
        # 1. Extract Text from PDF
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
                
        # 2. Ask Gemini to extract skills using Structured Output
        if not GEMINI_API_KEY:
            return {"status": "error", "message": "Missing AI key"}
            
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Extract the top 10 technical skills from the following resume text.
        Estimate proficiency (1-5) based on how prominently they are featured or years of experience mentioned.
        
        Resume:
        {text}
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ResumeAnalysisFormat,
                temperature=0.1,
            )
        )
        
        extracted_data = json.loads(response.text)
        
        # 3. Save to Supabase
        if not SUPABASE_URL or not SUPABASE_KEY:
             return {"status": "error", "message": "Missing Supabase config"}
             
        # Create scoped client using the passed user token so RLS passes
        db = create_client(SUPABASE_URL, SUPABASE_KEY)
        db.postgrest.auth(token)
        
        for skill in extracted_data.get("skills", []):
            db.table("skills").insert({
                "user_id": user_id,
                "name": skill["name"],
                "proficiency": skill["proficiency"],
                "status": skill["status"]
            }).execute()
            
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"status": "success", "skills_added": len(extracted_data.get("skills", []))}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@celery_app.task
def friday_project_task():
    """
    Scheduled task that runs every Friday to generate projects.
    """
    print("Executing Friday Weekly Project Generation...")
    # In a full production app, this would iterate over users in the DB
    # and call the AI engine to generate custom projects based on their weak skills.
    return {"status": "success", "message": "Friday projects triggered."}
