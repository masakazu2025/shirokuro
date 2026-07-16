import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from app.transaction_items.payment_record import PaymentRecordItem
from app.transaction_items.product_record import ProductRecordItem
from run import app
from database import get_session
from models import PaymentLabelMaster, ProductCategoryMaster, Transaction
from urllib.parse import urlparse
from app.transaction_items.journal import JournalItem

TRANSACTION_DATA = {
    "transaction_id": "2026060721325600001",
    "shop_no": 1,
    "register_no": 1,
    "transaction_no": 1,
    "created_at": "2026-06-07T21:32:56.954Z",
    "started_at": None,
    "ended_at": None,
}
JOURNAL_TEXT = "テストジャーナルデータ"
PRODUCT_CATEGORY = [
    {"category_id": 1, "sub_category_id": 1, "category_name": "食品"},
    {"category_id": 1, "sub_category_id": 2, "category_name": "飲料"},
    {"category_id": 2, "sub_category_id": 1, "category_name": "日用品"},
    {"category_id": 2, "sub_category_id": 2, "category_name": "園芸用品"},
]
PRODUCT_DATA = [
    [1, 1, 600, 2],
    [1, 2, 300, 2],
    [2, 1, 800, 1],
    [2, 2, 1200, 1],
]
PAYMENT_LABELS = {
    "cash": ["金額", "釣り"],
    "credit": ["金額", "カード種別", "支払方法"],
    "codepay": ["金額", "ブランド"],
}
PAYMENT_DATA = {
    "cash": [10000, 500],
    "credit": [15000, "VISA", "一括"],
    "codepay": [5000, "PayPay"],
}
SEARCH_TRANSACTIONS = [
    {
        "transaction_id": "2026060100000001",
        "shop_no": 1,
        "register_no": 1,
        "transaction_no": 1,
        "created_at": "2026-06-01T10:00:00",
        "started_at": None,
        "ended_at": None,
    },
    {
        "transaction_id": "2026060100000002",
        "shop_no": 1,
        "register_no": 2,
        "transaction_no": 2,
        "created_at": "2026-06-02T10:00:00",
        "started_at": None,
        "ended_at": None,
    },
    {
        "transaction_id": "2026060100000003",
        "shop_no": 2,
        "register_no": 1,
        "transaction_no": 3,
        "created_at": "2026-06-03T10:00:00",
        "started_at": None,
        "ended_at": None,
    },
    {
        "transaction_id": "2026060100000004",
        "shop_no": 2,
        "register_no": 2,
        "transaction_no": 1,
        "created_at": "2026-06-05T10:00:00",
        "started_at": None,
        "ended_at": None,
    },
]


@pytest.fixture(name="client")
def client_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        for record in PRODUCT_CATEGORY:
            db_record = ProductCategoryMaster.model_validate(record)
            session.add(db_record)

        for key, labels in PAYMENT_LABELS.items():
            for i, label in enumerate(labels, start=1):
                db_record = PaymentLabelMaster.model_validate(
                    {
                        "category": key,
                        "item_id": i,
                        "item_label": label,
                    }
                )
                session.add(db_record)

        db_transaction = Transaction.model_validate(TRANSACTION_DATA)
        session.add(db_transaction)

        session.commit()
        session.refresh(db_transaction)

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="search_client")
def search_client_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        for record in SEARCH_TRANSACTIONS:
            session.add(Transaction.model_validate(record))
        session.commit()

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_read_transactions(client):
    response = client.get("/transactions")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_transactions_by_shop_no(search_client):
    response = search_client.get("/transactions", params={"shop_no": 1})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002"}


def test_search_transactions_by_register_no(search_client):
    response = search_client.get("/transactions", params={"register_no": 1})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000003"}


def test_search_transactions_by_transaction_no(search_client):
    response = search_client.get("/transactions", params={"transaction_no": 1})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000004"}


def test_search_transactions_by_multiple_conditions(search_client):
    response = search_client.get(
        "/transactions", params={"shop_no": 1, "register_no": 2}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002"}


def test_search_transactions_by_register_no_and_created_at_from(search_client):
    response = search_client.get(
        "/transactions",
        params={"register_no": 1, "created_at_from": "2026-06-02"},
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


def test_search_transactions_by_register_no_and_created_at_range(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "register_no": 1,
            "created_at_from": "2026-06-02",
            "created_at_to": "2026-06-04",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


def test_search_transactions_by_created_at_from(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_from": "2026-06-02"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002", "2026060100000003", "2026060100000004"}


def test_search_transactions_by_created_at_to(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026-06-02"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002"}


def test_search_transactions_by_created_at_range(search_client):
    response = search_client.get(
        "/transactions",
        params={"created_at_from": "2026-06-02", "created_at_to": "2026-06-03"},
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002", "2026060100000003"}


def test_search_transactions_no_match(search_client):
    response = search_client.get("/transactions", params={"shop_no": 99})
    assert response.status_code == 200
    assert response.json() == []


def test_search_transactions_invalid_shop_no(search_client):
    response = search_client.get("/transactions", params={"shop_no": "abc"})
    assert response.status_code == 422


def test_search_transactions_invalid_register_no(search_client):
    response = search_client.get("/transactions", params={"register_no": "abc"})
    assert response.status_code == 422


def test_search_transactions_invalid_transaction_no(search_client):
    response = search_client.get("/transactions", params={"transaction_no": "abc"})
    assert response.status_code == 422


def test_search_transactions_invalid_created_at_from_format(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_from": "2026/06/01"}
    )
    assert response.status_code == 422


def test_search_transactions_invalid_created_at_to_format(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026/06/01"}
    )
    assert response.status_code == 422


def test_search_transactions_created_at_range_reversed(search_client):
    response = search_client.get(
        "/transactions",
        params={"created_at_from": "2026-06-03", "created_at_to": "2026-06-02"},
    )
    assert response.status_code == 422


def test_read_transaction(client):
    response = client.get(f"/transactions/{TRANSACTION_DATA["transaction_id"]}")
    assert response.status_code == 200
    items = response.json()
    assert items["transaction_id"] == TRANSACTION_DATA["transaction_id"]
    assert items["shop_no"] == 1
    assert items["register_no"] == 1
    assert items["transaction_no"] == 1
    assert items["created_at"] == "2026-06-07T21:32:56.954000"


def test_update_transaction(client):
    update_data = {
        "started_at": "2026-06-07T21:32:26.954Z",
        "ended_at": "2026-06-07T21:33:06.954Z",
    }
    response = client.put(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}", json=update_data
    )
    assert response.status_code == 200
    items = response.json()

    assert items["transaction_id"] == TRANSACTION_DATA["transaction_id"]
    assert items["shop_no"] == 1
    assert items["register_no"] == 1
    assert items["transaction_no"] == 1
    assert items["created_at"] == "2026-06-07T21:32:56.954000"
    assert items["started_at"] == "2026-06-07T21:32:26.954000"
    assert items["ended_at"] == "2026-06-07T21:33:06.954000"


def test_delete_transaction(client):
    response = client.delete(f"/transactions/{TRANSACTION_DATA["transaction_id"]}")
    assert response.status_code == 200
    response = client.delete(f"/transactions/{TRANSACTION_DATA["transaction_id"]}")
    assert response.status_code == 404


def test_transaction_item_list(client):
    response = client.get(f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items")
    assert response.status_code == 200
    items = {item["name"]: item for item in response.json()}

    assert items["journal"]["label"] == "ジャーナル"
    assert (
        urlparse(items["journal"]["url"]).path
        == f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/journal"
    )

    assert items["product_record"]["label"] == "商品レコード"
    assert (
        urlparse(items["product_record"]["url"]).path
        == f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/product_record"
    )

    assert items["payment_record"]["label"] == "支払レコード"
    assert (
        urlparse(items["payment_record"]["url"]).path
        == f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/payment_record"
    )


def test_transaction_journal_item(client, monkeypatch):
    monkeypatch.setattr(JournalItem, "_read", lambda self: JOURNAL_TEXT)
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/journal"
    )
    assert response.status_code == 200
    item = response.json()
    assert item["transaction_id"] == TRANSACTION_DATA["transaction_id"]
    assert item["name"] == "journal"


def test_transaction_journal_item_not_found(client):
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/journal"
    )
    assert response.status_code == 404


def test_transaction_product_record_item(client, monkeypatch):
    monkeypatch.setattr(ProductRecordItem, "_read", lambda self: PRODUCT_DATA)
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/product_record"
    )
    assert response.status_code == 200
    item = response.json()
    assert item["transaction_id"] == TRANSACTION_DATA["transaction_id"]
    assert item["name"] == "product_record"


def test_transaction_product_record_item_not_found(client):
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/product_record"
    )
    assert response.status_code == 404


def test_transaction_product_record_item_invalid_data(client, monkeypatch):
    monkeypatch.setattr(
        ProductRecordItem, "_read", lambda self: [["invalid", 1, 600, 2]]
    )
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/product_record"
    )
    assert response.status_code == 422


def test_transaction_payment_record_item(client, monkeypatch):
    monkeypatch.setattr(PaymentRecordItem, "_read", lambda self: PAYMENT_DATA)
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/payment_record"
    )
    assert response.status_code == 200
    item = response.json()
    assert item["transaction_id"] == TRANSACTION_DATA["transaction_id"]
    assert item["name"] == "payment_record"


def test_transaction_payment_record_item_not_found(client):
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/payment_record"
    )
    assert response.status_code == 404


def test_transaction_payment_record_item_invalid_data(client, monkeypatch):
    monkeypatch.setattr(PaymentRecordItem, "_read", lambda self: ["not", "a", "dict"])
    response = client.get(
        f"/transactions/{TRANSACTION_DATA["transaction_id"]}/items/payment_record"
    )
    assert response.status_code == 422
