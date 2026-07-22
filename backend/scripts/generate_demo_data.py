"""デモ用取引データ(ファイル一式 + demo_transactions_data.py)を(再)生成するツール。

通常運用では実行しない。デモデータの内容を変えたくなったときだけ、
手動で `python scripts/generate_demo_data.py create` を実行し、
生成された backend/demo_data/transactions/ と backend/demo_transactions_data.py をコミットする。
"""

import argparse
import csv
import json
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from app.routers.transaction import get_transaction_root_dir
from app.transaction_items.journal import JournalItem
from app.transaction_items.payment_record import PaymentRecordItem
from app.transaction_items.product_record import ProductRecordItem
from models import Transaction
from seed import PAYMENT_LABELS, PRODUCT_CATEGORIES

TRANSACTION_COUNT = 20
BROKEN_PRODUCT_RECORD_INDEXES = {5}
BROKEN_PAYMENT_RECORD_INDEXES = {14}

ITEM_NAMES = ["おにぎり", "お茶", "ティッシュ", "軍手", "レインコート", "サンドイッチ", "コーヒー", "洗剤"]

DATA_MODULE_PATH = Path(__file__).resolve().parent.parent / "demo_transactions_data.py"


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


def _dt_repr(dt: datetime) -> str:
    return (
        f"datetime({dt.year}, {dt.month}, {dt.day}, "
        f"{dt.hour}, {dt.minute}, {dt.second}, {dt.microsecond})"
    )


def _write_manifest(transactions: list[Transaction]) -> None:
    lines = [
        "from datetime import datetime",
        "",
        "# backend/demo_data/transactions/ 配下の固定デモファイルに対応する取引データ。",
        "# scripts/generate_demo_data.py の create() で再生成される。",
        "DEMO_TRANSACTIONS = [",
    ]
    for t in transactions:
        lines.append("    {")
        lines.append(f'        "transaction_id": {t.transaction_id!r},')
        lines.append(f'        "shop_no": {t.shop_no!r},')
        lines.append(f'        "register_no": {t.register_no!r},')
        lines.append(f'        "transaction_no": {t.transaction_no!r},')
        lines.append(f'        "created_at": {_dt_repr(t.created_at)},')
        lines.append(f'        "started_at": {_dt_repr(t.started_at)},')
        lines.append(f'        "ended_at": {_dt_repr(t.ended_at)},')
        lines.append("    },")
    lines.append("]")
    DATA_MODULE_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def clear() -> None:
    root_dir = get_transaction_root_dir()
    if root_dir.exists():
        shutil.rmtree(root_dir)
    print(f"Cleared {root_dir}")


def create() -> None:
    root_dir = get_transaction_root_dir()
    root_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    transactions = []
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
        _write_transaction_files(
            transaction,
            root_dir,
            broken_product=i in BROKEN_PRODUCT_RECORD_INDEXES,
            broken_payment=i in BROKEN_PAYMENT_RECORD_INDEXES,
        )
        transactions.append(transaction)

    _write_manifest(transactions)
    print(f"Created {TRANSACTION_COUNT} demo transactions under {root_dir}")
    print(f"Wrote manifest to {DATA_MODULE_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="デモ用取引データの生成ツール")
    parser.add_argument("action", choices=["clear", "create"])
    args = parser.parse_args()

    if args.action == "clear":
        clear()
    else:
        create()
