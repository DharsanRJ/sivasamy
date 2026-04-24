import os
import json
from pydantic import BaseModel, Field
from typing import List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. AI Generation will fail.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# ---------------------------------------------------------
# Strict Pydantic Schemas for Anti-Hallucination output
# ---------------------------------------------------------
class PracticeTaskResponse(BaseModel):
    title: str = Field(description="A concise, actionable title for the task.")
    description: str = Field(description="Detailed explanation of the task to be performed.")
    duration_minutes: int = Field(description="Estimated duration in minutes (e.g., 15, 30).")
    difficulty: str = Field(description="Difficulty level: Beginner, Intermediate, or Advanced.")
    criteria: List[str] = Field(description="A list of 3-4 specific acceptance criteria to consider the task complete.")

class AIResponseFormat(BaseModel):
    tasks: List[PracticeTaskResponse]

# ---------------------------------------------------------
# Core Generation Function
# ---------------------------------------------------------
def generate_practice_tasks(skills_data: list) -> dict:
    """
    Generates structured practice tasks based on the user's current skill matrix.
    Uses Gemini's structured output (JSON schema) capabilities.
    """
    if not GEMINI_API_KEY:
        raise ValueError("AI Engine is not configured (missing GEMINI_API_KEY).")
        
    # We use gemini-1.5-pro or flash as it supports structured outputs natively
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Build prompt context from the skills data
    skills_context = "\n".join(
        [f"- {s.get('name')} (Proficiency: {s.get('proficiency')}/5, Status: {s.get('status')})" for s in skills_data]
    )
    
    prompt = f"""
    You are an expert technical mentor. Based on the user's current skill matrix below, 
    generate 3 highly specific, actionable, real-world practice tasks they should complete today to improve.
    
    Current Skills:
    {skills_context}
    
    Rules:
    1. Tasks must be practical and project-based (no generic "read a tutorial").
    2. Focus on skills that are 'Learning' or 'Practicing' or have a proficiency < 4.
    3. Return exactly 3 tasks.
    """
    
    # Generate content with strict JSON schema enforcement
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=AIResponseFormat,
            temperature=0.2, # Low temperature for more deterministic, structured output
        )
    )
    
    # The output is guaranteed to be a JSON string matching the schema
    try:
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        print(f"Raw response: {response.text}")
        raise ValueError("Failed to generate valid structured tasks from AI.")

