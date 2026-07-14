from enum import Enum
from app.transaction_items.journal import JournalItem
from app.transaction_items.product_record import ProductRecordItem
from app.transaction_items.payment_record import PaymentRecordItem

_items = [JournalItem, ProductRecordItem, PaymentRecordItem]

item_registry = {cls.name: cls for cls in _items}
ItemName = Enum("ItemName", {cls.name: cls.name for cls in _items}, type=str)
