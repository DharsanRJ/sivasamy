# Sprint 1 — Unit Test Fixtures & Shared Setup
# Tests auth endpoint logic, token validation, and upload route guards.
# Uses FastAPI's TestClient (via httpx) — NO live Supabase or Redis calls.

import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ─────────────────────────────────────────────
# Patch heavy external dependencies BEFORE
# the app module is imported so nothing calls
# out to real Supabase / Redis / Celery.
# ─────────────────────────────────────────────

# Mock Celery task so it never hits Redis
celery_patcher = patch("backend.tasks.process_resume_task")
celery_patcher.start()

# Mock Supabase create_client so it never hits network
supabase_patcher = patch("backend.main.create_client")
mock_supabase = supabase_patcher.start()

# Build a reusable mock Supabase client
mock_db = MagicMock()
mock_supabase.return_value = mock_db

# Set fake env vars before app import
os.environ.setdefault("VITE_SUPABASE_URL", "https://fake.supabase.co")
os.environ.setdefault("VITE_SUPABASE_ANON_KEY", "fake-anon-key")
os.environ.setdefault("GEMINI_API_KEY", "fake-gemini-key")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

# NOW import the app — all patchers are active
from backend.main import app  # noqa: E402

# ─────────────────────────────────────────────
# Shared fixtures
# ─────────────────────────────────────────────

@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient — used by all Sprint 1 tests."""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_headers():
    """Valid JWT bearer header (fake token — endpoint only checks format)."""
    return {"Authorization": "Bearer fake-jwt-token-for-testing"}

@pytest.fixture
def no_auth_headers():
    """Simulates a request with no Authorization header."""
    return {}

@pytest.fixture
def bad_auth_headers():
    """Simulates malformed Authorization header (no Bearer prefix)."""
    return {"Authorization": "Token bad-format"}

@pytest.fixture
def mock_db_client():
    """Returns the mocked Supabase client for assertions."""
    return mock_db
