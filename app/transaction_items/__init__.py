from enum import Enum
from app.transaction_items.journal import JournalItem
from app.transaction_items.picture import PictureItem

_items = [JournalItem, PictureItem]

item_registry = {cls.name: cls for cls in _items}
ItemName = Enum("ItemName", {cls.name: cls.name for cls in _items}, type=str)
