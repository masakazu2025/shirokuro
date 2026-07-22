import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from main import app
from database import get_session
from models import Terminal


@pytest.fixture(name="client")
def client_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_create_terminal(client):
    response = client.post("/terminals", json={"ip": "192.168.1.1"})
    assert response.status_code == 200
    terminal = response.json()
    assert terminal["ip"] == "192.168.1.1"
    assert terminal["id"] is not None


def test_read_terminals(client):
    client.post("/terminals", json={"ip": "192.168.1.1"})
    client.post("/terminals", json={"ip": "192.168.1.2"})

    response = client.get("/terminals")
    assert response.status_code == 200
    ips = {t["ip"] for t in response.json()}
    assert ips == {"192.168.1.1", "192.168.1.2"}


def test_delete_terminal(client):
    created = client.post("/terminals", json={"ip": "192.168.1.1"}).json()

    response = client.delete(f"/terminals/{created['id']}")
    assert response.status_code == 200

    response = client.get("/terminals")
    assert response.json() == []


def test_create_terminal_invalid_ip(client):
    response = client.post("/terminals", json={"ip": "not-an-ip"})
    assert response.status_code == 422


def test_create_terminal_duplicate_ip(client):
    client.post("/terminals", json={"ip": "192.168.1.1"})
    response = client.post("/terminals", json={"ip": "192.168.1.1"})
    assert response.status_code == 409


def test_delete_terminal_not_found(client):
    response = client.delete("/terminals/999")
    assert response.status_code == 404
