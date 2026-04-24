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

class CalibrationQuestionFormat(BaseModel):
    question: str = Field(description="A challenging, situational multiple-choice question about the specific skill.")
    options: List[str] = Field(description="Exactly 4 distinct possible answers.")
    correct_answer: str = Field(description="The exact text of the correct option.")
    explanation: str = Field(description="Why the answer is correct and others are wrong.")

class InterviewQuestion(BaseModel):
    question: str = Field(description="A behavioral or technical interview question based on the JD.")
    expected_key_points: List[str] = Field(description="3-4 key points the candidate should mention in a strong answer.")
    difficulty: str = Field(description="Difficulty level: Beginner, Intermediate, or Advanced.")

class MockInterviewFormat(BaseModel):
    title: str = Field(description="A title for this interview session.")
    questions: List[InterviewQuestion]

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

def generate_calibration_question(skill_name: str) -> dict:
    """
    Generates a multiple choice question to validate a user's claimed skill level.
    """
    if not GEMINI_API_KEY:
        raise ValueError("AI Engine is not configured (missing GEMINI_API_KEY).")
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    You are a strict technical evaluator. The user claims to have strong proficiency in '{skill_name}'.
    Generate a challenging, situational multiple-choice question to validate their knowledge of advanced concepts in {skill_name}.
    Do not ask basic syntax questions; ask architectural or debugging questions.
    """
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=CalibrationQuestionFormat,
            temperature=0.3,
        )
    )
    
    try:
        return json.loads(response.text)
    except Exception as e:
        raise ValueError(f"Failed to generate valid calibration question: {e}")

def generate_mock_interview(jd_text: str, user_skills: list) -> dict:
    """
    Generates a structured mock interview based on a JD and the user's weaknesses.
    """
    if not GEMINI_API_KEY:
        raise ValueError("AI Engine is not configured (missing GEMINI_API_KEY).")
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    skills_context = "\n".join([f"- {s.get('name')} ({s.get('proficiency')}/5)" for s in user_skills])
    
    prompt = f"""
    You are an expert technical interviewer. Create a 3-question mock interview based on the following Job Description (JD).
    Also consider the candidate's current skills to focus on areas where they might be weak (lower proficiency).
    
    Candidate Skills:
    {skills_context}
    
    Job Description:
    {jd_text}
    """
    
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=MockInterviewFormat,
            temperature=0.3,
        )
    )
    
    try:
        return json.loads(response.text)
    except Exception as e:
        raise ValueError(f"Failed to generate valid mock interview: {e}")

