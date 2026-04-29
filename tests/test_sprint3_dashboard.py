"""
Sprint 3 — Unit Tests: Dashboard Data Accuracy
================================================
Testing Type : Integration + Functional + Negative + Regression
Sprint Goal  : Verify every dashboard widget returns correct data
               for every possible user state. Zero hardcoded values.

Scenarios covered:
  A) Brand-new user      → 0 skills, 0 logs
  B) Partial user        → mix of low + high proficiency skills
  C) All-critical user   → all skills proficiency ≤ 2
  D) All-mastered user   → all skills Mastered
  E) Active user         → skills + multiple log entries

Endpoints under test:
  GET /api/users/{user_id}/dashboard
  GET /api/users/{user_id}/logs
  POST /api/users/{user_id}/generate-tasks  (no-skills guard)
  POST /api/users/{user_id}/interview/mock  (with/without skills)
"""

import pytest
from unittest.mock import patch, MagicMock


# ─────────────────────────────────────────────
# Seed skill datasets for deterministic testing
# ─────────────────────────────────────────────

# Scenario A: Brand-new user — completely empty
SKILLS_EMPTY = []
LOGS_EMPTY = []

# Scenario B: Mixed proficiency user
SKILLS_MIXED = [
    {"id": "s1", "user_id": "u1", "name": "React",      "proficiency": 1, "status": "Backlog",     "category": "Frontend"},
    {"id": "s2", "user_id": "u1", "name": "Python",     "proficiency": 5, "status": "Mastered",    "category": "Language"},
    {"id": "s3", "user_id": "u1", "name": "Docker",     "proficiency": 2, "status": "Learning",    "category": "DevOps"},
    {"id": "s4", "user_id": "u1", "name": "FastAPI",    "proficiency": 4, "status": "Practicing",  "category": "Backend"},
    {"id": "s5", "user_id": "u1", "name": "PostgreSQL", "proficiency": 3, "status": "Practicing",  "category": "Database"},
]

# Scenario C: All critical — every skill ≤ 2
SKILLS_ALL_CRITICAL = [
    {"id": "s6",  "user_id": "u2", "name": "TypeScript", "proficiency": 1, "status": "Backlog",  "category": "Language"},
    {"id": "s7",  "user_id": "u2", "name": "Kubernetes",  "proficiency": 2, "status": "Learning", "category": "DevOps"},
    {"id": "s8",  "user_id": "u2", "name": "Redis",       "proficiency": 1, "status": "Backlog",  "category": "Backend"},
]

# Scenario D: All mastered — no gaps
SKILLS_ALL_MASTERED = [
    {"id": "s9",  "user_id": "u3", "name": "React",   "proficiency": 5, "status": "Mastered", "category": "Frontend"},
    {"id": "s10", "user_id": "u3", "name": "Python",  "proficiency": 5, "status": "Mastered", "category": "Language"},
    {"id": "s11", "user_id": "u3", "name": "FastAPI", "proficiency": 5, "status": "Mastered", "category": "Backend"},
]

# Scenario E: Active user with multiple logs
LOGS_ACTIVE = [
    {"id": "l1", "user_id": "u1", "task_title": "AI Resume Review",     "feedback": "Strong Python skills.", "score": 100, "completed_at": "2026-04-26T10:00:00Z"},
    {"id": "l2", "user_id": "u1", "task_title": "Redis Rate Limiter",   "feedback": "GitHub: https://github.com/x", "score": 100, "completed_at": "2026-04-25T14:00:00Z"},
    {"id": "l3", "user_id": "u1", "task_title": "Docker Compose Setup", "feedback": "Needs improvement on networking.", "score": 80, "completed_at": "2026-04-24T09:00:00Z"},
]


# ═══════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════

def wire_dashboard(mock_db_client, skills, logs):
    """Wire mock DB to return specified skills + logs for dashboard."""
    mock_db_client.table.return_value.select.return_value \
        .eq.return_value.execute.return_value.data = skills

    mock_db_client.table.return_value.select.return_value \
        .eq.return_value.order.return_value.limit.return_value \
        .execute.return_value.data = logs


def wire_logs(mock_db_client, logs):
    """Wire mock DB for the /logs endpoint chain."""
    mock_db_client.table.return_value.select.return_value \
        .eq.return_value.order.return_value.limit.return_value \
        .execute.return_value.data = logs


# ═══════════════════════════════════════════════
# 1. SCENARIO A — Brand-New User
# ═══════════════════════════════════════════════

class TestDashboardNewUser:
    """
    [Functional + Regression] A new user with no skills or logs must
    always see empty lists — never fake/hardcoded data.
    """

    def test_new_user_skills_is_empty_list(self, client, auth_headers, mock_db_client):
        """[Regression] skills key is [] not hardcoded dummy data."""
        wire_dashboard(mock_db_client, SKILLS_EMPTY, LOGS_EMPTY)
        res = client.get("/api/users/u-new/dashboard", headers=auth_headers)
        assert res.json()["skills"] == []

    def test_new_user_logs_is_empty_list(self, client, auth_headers, mock_db_client):
        """[Regression] recent_logs key is [] not hardcoded dummy data."""
        wire_dashboard(mock_db_client, SKILLS_EMPTY, LOGS_EMPTY)
        res = client.get("/api/users/u-new/dashboard", headers=auth_headers)
        assert res.json()["recent_logs"] == []

    def test_new_user_skill_count_is_zero(self, client, auth_headers, mock_db_client):
        """[Functional] len(skills) == 0 for brand-new user."""
        wire_dashboard(mock_db_client, SKILLS_EMPTY, LOGS_EMPTY)
        res = client.get("/api/users/u-new/dashboard", headers=auth_headers)
        assert len(res.json()["skills"]) == 0

    def test_new_user_logs_via_logs_endpoint(self, client, auth_headers, mock_db_client):
        """[Functional] /logs endpoint also returns [] for new user."""
        wire_logs(mock_db_client, LOGS_EMPTY)
        res = client.get("/api/users/u-new/logs", headers=auth_headers)
        assert res.json()["data"] == []


# ═══════════════════════════════════════════════
# 2. SCENARIO B — Mixed Proficiency User
# ═══════════════════════════════════════════════

class TestDashboardMixedUser:
    """
    [Integration + Functional] User with 5 skills of varying proficiency.
    Validates that the API delivers correct data for frontend to compute:
    - Critical Gaps (proficiency ≤ 2): React(1), Docker(2)
    - Mastery Score: 1 Mastered + 2 Practicing = 3/5 = 60%
    - Weakest skill: React (proficiency=1)
    """

    def test_mixed_user_returns_all_five_skills(self, client, auth_headers, mock_db_client):
        """[Integration] All 5 skills from DB are returned."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        assert len(res.json()["skills"]) == 5

    def test_mixed_user_skill_names_present(self, client, auth_headers, mock_db_client):
        """[Integration] Exact skill names from DB are preserved."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        names = [s["name"] for s in res.json()["skills"]]
        assert "React" in names
        assert "Python" in names
        assert "Docker" in names

    def test_mixed_user_proficiency_values_correct(self, client, auth_headers, mock_db_client):
        """[Integration] Proficiency values from DB are not altered."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        react = next(s for s in skills if s["name"] == "React")
        python = next(s for s in skills if s["name"] == "Python")
        assert react["proficiency"] == 1
        assert python["proficiency"] == 5

    def test_mixed_user_critical_gaps_computable(self, client, auth_headers, mock_db_client):
        """[Functional] Skills with proficiency ≤ 2 can be identified from response."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        critical = [s for s in skills if s["proficiency"] <= 2]
        # React(1) and Docker(2) are the 2 critical gaps
        assert len(critical) == 2
        critical_names = {s["name"] for s in critical}
        assert "React" in critical_names
        assert "Docker" in critical_names

    def test_mixed_user_mastery_score_calculation(self, client, auth_headers, mock_db_client):
        """[Functional] Mastery score = (Mastered + Practicing) / total = 3/5 = 60%."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        total = len(skills)
        mastered_or_practicing = sum(
            1 for s in skills if s["status"] in ["Mastered", "Practicing"]
        )
        score = round((mastered_or_practicing / total) * 100)
        assert score == 60

    def test_mixed_user_weakest_skill_is_react(self, client, auth_headers, mock_db_client):
        """[Functional] Lowest proficiency skill is React(1) — hero card target."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        weakest = min(skills, key=lambda s: s["proficiency"])
        assert weakest["name"] == "React"
        assert weakest["proficiency"] == 1

    def test_mixed_user_statuses_preserved(self, client, auth_headers, mock_db_client):
        """[Integration] Status values from DB are not altered."""
        wire_dashboard(mock_db_client, SKILLS_MIXED, LOGS_EMPTY)
        res = client.get("/api/users/u1/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        python = next(s for s in skills if s["name"] == "Python")
        assert python["status"] == "Mastered"


# ═══════════════════════════════════════════════
# 3. SCENARIO C — All Critical Gaps User
# ═══════════════════════════════════════════════

class TestDashboardAllCriticalUser:
    """
    [Functional + Negative] User where every skill has proficiency ≤ 2.
    All skills should appear as critical gaps. Mastery score = 0%.
    """

    def test_all_critical_returns_three_skills(self, client, auth_headers, mock_db_client):
        """[Integration] All 3 skills from DB returned."""
        wire_dashboard(mock_db_client, SKILLS_ALL_CRITICAL, LOGS_EMPTY)
        res = client.get("/api/users/u2/dashboard", headers=auth_headers)
        assert len(res.json()["skills"]) == 3

    def test_all_critical_every_skill_is_gap(self, client, auth_headers, mock_db_client):
        """[Functional] Every skill qualifies as a critical gap (proficiency ≤ 2)."""
        wire_dashboard(mock_db_client, SKILLS_ALL_CRITICAL, LOGS_EMPTY)
        res = client.get("/api/users/u2/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        critical = [s for s in skills if s["proficiency"] <= 2]
        assert len(critical) == len(skills)

    def test_all_critical_mastery_score_is_zero(self, client, auth_headers, mock_db_client):
        """[Functional] No mastered/practicing skills → mastery score = 0%."""
        wire_dashboard(mock_db_client, SKILLS_ALL_CRITICAL, LOGS_EMPTY)
        res = client.get("/api/users/u2/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        mastered_or_practicing = sum(
            1 for s in skills if s["status"] in ["Mastered", "Practicing"]
        )
        assert mastered_or_practicing == 0


# ═══════════════════════════════════════════════
# 4. SCENARIO D — All Mastered User
# ═══════════════════════════════════════════════

class TestDashboardAllMasteredUser:
    """
    [Functional + Regression] User where every skill is Mastered.
    Dashboard must show no critical gaps and 100% mastery score.
    """

    def test_all_mastered_no_critical_gaps(self, client, auth_headers, mock_db_client):
        """[Functional] 0 skills have proficiency ≤ 2 — no critical gaps."""
        wire_dashboard(mock_db_client, SKILLS_ALL_MASTERED, LOGS_EMPTY)
        res = client.get("/api/users/u3/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        critical = [s for s in skills if s["proficiency"] <= 2]
        assert len(critical) == 0

    def test_all_mastered_score_is_100(self, client, auth_headers, mock_db_client):
        """[Functional] All skills Mastered → mastery score = 100%."""
        wire_dashboard(mock_db_client, SKILLS_ALL_MASTERED, LOGS_EMPTY)
        res = client.get("/api/users/u3/dashboard", headers=auth_headers)
        skills = res.json()["skills"]
        total = len(skills)
        mastered = sum(1 for s in skills if s["status"] in ["Mastered", "Practicing"])
        score = round((mastered / total) * 100)
        assert score == 100

    def test_all_mastered_returns_three_skills(self, client, auth_headers, mock_db_client):
        """[Integration] Correct count of mastered skills returned."""
        wire_dashboard(mock_db_client, SKILLS_ALL_MASTERED, LOGS_EMPTY)
        res = client.get("/api/users/u3/dashboard", headers=auth_headers)
        assert len(res.json()["skills"]) == 3


# ═══════════════════════════════════════════════
# 5. SCENARIO E — Activity Feed Accuracy
# ═══════════════════════════════════════════════

class TestDashboardActivityFeed:
    """
    [Integration + Functional] The Recent Activity feed must reflect
    real log entries from the DB in correct order and with full data.
    """

    def test_activity_feed_returns_correct_count(self, client, auth_headers, mock_db_client):
        """[Integration] Correct number of log entries returned."""
        wire_logs(mock_db_client, LOGS_ACTIVE)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        assert len(res.json()["data"]) == 3

    def test_activity_feed_first_entry_is_latest(self, client, auth_headers, mock_db_client):
        """[Integration] First entry in feed is the most recent log."""
        wire_logs(mock_db_client, LOGS_ACTIVE)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        first = res.json()["data"][0]
        assert first["task_title"] == "AI Resume Review"

    def test_activity_feed_log_has_required_fields(self, client, auth_headers, mock_db_client):
        """[Functional] Each log entry has task_title, feedback, score, completed_at."""
        wire_logs(mock_db_client, LOGS_ACTIVE)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        entry = res.json()["data"][0]
        for field in ["task_title", "feedback", "score", "completed_at"]:
            assert field in entry, f"Missing field: {field}"

    def test_activity_feed_feedback_text_preserved(self, client, auth_headers, mock_db_client):
        """[Integration] AI review feedback text is not truncated."""
        wire_logs(mock_db_client, LOGS_ACTIVE)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        first = res.json()["data"][0]
        assert first["feedback"] == "Strong Python skills."

    def test_activity_feed_score_values_preserved(self, client, auth_headers, mock_db_client):
        """[Integration] Score values from DB are preserved exactly."""
        wire_logs(mock_db_client, LOGS_ACTIVE)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        scores = [e["score"] for e in res.json()["data"]]
        assert 100 in scores
        assert 80 in scores

    def test_activity_feed_no_hardcoded_entries(self, client, auth_headers, mock_db_client):
        """[Regression] Response never contains old hardcoded log texts."""
        hardcoded_texts = [
            "Express Middleware",
            "React Hooks",
            "System Design",
            "Redis Rate Limiter Integration",
        ]
        wire_logs(mock_db_client, LOGS_EMPTY)
        res = client.get("/api/users/u1/logs", headers=auth_headers)
        entries = res.json()["data"]
        for entry in entries:
            for hardcoded in hardcoded_texts:
                assert hardcoded not in entry.get("task_title", ""), \
                    f"Hardcoded text '{hardcoded}' found in activity feed!"


# ═══════════════════════════════════════════════
# 6. GENERATE TASKS — No Skills Guard
# ═══════════════════════════════════════════════

class TestGenerateTasksGuard:
    """
    [Negative + Functional] generate-tasks endpoint must return 400
    if user has no skills — not a 500 crash.
    """

    def test_generate_tasks_with_no_skills_returns_400(
            self, client, auth_headers, mock_db_client):
        """[Negative] Empty skill list → 400 with clear message."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = []
        res = client.post(
            "/api/users/u-new/generate-tasks",
            headers=auth_headers
        )
        assert res.status_code == 400

    def test_generate_tasks_error_message_is_descriptive(
            self, client, auth_headers, mock_db_client):
        """[Negative] Error message mentions 'skills' or 'found'."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = []
        res = client.post(
            "/api/users/u-new/generate-tasks",
            headers=auth_headers
        )
        detail = res.json()["detail"].lower()
        assert "skill" in detail or "found" in detail

    def test_generate_tasks_with_skills_calls_ai(
            self, client, auth_headers, mock_db_client):
        """[Integration] With skills present, AI engine is called."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = SKILLS_MIXED

        mock_tasks = {"tasks": [
            {"title": "Build API", "description": "...", "difficulty": "Intermediate", "duration_minutes": 45, "criteria": []}
        ]}
        with patch("backend.main.generate_practice_tasks", return_value=mock_tasks):
            res = client.post(
                "/api/users/u1/generate-tasks",
                headers=auth_headers
            )
        assert res.status_code == 200

    def test_generate_tasks_without_auth_returns_401(
            self, client, no_auth_headers):
        """[Negative] No auth → 401."""
        res = client.post(
            "/api/users/u-new/generate-tasks",
            headers=no_auth_headers
        )
        assert res.status_code == 401


# ═══════════════════════════════════════════════
# 7. MOCK INTERVIEW — JD + Skills
# ═══════════════════════════════════════════════

class TestMockInterviewEndpoint:
    """
    [Integration + Negative] Mock interview generates questions
    based on JD text + current user skills.
    """

    MOCK_INTERVIEW = {
        "questions": [
            {"question": "Explain React's Virtual DOM", "type": "technical"},
            {"question": "Describe your Docker experience", "type": "technical"},
            {"question": "How do you handle async tasks?", "type": "behavioral"},
        ]
    }

    def test_mock_interview_returns_200(self, client, auth_headers, mock_db_client):
        """[Integration] Valid JD + skills → 200."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = SKILLS_MIXED

        with patch("backend.main.generate_mock_interview", return_value=self.MOCK_INTERVIEW):
            res = client.post(
                "/api/users/u1/interview/mock",
                headers=auth_headers,
                json={"jd_text": "We need a senior React developer with Docker experience."}
            )
        assert res.status_code == 200

    def test_mock_interview_returns_questions(self, client, auth_headers, mock_db_client):
        """[Schema] Response data contains 'questions' list."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = SKILLS_MIXED

        with patch("backend.main.generate_mock_interview", return_value=self.MOCK_INTERVIEW):
            res = client.post(
                "/api/users/u1/interview/mock",
                headers=auth_headers,
                json={"jd_text": "Looking for a Python backend developer."}
            )
        assert "questions" in res.json()["data"]

    def test_mock_interview_missing_jd_text_returns_422(
            self, client, auth_headers):
        """[Negative] Missing jd_text → 422 validation error."""
        res = client.post(
            "/api/users/u1/interview/mock",
            headers=auth_headers,
            json={}
        )
        assert res.status_code == 422

    def test_mock_interview_without_auth_returns_401(self, client, no_auth_headers):
        """[Negative] No auth → 401."""
        res = client.post(
            "/api/users/u1/interview/mock",
            headers=no_auth_headers,
            json={"jd_text": "Looking for a React developer."}
        )
        assert res.status_code == 401

    def test_mock_interview_works_with_no_skills(self, client, auth_headers, mock_db_client):
        """[Functional] Empty skill list falls back gracefully → still 200."""
        mock_db_client.table.return_value.select.return_value \
            .eq.return_value.execute.return_value.data = []

        with patch("backend.main.generate_mock_interview", return_value=self.MOCK_INTERVIEW):
            res = client.post(
                "/api/users/u1/interview/mock",
                headers=auth_headers,
                json={"jd_text": "Looking for a React developer."}
            )
        assert res.status_code == 200
