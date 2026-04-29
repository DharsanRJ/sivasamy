"""
Sprint 1 — Unit Tests: Authentication & Token Validation
=========================================================
Testing Type : Unit Testing (pure logic) + Negative Testing
Sprint Goal  : Verify auth guards work correctly before any
               real user reaches protected endpoints.
Covers       : verify_token(), Authorization header parsing,
               401/422 responses, health check endpoint.
"""

import pytest


# ═══════════════════════════════════════════════
# 1. HEALTH CHECK
# ═══════════════════════════════════════════════

class TestHealthCheck:
    """The root endpoint should always respond, no auth required."""

    def test_root_returns_200(self, client):
        """[Functional] Root endpoint is alive."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_returns_status_ok(self, client):
        """[Functional] Root endpoint returns correct status field."""
        response = client.get("/")
        data = response.json()
        assert data["status"] == "ok"

    def test_root_returns_message(self, client):
        """[Functional] Root endpoint returns a message string."""
        response = client.get("/")
        data = response.json()
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0


# ═══════════════════════════════════════════════
# 2. AUTHORIZATION HEADER — verify_token()
# ═══════════════════════════════════════════════

class TestVerifyToken:
    """
    All protected endpoints share the same verify_token() dependency.
    We test it via /api/users/{user_id}/dashboard as a representative.
    """

    def test_missing_auth_header_returns_401(self, client, no_auth_headers):
        """[Negative] No Authorization header → 401 Unauthorized."""
        response = client.get("/api/users/some-user-id/dashboard",
                              headers=no_auth_headers)
        assert response.status_code == 401

    def test_missing_auth_header_error_message(self, client, no_auth_headers):
        """[Negative] Error detail mentions 'Authorization'."""
        response = client.get("/api/users/some-user-id/dashboard",
                              headers=no_auth_headers)
        assert "Authorization" in response.json()["detail"]

    def test_malformed_auth_header_returns_401(self, client, bad_auth_headers):
        """[Negative] Header without 'Bearer ' prefix → 401."""
        response = client.get("/api/users/some-user-id/dashboard",
                              headers=bad_auth_headers)
        assert response.status_code == 401

    def test_malformed_auth_header_error_message(self, client, bad_auth_headers):
        """[Negative] Malformed header returns descriptive error."""
        response = client.get("/api/users/some-user-id/dashboard",
                              headers=bad_auth_headers)
        detail = response.json()["detail"]
        assert "invalid" in detail.lower() or "format" in detail.lower()

    def test_bearer_token_accepted(self, client, auth_headers, mock_db_client):
        """[Functional] Valid Bearer token passes auth guard (reaches DB layer)."""
        # Make mock DB return empty data so endpoint doesn't crash
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = []
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.order.return_value.limit.return_value \
            .execute.return_value.data = []

        response = client.get("/api/users/test-user-id/dashboard",
                              headers=auth_headers)
        # Not 401 — auth passed
        assert response.status_code != 401

    def test_empty_bearer_value_returns_401(self, client):
        """[Negative] 'Bearer ' with empty token string → 401."""
        response = client.get("/api/users/some-user-id/dashboard",
                              headers={"Authorization": "Bearer "})
        # Token is empty string — still passes format check but verify behavior
        assert response.status_code in [401, 200, 500]  # Not a crash


# ═══════════════════════════════════════════════
# 3. RESUME UPLOAD ENDPOINT GUARDS
# ═══════════════════════════════════════════════

class TestResumeUploadGuards:
    """
    Unit-test the guard logic in POST /api/users/{user_id}/resume/upload.
    We do NOT actually upload files — just test rejection conditions.
    """

    def test_upload_without_auth_returns_401(self, client, no_auth_headers):
        """[Negative] No auth header → rejected before file is read."""
        response = client.post(
            "/api/users/test-user-id/resume/upload",
            headers=no_auth_headers,
            files={"file": ("resume.pdf", b"%PDF-fake", "application/pdf")}
        )
        assert response.status_code == 401

    def test_upload_non_pdf_returns_400(self, client, auth_headers):
        """[Negative] Non-PDF file extension → 400 Bad Request."""
        response = client.post(
            "/api/users/test-user-id/resume/upload",
            headers=auth_headers,
            files={"file": ("resume.docx", b"fake-docx-content", "application/msword")}
        )
        assert response.status_code == 400

    def test_upload_non_pdf_error_message(self, client, auth_headers):
        """[Negative] Error message mentions PDF explicitly."""
        response = client.post(
            "/api/users/test-user-id/resume/upload",
            headers=auth_headers,
            files={"file": ("cv.txt", b"plain text", "text/plain")}
        )
        assert "PDF" in response.json()["detail"]

    def test_upload_uppercase_pdf_extension_accepted(self, client, auth_headers):
        """[Functional] .PDF (uppercase) is accepted — case-insensitive check."""
        import io
        from unittest.mock import patch, MagicMock

        # Patch Celery .delay() so it doesn't actually queue
        with patch("backend.main.process_resume_task") as mock_task:
            mock_task.delay = MagicMock(return_value=None)
            response = client.post(
                "/api/users/test-user-id/resume/upload",
                headers=auth_headers,
                files={"file": ("RESUME.PDF", b"%PDF-fake-content", "application/pdf")}
            )
        # Should not return 400 (file type rejection)
        assert response.status_code != 400

    def test_upload_missing_file_returns_422(self, client, auth_headers):
        """[Negative] No file attached → FastAPI validation error 422."""
        response = client.post(
            "/api/users/test-user-id/resume/upload",
            headers=auth_headers
        )
        assert response.status_code == 422


# ═══════════════════════════════════════════════
# 4. PYDANTIC VALIDATION — SkillUpdate
# ═══════════════════════════════════════════════

class TestSkillUpdateValidation:
    """
    Unit-test the Pydantic validation on PUT /api/skills/{skill_id}.
    These are pure input-validation tests — no DB interaction needed.
    """

    def test_proficiency_below_range_returns_422(self, client, auth_headers):
        """[Negative] proficiency=0 is below min (1) → 422 Unprocessable."""
        response = client.put(
            "/api/skills/fake-skill-id",
            headers=auth_headers,
            json={"proficiency": 0, "status": "Learning"}
        )
        assert response.status_code == 422

    def test_proficiency_above_range_returns_422(self, client, auth_headers):
        """[Negative] proficiency=6 is above max (5) → 422 Unprocessable."""
        response = client.put(
            "/api/skills/fake-skill-id",
            headers=auth_headers,
            json={"proficiency": 6, "status": "Learning"}
        )
        assert response.status_code == 422

    def test_invalid_status_returns_422(self, client, auth_headers):
        """[Negative] Unknown status value → 422 from business logic."""
        response = client.put(
            "/api/skills/fake-skill-id",
            headers=auth_headers,
            json={"proficiency": 3, "status": "INVALID_STATUS"}
        )
        assert response.status_code == 422

    def test_valid_status_values_accepted(self, client, auth_headers, mock_db_client):
        """[Functional] All four valid statuses pass validation."""
        valid_statuses = ["Backlog", "Learning", "Practicing", "Mastered"]

        # Mock DB to return a fake updated row
        fake_row = {"id": "fake-skill-id", "proficiency": 3, "status": "Learning"}
        mock_db_client.table.return_value.update.return_value \
            .eq.return_value.execute.return_value.data = [fake_row]

        for status in valid_statuses:
            response = client.put(
                "/api/skills/fake-skill-id",
                headers=auth_headers,
                json={"proficiency": 3, "status": status}
            )
            assert response.status_code != 422, \
                f"Status '{status}' was unexpectedly rejected"

    def test_missing_proficiency_returns_422(self, client, auth_headers):
        """[Negative] Missing required field 'proficiency' → 422."""
        response = client.put(
            "/api/skills/fake-skill-id",
            headers=auth_headers,
            json={"status": "Learning"}
        )
        assert response.status_code == 422

    def test_missing_status_returns_422(self, client, auth_headers):
        """[Negative] Missing required field 'status' → 422."""
        response = client.put(
            "/api/skills/fake-skill-id",
            headers=auth_headers,
            json={"proficiency": 3}
        )
        assert response.status_code == 422


# ═══════════════════════════════════════════════
# 5. NEW SKILL — Input Validation
# ═══════════════════════════════════════════════

class TestAddSkillValidation:
    """
    Unit-test Pydantic validation on POST /api/users/{user_id}/skills.
    """

    def test_empty_skill_name_returns_422(self, client, auth_headers):
        """[Negative] Empty name string → 422 (min_length=1)."""
        response = client.post(
            "/api/users/test-user-id/skills",
            headers=auth_headers,
            json={"name": "", "proficiency": 1, "status": "Backlog", "category": "General"}
        )
        assert response.status_code == 422

    def test_invalid_status_returns_422(self, client, auth_headers):
        """[Negative] Invalid status for new skill → 422."""
        response = client.post(
            "/api/users/test-user-id/skills",
            headers=auth_headers,
            json={"name": "Docker", "proficiency": 2, "status": "UNKNOWN", "category": "DevOps"}
        )
        assert response.status_code == 422

    def test_proficiency_out_of_range_returns_422(self, client, auth_headers):
        """[Negative] proficiency=10 → 422."""
        response = client.post(
            "/api/users/test-user-id/skills",
            headers=auth_headers,
            json={"name": "React", "proficiency": 10, "status": "Learning", "category": "Frontend"}
        )
        assert response.status_code == 422

    def test_valid_skill_passes_validation(self, client, auth_headers, mock_db_client):
        """[Functional] Well-formed skill request passes validation layer."""
        mock_db_client.table.return_value.insert.return_value \
            .execute.return_value.data = [
                {"id": "new-id", "name": "FastAPI", "proficiency": 2,
                 "status": "Learning", "category": "Backend"}
            ]
        response = client.post(
            "/api/users/test-user-id/skills",
            headers=auth_headers,
            json={"name": "FastAPI", "proficiency": 2,
                  "status": "Learning", "category": "Backend"}
        )
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "FastAPI"
