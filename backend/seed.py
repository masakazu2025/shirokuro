from sqlmodel import Session, select

from database import engine
from demo_transactions_data import DEMO_TRANSACTIONS
from models import PaymentLabelMaster, ProductCategoryMaster, Transaction

PRODUCT_CATEGORIES = [
    (1, 1, "食品"),
    (1, 2, "飲料"),
    (2, 1, "日用品"),
    (2, 2, "アウトドア用品"),
]

PAYMENT_LABELS = {
    "cash": ["金額", "釣り"],
    "credit": ["金額", "カード種別", "支払方法"],
    "codepay": ["金額", "ブランド"],
}


def _seed_masters(session: Session) -> None:
    for category_id, sub_category_id, category_name in PRODUCT_CATEGORIES:
        session.add(
            ProductCategoryMaster(
                category_id=category_id,
                sub_category_id=sub_category_id,
                category_name=category_name,
            )
        )
    for category, labels in PAYMENT_LABELS.items():
        for item_id, item_label in enumerate(labels, start=1):
            session.add(
                PaymentLabelMaster(
                    category=category, item_id=item_id, item_label=item_label
                )
            )


def reset_and_seed_sample_data() -> None:
    """初回起動時のみ、固定デモデータをDBに投入する。既にデータがあれば何もしない。"""
    with Session(engine) as session:
        if session.exec(select(Transaction)).first() is not None:
            return

        _seed_masters(session)
        for data in DEMO_TRANSACTIONS:
            session.add(Transaction(**data))
        session.commit()
