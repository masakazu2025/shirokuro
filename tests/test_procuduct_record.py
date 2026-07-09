import pytest
import csv
from app.transaction_items.product_record import ProductRecordItem
from sqlmodel import create_engine, SQLModel, Session
from sqlmodel.pool import StaticPool
from models import ProductCategoryMaster

TRANSACTION_ID = "2026060721325600001"

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

COLUMNS = [
    {"key": "category_id", "label": "カテゴリID"},
    {"key": "sub_category_id", "label": "サブカテゴリID"},
    {"key": "category_name", "label": "カテゴリ名"},
    {"key": "amount", "label": "金額"},
    {"key": "quantity", "label": "点数"},
]

LABELED_RECORD = [
    {
        "category_id": 1,
        "sub_category_id": 1,
        "category_name": "食品",
        "amount": 600,
        "quantity": 2,
    },
    {
        "category_id": 1,
        "sub_category_id": 2,
        "category_name": "飲料",
        "amount": 300,
        "quantity": 2,
    },
    {
        "category_id": 2,
        "sub_category_id": 1,
        "category_name": "日用品",
        "amount": 800,
        "quantity": 1,
    },
    {
        "category_id": 2,
        "sub_category_id": 2,
        "category_name": "園芸用品",
        "amount": 1200,
        "quantity": 1,
    },
]


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        for record in PRODUCT_CATEGORY:
            db_record = ProductCategoryMaster.model_validate(record)
            session.add(db_record)
        session.commit()

        yield session


@pytest.fixture
def product_record_item(tmp_path):
    transaction_dir = tmp_path / TRANSACTION_ID
    transaction_dir.mkdir(parents=True)
    file = transaction_dir / f"{ProductRecordItem.prefix}-{TRANSACTION_ID}.csv"

    with open(file, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(PRODUCT_DATA)

    return ProductRecordItem(TRANSACTION_ID, tmp_path)


def test_product_record_to_json(session, product_record_item):
    json_data = product_record_item.to_json(session)
    assert json_data["transaction_id"] == TRANSACTION_ID
    assert json_data["type"] == "table"
    assert json_data["name"] == "product_record"
    assert json_data["label"] == "商品レコード"
    assert json_data["data"] == {"columns": COLUMNS, "rows": LABELED_RECORD}
