from pathlib import Path

from app.transaction_items.base import BaseReader, BaseItem


class JournalReader(BaseReader):
    def read(self):
        with open(self.filepath, "r", encoding="utf-8", errors="replace") as f:
            return f.read()


class JournalItem(BaseItem):
    name = "journal"
    label = "ジャーナル"
    prefix = "JOURNAL"
    suffix = ".txt"

    def __init__(self, transaction_id: str, root_dir: Path):
        super().__init__(transaction_id)
        self.filepath = self._resolve_filepath(
            transaction_id,
            root_dir,
            self.prefix,
            self.suffix,
        )

    def _read(self):
        return JournalReader(self.filepath).read()

    def to_json(self) -> dict:
        return {
            "transaction_id": self.transaction_id,
            "type": "text",
            "name": self.name,
            "label": self.label,
            "data": self._read(),
        }
