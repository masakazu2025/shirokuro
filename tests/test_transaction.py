import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from run import app
from database import get_session


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


@pytest.fixture
def transaction_data():
    return {
        "transaction_id": "2026060721325600001",
        "shop_no": 1,
        "register_no": 1,
        "transaction_no": 1,
        "created_at": "2026-06-07T21:32:56.954Z",
    }


def test_read_transactions_init(client):
    response = client.get("/transactions")
    assert response.status_code == 200
    assert response.json() == []


def test_read_transactions(client, transaction_data):
    response = client.post("/transactions", json=transaction_data)
    assert response.status_code == 201
    response = client.get("/transactions")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_read_transaction(client, transaction_data):
    response = client.post("/transactions", json=transaction_data)
    assert response.status_code == 201
    response = client.get("/transactions/2026060721325600001")
    assert response.status_code == 200
    assert response.json()["transaction_id"] == "2026060721325600001"
    assert response.json()["shop_no"] == 1
    assert response.json()["register_no"] == 1
    assert response.json()["transaction_no"] == 1
    assert response.json()["created_at"] == "2026-06-07T21:32:56.954000"


def test_update_transaction(client, transaction_data):
    response = client.post("/transactions", json=transaction_data)
    assert response.status_code == 201

    update_data = {
        "started_at": "2026-06-07T21:32:26.954Z",
        "ended_at": "2026-06-07T21:33:06.954Z",
    }
    response = client.put("/transactions/2026060721325600001", json=update_data)
    assert response.status_code == 200
    assert response.json()["transaction_id"] == "2026060721325600001"
    assert response.json()["shop_no"] == 1
    assert response.json()["register_no"] == 1
    assert response.json()["transaction_no"] == 1
    assert response.json()["created_at"] == "2026-06-07T21:32:56.954000"
    assert response.json()["started_at"] == "2026-06-07T21:32:26.954000"
    assert response.json()["ended_at"] == "2026-06-07T21:33:06.954000"


def test_delete_transaction(client, transaction_data):
    response = client.post("/transactions", json=transaction_data)
    assert response.status_code == 201

    response = client.delete("/transactions/2026060721325600001")
    assert response.status_code == 200
    response = client.delete("/transactions/2026060721325600001")
    assert response.status_code == 404
