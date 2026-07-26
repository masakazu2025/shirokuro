import pytest
import json
from app.transaction_items.base import ItemDataError
from app.transaction_items.payment_record import PaymentRecordItem
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from models import PaymentLabelMaster

TRANSACTION_ID = "2026060721325600001"

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

COLUMNS = [
    {"key": "No", "label": "No"},
    {"key": "name", "label": "項目名"},
    {"key": "value", "label": "値"},
]

LABELED_RECORD = {
    "cash": {
        "label": "現金",
        "rows": [
            {"No": 1, "name": "金額", "value": 10000},
            {"No": 2, "name": "釣り", "value": 500},
        ],
    },
    "credit": {
        "label": "クレジット",
        "rows": [
            {"No": 1, "name": "金額", "value": 15000},
            {"No": 2, "name": "カード種別", "value": "VISA"},
            {"No": 3, "name": "支払方法", "value": "一括"},
        ],
    },
    "codepay": {
        "label": "コード決済",
        "rows": [
            {"No": 1, "name": "金額", "value": 5000},
            {"No": 2, "name": "ブランド", "value": "PayPay"},
        ],
    },
}


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
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
        session.commit()

        yield session


@pytest.fixture
def payment_record_item(tmp_path):
    transaction_dir = tmp_path / TRANSACTION_ID
    transaction_dir.mkdir(parents=True)
    file = transaction_dir / f"{PaymentRecordItem.prefix}-{TRANSACTION_ID}.json"

    with open(file, mode="w", encoding="utf-8") as f:
        json.dump(PAYMENT_DATA, f, ensure_ascii=False, indent=2)

    return PaymentRecordItem(TRANSACTION_ID, tmp_path)


def test_payment_record_to_json(session, payment_record_item):
    json_data = payment_record_item.to_json(session)
    assert json_data["transaction_id"] == TRANSACTION_ID
    assert json_data["type"] == "tables"
    assert json_data["name"] == "payment_record"
    assert json_data["label"] == "支払レコード"
    assert json_data["data"] == {
        key: {
            "label": entry["label"],
            "columns": COLUMNS,
            "rows": entry["rows"],
        }
        for key, entry in LABELED_RECORD.items()
    }


def test_payment_record_unknown_category_falls_back_to_raw_key(session, tmp_path):
    """category_labelsに未定義のカテゴリは、日本語ラベルに変換せず生のキーのまま返す"""
    transaction_dir = tmp_path / TRANSACTION_ID
    transaction_dir.mkdir(parents=True)
    file = transaction_dir / f"{PaymentRecordItem.prefix}-{TRANSACTION_ID}.json"
    with open(file, mode="w", encoding="utf-8") as f:
        json.dump({"gift_card": [1000]}, f, ensure_ascii=False, indent=2)

    item = PaymentRecordItem(TRANSACTION_ID, tmp_path)
    json_data = item.to_json(session)

    assert "gift_card" in json_data["data"]
    assert json_data["data"]["gift_card"]["label"] == "gift_card"


def test_payment_record_invalid_structure_raises_item_data_error(
    session, payment_record_item, monkeypatch
):
    monkeypatch.setattr(PaymentRecordItem, "_read", lambda self: ["not", "a", "dict"])
    with pytest.raises(ItemDataError):
        payment_record_item.to_json(session)
