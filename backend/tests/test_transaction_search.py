import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from main import app
from database import get_session
from models import Transaction

# | id  | shop_no | register_no | transaction_no | created_at            | ipaddress |
# |-----|---------|-------------|-----------------|------------------------|-----------|
# | 001 | 1       | 1           | 1               | 2026-06-01T09:00:00   | 10.0.0.1  |
# | 002 | 1       | 2           | 2               | 2026-06-02T10:00:00   | 10.0.0.2  |
# | 003 | 2       | 1           | 3               | 2026-06-02T15:00:00   | 10.0.0.1  |
# | 004 | 2       | 2           | 4               | 2026-06-03T10:00:00   | 10.0.0.3  |
# | 005 | 1       | 1           | 5               | 2026-06-05T23:59:59   | 10.0.0.2  |
# | 006 | 3       | 3           | 6               | 2026-06-06T10:00:00   | 10.0.0.4  |
SEARCH_TRANSACTIONS = [
    {
        "transaction_id": "2026060100000001",
        "shop_no": 1,
        "register_no": 1,
        "transaction_no": 1,
        "created_at": "2026-06-01T09:00:00",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.1",
    },
    {
        "transaction_id": "2026060100000002",
        "shop_no": 1,
        "register_no": 2,
        "transaction_no": 2,
        "created_at": "2026-06-02T10:00:00",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.2",
    },
    {
        "transaction_id": "2026060100000003",
        "shop_no": 2,
        "register_no": 1,
        "transaction_no": 3,
        "created_at": "2026-06-02T15:00:00",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.1",
    },
    {
        "transaction_id": "2026060100000004",
        "shop_no": 2,
        "register_no": 2,
        "transaction_no": 4,
        "created_at": "2026-06-03T10:00:00",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.3",
    },
    {
        "transaction_id": "2026060100000005",
        "shop_no": 1,
        "register_no": 1,
        "transaction_no": 5,
        "created_at": "2026-06-05T23:59:59",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.2",
    },
    {
        "transaction_id": "2026060100000006",
        "shop_no": 3,
        "register_no": 3,
        "transaction_no": 6,
        "created_at": "2026-06-06T10:00:00",
        "started_at": None,
        "ended_at": None,
        "ipaddress": "10.0.0.4",
    },
]


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


@pytest.fixture(name="capped_search_client")
def capped_search_client_fixture():
    """件数上限(10000件)のテスト用。register_no=1が10000件、register_no=2が1件(合計10001件)。"""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        records = [
            Transaction.model_validate(
                {
                    "transaction_id": f"CAP{i:017d}",
                    "shop_no": 1,
                    "register_no": 1 if i < 10000 else 2,
                    "transaction_no": (i % 9999) + 1,
                    "created_at": "2026-06-01T00:00:00",
                    "started_at": None,
                    "ended_at": None,
                    "ipaddress": "10.0.0.1",
                }
            )
            for i in range(10001)
        ]
        session.add_all(records)
        session.commit()

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# --- 境界値: 件数上限(10000件) ---


def test_search_transactions_at_cap_returns_all(capped_search_client):
    """該当件数がちょうど10000件のときは、切り詰められずに全件返る"""
    response = capped_search_client.get(
        "/transactions", params={"register_no": 1}
    )
    assert response.status_code == 200
    assert len(response.json()) == 10000


def test_search_transactions_over_cap_is_truncated(capped_search_client):
    """該当件数が10000件を超える(10001件)ときは、10000件に切り詰められる"""
    response = capped_search_client.get("/transactions", params={"shop_no": 1})
    assert response.status_code == 200
    assert len(response.json()) == 10000


# --- 正常系: 単一・複数(OR) ---


def test_search_transactions_by_shop_no_single(search_client):
    response = search_client.get("/transactions", params={"shop_no": 1})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002", "2026060100000005"}


def test_search_transactions_by_shop_no_multiple(search_client):
    response = search_client.get("/transactions", params={"shop_no": [1, 3]})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {
        "2026060100000001",
        "2026060100000002",
        "2026060100000005",
        "2026060100000006",
    }


def test_search_transactions_by_register_no_single(search_client):
    response = search_client.get("/transactions", params={"register_no": 2})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002", "2026060100000004"}


def test_search_transactions_by_register_no_multiple(search_client):
    response = search_client.get(
        "/transactions", params={"register_no": [1, 3]}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {
        "2026060100000001",
        "2026060100000003",
        "2026060100000005",
        "2026060100000006",
    }


def test_search_transactions_by_ipaddress_single(search_client):
    response = search_client.get(
        "/transactions", params={"ipaddress": "10.0.0.1"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000003"}


def test_search_transactions_by_ipaddress_multiple(search_client):
    response = search_client.get(
        "/transactions", params={"ipaddress": ["10.0.0.1", "10.0.0.3"]}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000003", "2026060100000004"}


# --- 正常系: transaction_no範囲 ---


def test_search_transactions_by_transaction_no_from_only(search_client):
    response = search_client.get(
        "/transactions", params={"transaction_no_from": 4}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000004", "2026060100000005", "2026060100000006"}


def test_search_transactions_by_transaction_no_to_only(search_client):
    response = search_client.get("/transactions", params={"transaction_no_to": 3})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002", "2026060100000003"}


def test_search_transactions_by_transaction_no_range(search_client):
    response = search_client.get(
        "/transactions",
        params={"transaction_no_from": 2, "transaction_no_to": 4},
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002", "2026060100000003", "2026060100000004"}


def test_search_transactions_by_transaction_no_single_value(search_client):
    response = search_client.get(
        "/transactions",
        params={"transaction_no_from": 3, "transaction_no_to": 3},
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


# --- 正常系: created_at範囲(時刻まで) ---


def test_search_transactions_by_created_at_from_only(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_from": "2026-06-03T00:00:00"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000004", "2026060100000005", "2026060100000006"}


def test_search_transactions_by_created_at_to_only(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026-06-02T12:00:00"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002"}


def test_search_transactions_by_created_at_range_within_same_day(search_client):
    """同日内の時刻境界で絞り込める(06-02 10:00は除外、15:00は含む)"""
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-02T12:00:00",
            "created_at_to": "2026-06-02T18:00:00",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


def test_search_transactions_by_created_at_date_only_to_excludes_same_day_later_time(
    search_client,
):
    """to側で時刻を省略(日付のみ)すると、同日でも0時より後の取引は含まれない"""
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026-06-02"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001"}


# --- 正常系: 複合条件(実運用でよくある組み合わせ) ---


def test_search_transactions_by_date_and_ip_and_transaction_no_single(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-01T00:00:00",
            "created_at_to": "2026-06-02T23:59:59",
            "ipaddress": "10.0.0.1",
            "transaction_no_from": 3,
            "transaction_no_to": 3,
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


def test_search_transactions_by_date_and_ip_and_transaction_no_range(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-01T00:00:00",
            "created_at_to": "2026-06-02T23:59:59",
            "ipaddress": "10.0.0.1",
            "transaction_no_from": 1,
            "transaction_no_to": 5,
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000003"}


def test_search_transactions_by_created_at_from_and_ip_single(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-03T00:00:00",
            "ipaddress": "10.0.0.2",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000005"}


def test_search_transactions_by_created_at_from_and_ip_multiple(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-02T00:00:00",
            "ipaddress": ["10.0.0.2", "10.0.0.4"],
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000002", "2026060100000005", "2026060100000006"}


def test_search_transactions_by_created_at_range_and_ip_single(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-02T00:00:00",
            "created_at_to": "2026-06-04T23:59:59",
            "ipaddress": "10.0.0.1",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003"}


def test_search_transactions_by_created_at_range_and_ip_multiple(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-02T00:00:00",
            "created_at_to": "2026-06-04T23:59:59",
            "ipaddress": ["10.0.0.1", "10.0.0.3"],
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000003", "2026060100000004"}


def test_search_transactions_all_conditions_single_values(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "shop_no": 1,
            "register_no": 1,
            "transaction_no_from": 1,
            "transaction_no_to": 1,
            "ipaddress": "10.0.0.1",
            "created_at_from": "2026-06-01T00:00:00",
            "created_at_to": "2026-06-01T23:59:59",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001"}


def test_search_transactions_all_conditions_multiple_and_range_values(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "shop_no": [1, 3],
            "register_no": [1, 3],
            "transaction_no_from": 1,
            "transaction_no_to": 6,
            "ipaddress": ["10.0.0.1", "10.0.0.2", "10.0.0.4"],
            "created_at_from": "2026-06-01T00:00:00",
            "created_at_to": "2026-06-06T23:59:59",
        },
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000005", "2026060100000006"}


def test_search_transactions_no_match(search_client):
    response = search_client.get("/transactions", params={"shop_no": 99999})
    assert response.status_code == 200
    assert response.json() == []


# --- 境界値: 自前ロジック(range比較のinclusive/exclusive) ---


def test_search_transactions_created_at_from_boundary_is_inclusive(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_from": "2026-06-02T10:00:00"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    # created_atが完全一致する取引(002)も含む(>=)
    assert ids == {
        "2026060100000002",
        "2026060100000003",
        "2026060100000004",
        "2026060100000005",
        "2026060100000006",
    }


def test_search_transactions_created_at_to_boundary_is_inclusive(search_client):
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026-06-02T15:00:00"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002", "2026060100000003"}


def test_search_transactions_created_at_to_boundary_excludes_one_second_later(
    search_client,
):
    response = search_client.get(
        "/transactions", params={"created_at_to": "2026-06-02T14:59:59"}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {"2026060100000001", "2026060100000002"}


def test_search_transactions_transaction_no_from_boundary_is_inclusive(search_client):
    response = search_client.get(
        "/transactions", params={"transaction_no_from": 2}
    )
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    # transaction_no=2の取引(002)も含む(>=)
    assert ids == {
        "2026060100000002",
        "2026060100000003",
        "2026060100000004",
        "2026060100000005",
        "2026060100000006",
    }


def test_search_transactions_transaction_no_to_boundary_is_inclusive(search_client):
    response = search_client.get("/transactions", params={"transaction_no_to": 4})
    assert response.status_code == 200
    ids = {t["transaction_id"] for t in response.json()}
    assert ids == {
        "2026060100000001",
        "2026060100000002",
        "2026060100000003",
        "2026060100000004",
    }


# --- 境界値: Field制約(shop_noを代表として1〜99999、register_noは同一パターンのため省略) ---


@pytest.mark.parametrize(
    "shop_no, expected_status",
    [
        (1, 200),
        (99999, 200),
        (0, 422),
        (100000, 422),
    ],
)
def test_search_transactions_shop_no_field_boundary(
    search_client, shop_no, expected_status
):
    response = search_client.get("/transactions", params={"shop_no": shop_no})
    assert response.status_code == expected_status


# --- 境界値: transaction_no_from/toのField制約(1〜9999) ---


@pytest.mark.parametrize(
    "params, expected_status",
    [
        ({"transaction_no_from": 1}, 200),
        ({"transaction_no_to": 9999}, 200),
        ({"transaction_no_from": 0}, 422),
        ({"transaction_no_to": 10000}, 422),
    ],
)
def test_search_transactions_transaction_no_field_boundary(
    search_client, params, expected_status
):
    response = search_client.get("/transactions", params=params)
    assert response.status_code == expected_status


# --- 異常系: 型不正 ---


@pytest.mark.parametrize(
    "params",
    [
        {"shop_no": "abc"},
        {"register_no": "abc"},
        {"transaction_no_from": "abc"},
        {"transaction_no_to": "abc"},
        {"ipaddress": "not-an-ip"},
        {"created_at_from": "2026/06/01"},
        {"created_at_to": "2026/06/01"},
    ],
)
def test_search_transactions_invalid_field_format(search_client, params):
    response = search_client.get("/transactions", params=params)
    assert response.status_code == 422


# --- 異常系: 範囲逆転 ---


def test_search_transactions_created_at_range_reversed(search_client):
    response = search_client.get(
        "/transactions",
        params={
            "created_at_from": "2026-06-03T00:00:00",
            "created_at_to": "2026-06-02T00:00:00",
        },
    )
    assert response.status_code == 422


def test_search_transactions_transaction_no_range_reversed(search_client):
    response = search_client.get(
        "/transactions",
        params={"transaction_no_from": 4, "transaction_no_to": 2},
    )
    assert response.status_code == 422


# --- 異常系: リスト内の一部だけ不正(代表としてshop_noのみ検証) ---


def test_search_transactions_shop_no_list_partially_invalid(search_client):
    response = search_client.get("/transactions", params={"shop_no": [1, "abc"]})
    assert response.status_code == 422


# --- 異常系: 複合条件中の1つだけ不正 ---


def test_search_transactions_composite_with_one_invalid_field(search_client):
    response = search_client.get(
        "/transactions", params={"shop_no": 1, "ipaddress": "not-an-ip"}
    )
    assert response.status_code == 422
