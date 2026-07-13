import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from sqlmodel import Session, select

from app.routers.transaction import get_transaction_root_dir
from app.transaction_items.journal import JournalItem
from app.transaction_items.payment_record import PaymentRecordItem
from app.transaction_items.product_record import ProductRecordItem
from database import engine
from models import PaymentLabelMaster, ProductCategoryMaster, Transaction

TRANSACTION_COUNT = 20
BROKEN_PRODUCT_RECORD_INDEXES = {5}
BROKEN_PAYMENT_RECORD_INDEXES = {14}

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

ITEM_NAMES = ["おにぎり", "お茶", "ティッシュ", "軍手", "レインコート", "サンドイッチ", "コーヒー", "洗剤"]


def _clear_transaction_files(root_dir: Path) -> None:
    if not root_dir.exists():
        return
    for transaction_dir in root_dir.iterdir():
        if not transaction_dir.is_dir():
            continue
        for f in transaction_dir.iterdir():
            f.unlink()
        transaction_dir.rmdir()


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


def _build_journal_text(transaction: Transaction) -> str:
    item_lines = []
    total = 0
    for _ in range(random.randint(1, 4)):
        name = random.choice(ITEM_NAMES)
        price = random.randint(100, 800)
        item_lines.append(f"{name}  {price}円")
        total += price
    return (
        "*** レシート ***\n"
        f"店舗番号: {transaction.shop_no}\n"
        f"レジ番号: {transaction.register_no}\n"
        f"取引番号: {transaction.transaction_no}\n"
        "------------------------\n"
        + "\n".join(item_lines)
        + "\n------------------------\n"
        f"合計: {total}円\n"
        f"{transaction.created_at:%Y-%m-%d %H:%M:%S}\n"
    )


def _build_product_record_rows(broken: bool) -> list[list]:
    rows = []
    for _ in range(random.randint(1, 3)):
        category_id, sub_category_id, _ = random.choice(PRODUCT_CATEGORIES)
        amount = random.randint(100, 2000)
        quantity = random.randint(1, 5)
        rows.append([category_id, sub_category_id, amount, quantity])
    if broken:
        rows.append(["invalid", 1, 500, 1])
    return rows


def _build_payment_record_data(broken: bool):
    if broken:
        return ["invalid", "structure"]
    methods = random.sample(list(PAYMENT_LABELS), k=random.randint(1, 2))
    data = {}
    for method in methods:
        if method == "cash":
            data[method] = [random.randint(500, 5000), random.randint(0, 500)]
        elif method == "credit":
            data[method] = [
                random.randint(500, 5000),
                random.choice(["VISA", "Master", "JCB"]),
                random.choice(["一括", "分割"]),
            ]
        else:
            data[method] = [
                random.randint(500, 5000),
                random.choice(["PayPay", "楽天Pay", "d払い"]),
            ]
    return data


def _write_transaction_files(
    transaction: Transaction, root_dir: Path, broken_product: bool, broken_payment: bool
) -> None:
    transaction_dir = root_dir / transaction.transaction_id
    transaction_dir.mkdir(parents=True, exist_ok=True)

    journal_path = (
        transaction_dir
        / f"{JournalItem.prefix}-{transaction.transaction_id}{JournalItem.suffix}"
    )
    journal_path.write_text(_build_journal_text(transaction), encoding="utf-8")

    product_path = (
        transaction_dir
        / f"{ProductRecordItem.prefix}-{transaction.transaction_id}{ProductRecordItem.suffix}"
    )
    with open(product_path, "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(_build_product_record_rows(broken_product))

    payment_path = (
        transaction_dir
        / f"{PaymentRecordItem.prefix}-{transaction.transaction_id}{PaymentRecordItem.suffix}"
    )
    with open(payment_path, "w", encoding="utf-8") as f:
        json.dump(_build_payment_record_data(broken_payment), f, ensure_ascii=False, indent=2)


def reset_and_seed_sample_data() -> None:
    root_dir = get_transaction_root_dir()

    with Session(engine) as session:
        for transaction in session.exec(select(Transaction)).all():
            session.delete(transaction)
        for master in session.exec(select(ProductCategoryMaster)).all():
            session.delete(master)
        for master in session.exec(select(PaymentLabelMaster)).all():
            session.delete(master)
        session.commit()

        _clear_transaction_files(root_dir)
        _seed_masters(session)
        session.commit()

        now = datetime.now()
        for i in range(TRANSACTION_COUNT):
            created_at = now - timedelta(minutes=(TRANSACTION_COUNT - i) * 7)
            transaction = Transaction(
                transaction_id=f"{created_at:%Y%m%d%H%M%S}{i:05d}",
                shop_no=1,
                register_no=random.randint(1, 3),
                transaction_no=i + 1,
                created_at=created_at,
                started_at=created_at,
                ended_at=created_at + timedelta(minutes=random.randint(1, 5)),
            )
            session.add(transaction)
            session.commit()
            session.refresh(transaction)

            _write_transaction_files(
                transaction,
                root_dir,
                broken_product=i in BROKEN_PRODUCT_RECORD_INDEXES,
                broken_payment=i in BROKEN_PAYMENT_RECORD_INDEXES,
            )
