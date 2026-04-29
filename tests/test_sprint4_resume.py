"""
Sprint 4 — Unit Tests: Asynchronous Processing & Resume Integration
===================================================================
Covers:
- FastAPI endpoint POST /api/users/{user_id}/resume/upload
- Celery worker task process_resume_task in backend/tasks.py
"""

import pytest
import os
import json
from unittest.mock import patch, MagicMock

# ═══════════════════════════════════════════════
# 1. FastAPI Upload Endpoint Tests
# ═══════════════════════════════════════════════

class TestResumeUploadEndpoint:
    def test_upload_valid_pdf_queues_task(self, client, auth_headers):
        """[Functional] A valid PDF triggers process_resume_task.delay()"""
        with patch("backend.main.process_resume_task") as mock_task:
            mock_task.delay = MagicMock()
            response = client.post(
                "/api/users/test-user-id/resume/upload",
                headers=auth_headers,
                files={"file": ("resume.pdf", b"%PDF-dummy-content", "application/pdf")}
            )
            assert response.status_code == 200
            assert "success" in response.json()["status"]
            
            # Verify Celery task was queued
            mock_task.delay.assert_called_once()
            
            # Verify arguments passed to delay: user_id, file_path, token
            args, kwargs = mock_task.delay.call_args
            assert args[0] == "test-user-id"
            assert "tmp_resumes" in args[1]
            assert args[2] == "fake-jwt-token-for-testing"

    def test_upload_creates_temp_file(self, client, auth_headers):
        """[Functional] The endpoint ensures the temp directory exists and copies the file"""
        with patch("backend.main.process_resume_task") as mock_task, \
             patch("backend.main.os.makedirs") as mock_makedirs, \
             patch("backend.main.shutil.copyfileobj") as mock_copy, \
             patch("builtins.open", create=True) as mock_open:
             
            mock_task.delay = MagicMock()
            response = client.post(
                "/api/users/test-user-id/resume/upload",
                headers=auth_headers,
                files={"file": ("resume.pdf", b"%PDF-dummy-content", "application/pdf")}
            )
            assert response.status_code == 200
            
            # Verify tmp_resumes dir was checked/created
            mock_makedirs.assert_called_with("tmp_resumes", exist_ok=True)
            
            # Verify file was opened and written to
            mock_open.assert_called_once()
            mock_copy.assert_called_once()


# ═══════════════════════════════════════════════
# 2. Celery Worker Logic Tests (process_resume_task)
# ═══════════════════════════════════════════════
import backend.tasks
from tests.conftest import celery_patcher

class TestProcessResumeTask:
    
    @classmethod
    def setup_class(cls):
        # Stop the global mock so we can test the actual function
        celery_patcher.stop()
        
    @classmethod
    def teardown_class(cls):
        # Restart the mock so other tests are not affected
        celery_patcher.start()
    
    @patch("backend.tasks.os.path.exists")
    @patch("backend.tasks.os.remove")
    @patch("backend.tasks.create_client")
    @patch("backend.tasks.genai.GenerativeModel")
    @patch("backend.tasks.PyPDF2.PdfReader")
    @patch("builtins.open")
    def test_process_resume_task_success(
        self, mock_open, mock_pdf_reader, mock_genai, mock_create_client, mock_exists, mock_remove
    ):
        """[Functional] Tests the complete happy path of the background worker."""
        # 1. Setup PyPDF2 mock
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Python React Developer"
        mock_pdf_reader.return_value.pages = [mock_page]
        
        # 2. Setup Gemini AI mock
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "skills": [
                {"name": "Python", "proficiency": 4, "status": "Mastered"},
                {"name": "React", "proficiency": 3, "status": "Practicing"}
            ],
            "resume_review": "Great Python experience. Needs more React."
        })
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # 3. Setup Supabase mock
        mock_db = MagicMock()
        mock_create_client.return_value = mock_db
        
        mock_exists.return_value = True

        # Ensure env vars are mocked out so it passes config checks
        with patch("backend.tasks.GEMINI_API_KEY", "fake-key"), \
             patch("backend.tasks.SUPABASE_URL", "fake-url"), \
             patch("backend.tasks.SUPABASE_KEY", "fake-key"):
             
            # Execute the task
            result = backend.tasks.process_resume_task("user_123", "tmp/fake.pdf", "fake-token")
            
            # Assert successful execution
            assert result["status"] == "success"
            assert result["skills_added"] == 2
            
            # Verify Supabase client was scoped with the passed user token
            mock_db.postgrest.auth.assert_called_with("fake-token")
            
            # Verify Database insertions (2 skills + 1 log = 3 inserts)
            assert mock_db.table.call_count >= 3
            mock_db.table.assert_any_call("skills")
            mock_db.table.assert_any_call("practice_logs")
            
            # Verify temporary file cleanup
            mock_remove.assert_called_with("tmp/fake.pdf")

    @patch("backend.tasks.GEMINI_API_KEY", "")
    def test_process_resume_missing_api_keys(self):
        """[Negative] The task should exit gracefully if AI keys are missing."""
        with patch("builtins.open"), patch("backend.tasks.PyPDF2.PdfReader"):
            result = backend.tasks.process_resume_task("user_123", "tmp/fake.pdf", "fake-token")
            
            assert result["status"] == "error"
            assert "Missing AI key" in result["message"]

    @patch("backend.tasks.create_client")
    @patch("backend.tasks.genai.GenerativeModel")
    @patch("backend.tasks.PyPDF2.PdfReader")
    @patch("builtins.open")
    def test_process_resume_db_failure(self, mock_open, mock_pdf, mock_genai, mock_create_client):
        """[Negative] The task should catch database errors without crashing the worker."""
        # Setup Gemini mock
        mock_response = MagicMock()
        mock_response.text = json.dumps({"skills": [], "resume_review": "Good."})
        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Setup Supabase mock to throw an exception
        mock_db = MagicMock()
        mock_db.table.side_effect = Exception("Database connection failed")
        mock_create_client.return_value = mock_db
        
        with patch("backend.tasks.GEMINI_API_KEY", "fake-key"), \
             patch("backend.tasks.SUPABASE_URL", "fake-url"), \
             patch("backend.tasks.SUPABASE_KEY", "fake-key"):
             
            result = backend.tasks.process_resume_task("user_123", "tmp/fake.pdf", "fake-token")
            
            assert result["status"] == "error"
            assert "Database connection failed" in result["message"]
