from app.transaction_items.base import BaseItem


class PictureItem(BaseItem):
    name = "picture"
    label = "画像"

    def __init__(self, transaction_id: str):
        super().__init__(transaction_id)

    def to_json(self) -> dict:
        return {
            "transaction_id": self.transaction_id,
            "type": "picture",
            "name": self.name,
            "label": self.label,
            "data": [
                {"id": 1, "filepath": "/path/to/picture1"},
                {"id": 2, "filepath": "/path/to/picture2"},
            ],
        }
