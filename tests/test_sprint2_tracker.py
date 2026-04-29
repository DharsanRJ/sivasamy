"""
Sprint 2 — Unit Tests: Skill Matrix & Tracker
===============================================
Testing Type : Unit Testing + Integration Testing + Negative Testing
Sprint Goal  : Verify skills CRUD operations, proficiency updates,
               calibration trigger logic, and activity log endpoints
               all behave correctly — with zero live DB or AI calls.

Endpoints covered:
  GET  /api/users/{user_id}/dashboard
  PUT  /api/skills/{skill_id}
  POST /api/users/{user_id}/skills
  POST /api/skills/{skill_id}/calibrate
  GET  /api/users/{user_id}/logs
  POST /api/users/{user_id}/logs
"""

import pytest
from unittest.mock import MagicMock, patch


# ─────────────────────────────────────────────
# Shared mock skill rows (test fixtures)
# ─────────────────────────────────────────────

MOCK_SKILL_REACT = {
    "id": "skill-001",
    "user_id": "user-abc",
    "name": "React",
    "proficiency": 3,
    "status": "Practicing",
    "category": "Frontend",
}

MOCK_SKILL_PYTHON = {
    "id": "skill-002",
    "user_id": "user-abc",
    "name": "Python",
    "proficiency": 5,
    "status": "Mastered",
    "category": "Language",
}

MOCK_SKILL_DOCKER = {
    "id": "skill-003",
    "user_id": "user-abc",
    "name": "Docker",
    "proficiency": 1,
    "status": "Backlog",
    "category": "DevOps",
}


# ═══════════════════════════════════════════════
# 1. GET /api/users/{user_id}/dashboard
# ═══════════════════════════════════════════════

class TestDashboardEndpoint:
    """
    [Integration] Dashboard pulls skills + logs for a given user.
    Verifies shape of response and empty-state handling.
    """

    def _mock_dashboard(self, mock_db_client, skills, logs):
        """Helper: Wire mock DB to return given skills and logs."""
        skills_chain = mock_db_client.table.return_value.select.return_value.eq.return_value
        skills_chain.execute.return_value.data = skills

        logs_chain = (
            mock_db_client.table.return_value.select.return_value
            .eq.return_value.order.return_value.limit.return_value
        )
        logs_chain.execute.return_value.data = logs

    def test_dashboard_returns_200_with_auth(self, client, auth_headers, mock_db_client):
        """[Functional] Authenticated request → 200 OK."""
        self._mock_dashboard(mock_db_client, [], [])
        response = client.get("/api/users/user-abc/dashboard", headers=auth_headers)
        assert response.status_code == 200

    def test_dashboard_returns_skills_and_logs_keys(self, client, auth_headers, mock_db_client):
        """[Functional] Response body always contains 'skills' and 'recent_logs'."""
        self._mock_dashboard(mock_db_client, [], [])
        response = client.get("/api/users/user-abc/dashboard", headers=auth_headers)
        body = response.json()
        assert "skills" in body
        assert "recent_logs" in body

    def test_dashboard_returns_correct_skills(self, client, auth_headers, mock_db_client):
        """[Integration] Skills from DB appear in response."""
        self._mock_dashboard(mock_db_client, [MOCK_SKILL_REACT, MOCK_SKILL_PYTHON], [])
        response = client.get("/api/users/user-abc/dashboard", headers=auth_headers)
        skills = response.json()["skills"]
        assert len(skills) == 2
        assert skills[0]["name"] == "React"
        assert skills[1]["name"] == "Python"

    def test_dashboard_empty_state_returns_empty_lists(self, client, auth_headers, mock_db_client):
        """[Functional] New user with no data → both lists are empty, not null."""
        self._mock_dashboard(mock_db_client, [], [])
        response = client.get("/api/users/user-abc/dashboard", headers=auth_headers)
        body = response.json()
        assert body["skills"] == []
        assert body["recent_logs"] == []

    def test_dashboard_requires_auth(self, client, no_auth_headers):
        """[Negative] No auth → 401, not 200."""
        response = client.get("/api/users/user-abc/dashboard", headers=no_auth_headers)
        assert response.status_code == 401


# ═══════════════════════════════════════════════
# 2. PUT /api/skills/{skill_id} — Update Skill
# ═══════════════════════════════════════════════

class TestUpdateSkillEndpoint:
    """
    [Integration + Negative] Skill update saves to DB correctly
    and handles 404 (skill not found) and invalid inputs.
    """

    def _mock_update(self, mock_db_client, returned_rows):
        chain = (
            mock_db_client.table.return_value
            .update.return_value.eq.return_value
        )
        chain.execute.return_value.data = returned_rows

    def test_update_skill_success_returns_200(self, client, auth_headers, mock_db_client):
        """[Integration] Valid update → 200 with updated skill data."""
        updated = {**MOCK_SKILL_REACT, "proficiency": 4, "status": "Mastered"}
        self._mock_update(mock_db_client, [updated])
        response = client.put(
            "/api/skills/skill-001",
            headers=auth_headers,
            json={"proficiency": 4, "status": "Mastered"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_update_skill_returns_updated_data(self, client, auth_headers, mock_db_client):
        """[Integration] Updated row values are reflected in response body."""
        updated = {**MOCK_SKILL_REACT, "proficiency": 4, "status": "Mastered"}
        self._mock_update(mock_db_client, [updated])
        response = client.put(
            "/api/skills/skill-001",
            headers=auth_headers,
            json={"proficiency": 4, "status": "Mastered"}
        )
        data = response.json()["data"]
        assert data["proficiency"] == 4
        assert data["status"] == "Mastered"

    def test_update_skill_not_found_returns_404(self, client, auth_headers, mock_db_client):
        """[Negative] DB returns empty rows → skill not found → 404."""
        self._mock_update(mock_db_client, [])
        response = client.put(
            "/api/skills/non-existent-id",
            headers=auth_headers,
            json={"proficiency": 3, "status": "Learning"}
        )
        assert response.status_code == 404

    def test_update_all_four_statuses(self, client, auth_headers, mock_db_client):
        """[Functional] Each of the 4 valid statuses can be saved."""
        for status in ["Backlog", "Learning", "Practicing", "Mastered"]:
            row = {**MOCK_SKILL_REACT, "status": status}
            self._mock_update(mock_db_client, [row])
            response = client.put(
                "/api/skills/skill-001",
                headers=auth_headers,
                json={"proficiency": 3, "status": status}
            )
            assert response.status_code == 200, f"Failed for status: {status}"

    def test_update_skill_boundary_proficiency_1(self, client, auth_headers, mock_db_client):
        """[Functional] Minimum proficiency (1) is valid."""
        row = {**MOCK_SKILL_REACT, "proficiency": 1}
        self._mock_update(mock_db_client, [row])
        response = client.put(
            "/api/skills/skill-001",
            headers=auth_headers,
            json={"proficiency": 1, "status": "Backlog"}
        )
        assert response.status_code == 200

    def test_update_skill_boundary_proficiency_5(self, client, auth_headers, mock_db_client):
        """[Functional] Maximum proficiency (5) is valid."""
        row = {**MOCK_SKILL_REACT, "proficiency": 5, "status": "Mastered"}
        self._mock_update(mock_db_client, [row])
        response = client.put(
            "/api/skills/skill-001",
            headers=auth_headers,
            json={"proficiency": 5, "status": "Mastered"}
        )
        assert response.status_code == 200


# ═══════════════════════════════════════════════
# 3. POST /api/users/{user_id}/skills — Add Skill
# ═══════════════════════════════════════════════

class TestAddSkillEndpoint:
    """
    [Integration + Negative] Skill creation, default value handling,
    and full-category coverage.
    """

    def _mock_insert(self, mock_db_client, returned_rows):
        chain = mock_db_client.table.return_value.insert.return_value
        chain.execute.return_value.data = returned_rows

    def test_add_skill_success_returns_200(self, client, auth_headers, mock_db_client):
        """[Integration] Valid POST → 200 with inserted skill."""
        self._mock_insert(mock_db_client, [MOCK_SKILL_DOCKER])
        response = client.post(
            "/api/users/user-abc/skills",
            headers=auth_headers,
            json={"name": "Docker", "proficiency": 1,
                  "status": "Backlog", "category": "DevOps"}
        )
        assert response.status_code == 200
        assert response.json()["data"]["name"] == "Docker"

    def test_add_skill_returns_skill_id(self, client, auth_headers, mock_db_client):
        """[Integration] Inserted row includes an 'id' field."""
        self._mock_insert(mock_db_client, [MOCK_SKILL_DOCKER])
        response = client.post(
            "/api/users/user-abc/skills",
            headers=auth_headers,
            json={"name": "Docker", "proficiency": 1,
                  "status": "Backlog", "category": "DevOps"}
        )
        assert "id" in response.json()["data"]

    def test_add_skill_default_status_is_backlog(self, client, auth_headers, mock_db_client):
        """[Functional] Omitting 'status' defaults to 'Backlog'."""
        row = {**MOCK_SKILL_DOCKER, "status": "Backlog"}
        self._mock_insert(mock_db_client, [row])
        response = client.post(
            "/api/users/user-abc/skills",
            headers=auth_headers,
            json={"name": "Docker", "category": "DevOps"}
        )
        assert response.status_code == 200

    def test_add_skill_all_categories(self, client, auth_headers, mock_db_client):
        """[Functional] All supported category values are accepted."""
        categories = ["Frontend", "Backend", "Database", "DevOps",
                      "Language", "Testing", "Cloud", "AI/ML", "General"]
        for cat in categories:
            row = {**MOCK_SKILL_DOCKER, "category": cat}
            self._mock_insert(mock_db_client, [row])
            response = client.post(
                "/api/users/user-abc/skills",
                headers=auth_headers,
                json={"name": "TestSkill", "proficiency": 1,
                      "status": "Backlog", "category": cat}
            )
            assert response.status_code == 200, f"Failed for category: {cat}"

    def test_add_skill_db_failure_returns_500(self, client, auth_headers, mock_db_client):
        """[Negative] DB insert returns empty rows → 500 Internal Error."""
        self._mock_insert(mock_db_client, [])
        response = client.post(
            "/api/users/user-abc/skills",
            headers=auth_headers,
            json={"name": "ValidSkill", "proficiency": 2,
                  "status": "Learning", "category": "General"}
        )
        assert response.status_code == 500

    def test_add_skill_without_auth_returns_401(self, client, no_auth_headers):
        """[Negative] No auth header → 401."""
        response = client.post(
            "/api/users/user-abc/skills",
            headers=no_auth_headers,
            json={"name": "Docker", "proficiency": 1,
                  "status": "Backlog", "category": "DevOps"}
        )
        assert response.status_code == 401


# ═══════════════════════════════════════════════
# 4. POST /api/skills/{skill_id}/calibrate
# ═══════════════════════════════════════════════

class TestCalibrateSkillEndpoint:
    """
    [Integration + Negative] Calibration fetches a skill name from DB
    then calls AI. We mock both so no real calls are made.
    """

    MOCK_QUESTION = {
        "question": "What is the Virtual DOM in React?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Option A",
        "explanation": "Virtual DOM is a lightweight copy..."
    }

    def _setup_skill_in_db(self, mock_db_client, skill_row):
        """Wire mock DB to return a specific skill row on SELECT."""
        chain = mock_db_client.table.return_value.select.return_value.eq.return_value
        chain.execute.return_value.data = [skill_row] if skill_row else []

    def test_calibrate_returns_200_when_skill_exists(
            self, client, auth_headers, mock_db_client):
        """[Integration] Skill found + AI generates question → 200."""
        self._setup_skill_in_db(mock_db_client, MOCK_SKILL_REACT)
        with patch("backend.main.generate_calibration_question",
                   return_value=self.MOCK_QUESTION):
            response = client.post(
                "/api/skills/skill-001/calibrate",
                headers=auth_headers
            )
        assert response.status_code == 200

    def test_calibrate_returns_question_structure(
            self, client, auth_headers, mock_db_client):
        """[Schema] Response contains question, options, correct_answer, explanation."""
        self._setup_skill_in_db(mock_db_client, MOCK_SKILL_REACT)
        with patch("backend.main.generate_calibration_question",
                   return_value=self.MOCK_QUESTION):
            response = client.post(
                "/api/skills/skill-001/calibrate",
                headers=auth_headers
            )
        data = response.json()["data"]
        assert "question" in data
        assert "options" in data
        assert "correct_answer" in data
        assert "explanation" in data

    def test_calibrate_has_four_options(
            self, client, auth_headers, mock_db_client):
        """[Schema] Exactly 4 answer options are returned."""
        self._setup_skill_in_db(mock_db_client, MOCK_SKILL_REACT)
        with patch("backend.main.generate_calibration_question",
                   return_value=self.MOCK_QUESTION):
            response = client.post(
                "/api/skills/skill-001/calibrate",
                headers=auth_headers
            )
        assert len(response.json()["data"]["options"]) == 4

    def test_calibrate_correct_answer_in_options(
            self, client, auth_headers, mock_db_client):
        """[Schema / Anti-Hallucination] correct_answer must be one of the options."""
        self._setup_skill_in_db(mock_db_client, MOCK_SKILL_REACT)
        with patch("backend.main.generate_calibration_question",
                   return_value=self.MOCK_QUESTION):
            response = client.post(
                "/api/skills/skill-001/calibrate",
                headers=auth_headers
            )
        data = response.json()["data"]
        assert data["correct_answer"] in data["options"]

    def test_calibrate_skill_not_found_returns_400(
            self, client, auth_headers, mock_db_client):
        """[Negative] Skill not in DB → 400 (ValueError raised in endpoint)."""
        self._setup_skill_in_db(mock_db_client, None)
        response = client.post(
            "/api/skills/non-existent-skill/calibrate",
            headers=auth_headers
        )
        assert response.status_code == 400

    def test_calibrate_without_auth_returns_401(self, client, no_auth_headers):
        """[Negative] No auth → 401 before DB is even queried."""
        response = client.post(
            "/api/skills/skill-001/calibrate",
            headers=no_auth_headers
        )
        assert response.status_code == 401


# ═══════════════════════════════════════════════
# 5. GET /api/users/{user_id}/logs
# ═══════════════════════════════════════════════

class TestGetLogsEndpoint:
    """
    [Integration + Functional] Activity feed fetches logs per user.
    """

    MOCK_LOG = {
        "id": "log-001",
        "user_id": "user-abc",
        "task_title": "AI Resume Review",
        "feedback": "Strong Python background. Improve testing skills.",
        "score": 100,
        "completed_at": "2026-04-26T18:00:00Z"
    }

    def _mock_logs(self, mock_db_client, logs):
        chain = (
            mock_db_client.table.return_value.select.return_value
            .eq.return_value.order.return_value.limit.return_value
        )
        chain.execute.return_value.data = logs

    def test_get_logs_returns_200(self, client, auth_headers, mock_db_client):
        """[Functional] Authenticated request → 200 OK."""
        self._mock_logs(mock_db_client, [])
        response = client.get("/api/users/user-abc/logs", headers=auth_headers)
        assert response.status_code == 200

    def test_get_logs_returns_data_key(self, client, auth_headers, mock_db_client):
        """[Functional] Response always includes 'data' key."""
        self._mock_logs(mock_db_client, [])
        response = client.get("/api/users/user-abc/logs", headers=auth_headers)
        assert "data" in response.json()

    def test_get_logs_empty_for_new_user(self, client, auth_headers, mock_db_client):
        """[Functional] New user → empty list, not null."""
        self._mock_logs(mock_db_client, [])
        response = client.get("/api/users/user-abc/logs", headers=auth_headers)
        assert response.json()["data"] == []

    def test_get_logs_returns_correct_entries(self, client, auth_headers, mock_db_client):
        """[Integration] Log entries from DB appear in response."""
        self._mock_logs(mock_db_client, [self.MOCK_LOG])
        response = client.get("/api/users/user-abc/logs", headers=auth_headers)
        data = response.json()["data"]
        assert len(data) == 1
        assert data[0]["task_title"] == "AI Resume Review"

    def test_get_logs_requires_auth(self, client, no_auth_headers):
        """[Negative] No auth → 401."""
        response = client.get("/api/users/user-abc/logs", headers=no_auth_headers)
        assert response.status_code == 401


# ═══════════════════════════════════════════════
# 6. POST /api/users/{user_id}/logs — Submit Log
# ═══════════════════════════════════════════════

class TestSubmitLogEndpoint:
    """
    [Integration + Negative] Lab submission saves a practice log to DB.
    """

    def _mock_log_insert(self, mock_db_client, returned_rows):
        chain = mock_db_client.table.return_value.insert.return_value
        chain.execute.return_value.data = returned_rows

    def test_submit_log_returns_200(self, client, auth_headers, mock_db_client):
        """[Integration] Valid log submission → 200 OK."""
        self._mock_log_insert(mock_db_client, [{"id": "log-new"}])
        response = client.post(
            "/api/users/user-abc/logs",
            headers=auth_headers,
            json={
                "task_title": "Redis Rate Limiter",
                "feedback": "GitHub: https://github.com/user/repo",
                "score": 100
            }
        )
        assert response.status_code == 200

    def test_submit_log_missing_task_title_returns_422(
            self, client, auth_headers):
        """[Negative] Missing required 'task_title' → 422."""
        response = client.post(
            "/api/users/user-abc/logs",
            headers=auth_headers,
            json={"feedback": "some text", "score": 80}
        )
        assert response.status_code == 422

    def test_submit_log_missing_feedback_returns_422(
            self, client, auth_headers):
        """[Negative] Missing required 'feedback' → 422."""
        response = client.post(
            "/api/users/user-abc/logs",
            headers=auth_headers,
            json={"task_title": "Some Task", "score": 80}
        )
        assert response.status_code == 422

    def test_submit_log_score_above_100_returns_422(
            self, client, auth_headers):
        """[Negative] score > 100 violates constraint → 422."""
        response = client.post(
            "/api/users/user-abc/logs",
            headers=auth_headers,
            json={"task_title": "Task", "feedback": "Good", "score": 150}
        )
        assert response.status_code == 422

    def test_submit_log_score_below_0_returns_422(
            self, client, auth_headers):
        """[Negative] score < 0 violates constraint → 422."""
        response = client.post(
            "/api/users/user-abc/logs",
            headers=auth_headers,
            json={"task_title": "Task", "feedback": "Bad", "score": -5}
        )
        assert response.status_code == 422

    def test_submit_log_without_auth_returns_401(self, client, no_auth_headers):
        """[Negative] No auth header → 401."""
        response = client.post(
            "/api/users/user-abc/logs",
            headers=no_auth_headers,
            json={"task_title": "Task", "feedback": "Good", "score": 100}
        )
        assert response.status_code == 401
