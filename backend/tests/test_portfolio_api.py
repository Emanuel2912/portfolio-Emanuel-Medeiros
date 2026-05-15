"""
Backend API tests for Emanuel Medeiros Portfolio.
Tests: GET /api/, POST /api/chat and basic error handling.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestRootEndpoint:
    def test_root_returns_portfolio_message(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Emanuel Medeiros" in data["message"]


class TestChatEndpoint:
    def test_chat_with_skills_question(self):
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Quais habilidades o Emanuel tem?"},
            timeout=30,
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "reply" in data
        assert any(skill in data["reply"].lower() for skill in ["excel", "power bi", "sql", "c#"])

    def test_chat_multi_turn_session_id_is_preserved(self):
        first = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Quem é Emanuel Medeiros?"},
            timeout=30,
        )
        assert first.status_code == 200
        session_id = first.json()["session_id"]

        second = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "E o currículo?", "session_id": session_id},
            timeout=30,
        )
        assert second.status_code == 200
        assert second.json()["session_id"] == session_id

    def test_chat_empty_message_returns_400(self):
        response = requests.post(f"{BASE_URL}/api/chat", json={"message": ""}, timeout=30)
        assert response.status_code == 400

    def test_chat_curriculum_question(self):
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Onde vejo o currículo?"},
            timeout=30,
        )
        assert response.status_code == 200
        assert "/curriculo" in response.json()["reply"]

    def test_chat_linkedin_question(self):
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "Ele tem LinkedIn?"},
            timeout=30,
        )
        assert response.status_code == 200
        assert "em breve" in response.json()["reply"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
