from app.transaction_items.base import BaseItem


class JournalItem(BaseItem):
    name = "journal"
    label = "ジャーナル"

    def __init__(self, transaction_id: str):
        super().__init__(transaction_id)

    def to_json(self) -> dict:
        return {
            "transaction_id": self.transaction_id,
            "type": "text",
            "name": self.name,
            "label": self.label,
            "data": """
                    レシートイメージ
                    """,
        }
