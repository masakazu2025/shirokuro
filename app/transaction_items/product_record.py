import csv
from pathlib import Path
from sqlmodel import Session, select
from app.transaction_items.base import BaseReader, BaseItem
from models import ProductCategoryMaster


class ProductRecordReader(BaseReader):
    def read(self) -> list[list]:
        with open(self.filepath, "r", encoding="utf-8") as f:
            return list(csv.reader(f))


class ProductRecordFormatter:

    def format(
        self, rows: list[list], masters: list[ProductCategoryMaster]
    ) -> list[dict]:
        lookup = {(m.category_id, m.sub_category_id): m.category_name for m in masters}

        return [
            {
                "category_id": int(row[0]),
                "sub_category_id": int(row[1]),
                "category_name": lookup.get((int(row[0]), int(row[1])), ""),
                "amount": int(row[2]),
                "quantity": int(row[3]),
            }
            for row in rows
        ]


class ProductRecordItem(BaseItem):
    name = "product_record"
    label = "商品レコード"
    prefix = "PRODUCT_RECORD"
    suffix = ".csv"
    columns = [
        {"key": "category_id", "label": "カテゴリID"},
        {"key": "sub_category_id", "label": "サブカテゴリID"},
        {"key": "category_name", "label": "カテゴリ名"},
        {"key": "amount", "label": "金額"},
        {"key": "quantity", "label": "点数"},
    ]

    def __init__(self, transaction_id: str, root_dir: Path):
        super().__init__(transaction_id)
        self.filepath = self._resolve_filepath(
            transaction_id,
            root_dir,
            self.prefix,
            self.suffix,
        )

    def _read(self):
        return ProductRecordReader(self.filepath).read()

    def _format(
        self, rows: list[list], masters: list[ProductCategoryMaster]
    ) -> list[dict]:
        return ProductRecordFormatter().format(rows, masters)

    def to_json(self, session: Session) -> dict:
        rows = self._read()
        masters = session.exec(select(ProductCategoryMaster)).all()
        rows = self._format(rows, masters)

        return {
            "transaction_id": self.transaction_id,
            "type": "table",
            "name": self.name,
            "label": self.label,
            "data": {
                "columns": self.columns,
                "rows": rows,
            },
        }
