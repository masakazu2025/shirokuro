import json
from pathlib import Path
from sqlmodel import Session, select
from app.transaction_items.base import BaseReader, BaseItem
from models import PaymentLabelMaster


class PaymentRecordReader(BaseReader):
    def read(self) -> dict[str, list]:
        with open(self.filepath, "r", encoding="utf-8") as f:
            return json.load(f)


class PaymentRecordFormatter:

    def format_rows(
        self, category: str, rows: list, labels: list[PaymentLabelMaster]
    ) -> list[list]:
        lookup = {(m.category, m.item_id): m.item_label for m in labels}
        return [
            [i, lookup.get((category, i), ""), row]
            for i, row in enumerate(rows, start=1)
        ]

    def format(
        self, data: dict, labels: list[PaymentLabelMaster]
    ) -> dict[str, list[list]]:
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
    ) -> dict[str, list[list]]:
        return PaymentRecordFormatter().format(row_data, labels)

    def to_json(self, session: Session) -> dict:
        row_data = self._read()
        labels = session.exec(select(PaymentLabelMaster)).all()
        row_data = self._format(row_data, labels)
        return {
            "transaction_id": self.transaction_id,
            "type": "tables",
            "name": self.name,
            "label": self.label,
            "data": {
                key: {"columns": self.columns, "rows": rows}
                for key, rows in row_data.items()
            },
        }
