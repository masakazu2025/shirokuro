import json
from pathlib import Path
from sqlmodel import Session, select
from app.transaction_items.base import BaseReader, BaseItem, ItemDataError
from models import PaymentLabelMaster


class PaymentRecordReader(BaseReader):
    def read(self) -> dict[str, list]:
        with open(self.filepath, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError as e:
                raise ItemDataError(f"支払レコードの形式が不正です: {e}") from e


class PaymentRecordFormatter:

    def format_rows(
        self, category: str, rows: list, labels: list[PaymentLabelMaster]
    ) -> list[dict]:
        lookup = {(m.category, m.item_id): m.item_label for m in labels}
        return [
            {"No": i, "name": lookup.get((category, i), ""), "value": row}
            for i, row in enumerate(rows, start=1)
        ]

    def format(
        self, data: dict, labels: list[PaymentLabelMaster]
    ) -> dict[str, list[dict]]:
        return {key: self.format_rows(key, rows, labels) for key, rows in data.items()}


class PaymentRecordItem(BaseItem):
    name = "payment_record"
    label = "支払レコード"
    prefix = "PAYMENT_RECORD"
    suffix = ".json"
    columns = [
        {"key": "No", "label": "No"},
        {"key": "name", "label": "項目名"},
        {"key": "value", "label": "値"},
    ]
    # 支払手段は種類が固定的で少数のため、DBマスタ化はせずここでハードコードする。
    # 未定義のカテゴリは生のキーのまま表示する。
    category_labels = {
        "cash": "現金",
        "credit": "クレジット",
        "codepay": "コード決済",
    }

    def __init__(self, transaction_id: str, root_dir: Path):
        super().__init__(transaction_id)
        self.filepath = self._resolve_filepath(
            transaction_id,
            root_dir,
            self.prefix,
            self.suffix,
        )

    def _read(self) -> dict[str, list]:
        return PaymentRecordReader(self.filepath).read()

    def _format(
        self, row_data: dict[str, list], labels: list[PaymentLabelMaster]
    ) -> dict[str, list[dict]]:
        return PaymentRecordFormatter().format(row_data, labels)

    def to_json(self, session: Session) -> dict:
        row_data = self._read()
        labels = session.exec(select(PaymentLabelMaster)).all()
        try:
            row_data = self._format(row_data, labels)
        except (AttributeError, TypeError) as e:
            raise ItemDataError(f"支払レコードの形式が不正です: {e}") from e
        return {
            "transaction_id": self.transaction_id,
            "type": "tables",
            "name": self.name,
            "label": self.label,
            "data": {
                key: {
                    "label": self.category_labels.get(key, key),
                    "columns": self.columns,
                    "rows": rows,
                }
                for key, rows in row_data.items()
            },
        }
