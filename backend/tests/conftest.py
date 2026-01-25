"""
Shared pytest fixtures for backend tests.
"""
import pytest
import os
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def mock_env(monkeypatch_session):
    """Mock environment variables for tests that don't need real API keys."""
    monkeypatch_session.setenv("EXA", "test_key")
    monkeypatch_session.setenv("NDIO", "test_key")
    monkeypatch_session.setenv("CPANIC", "test_key")
    monkeypatch_session.setenv("BACKBOARD", "test_key")
    monkeypatch_session.setenv("OPENROUTER_API_KEY", "test_key")


@pytest.fixture(scope="session")
def monkeypatch_session():
    """Session-scoped monkeypatch."""
    from _pytest.monkeypatch import MonkeyPatch
    mp = MonkeyPatch()
    yield mp
    mp.undo()


@pytest.fixture(scope="module")
def client():
    """
    Test client for API endpoints.
    Requires the server to be running separately for integration tests.
    """
    from app.main import app
    return TestClient(app)


@pytest.fixture
def base_url():
    """Base URL for HTTP requests (for tests using requests library)."""
    return os.environ.get("TEST_BASE_URL", "http://127.0.0.1:8000")
