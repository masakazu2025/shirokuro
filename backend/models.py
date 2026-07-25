from typing import Annotated
from sqlmodel import SQLModel, Field
from pydantic import IPvAnyAddress
from datetime import datetime

# ----------------------------------------------
#  Transaction
# ----------------------------------------------


class Transaction(SQLModel, table=True):
    transaction_id: str = Field(primary_key=True)
    shop_no: int
    register_no: int
    transaction_no: int
    created_at: datetime  # ファイル作成日時
    started_at: datetime | None
    ended_at: datetime | None
    ipaddress: str | None = None


class TransactionUpdate(SQLModel):
    started_at: datetime | None
    ended_at: datetime | None


class TransactionItem(SQLModel):
    name: str
    label: str
    url: str


ShopNo = Annotated[int, Field(ge=1, le=99999)]
RegisterNo = Annotated[int, Field(ge=1, le=99999)]
TransactionNo = Annotated[int, Field(ge=1, le=9999)]


class TransactionSearchQuery(SQLModel):
    shop_no: list[ShopNo] | None = None
    register_no: list[RegisterNo] | None = None
    transaction_no_from: TransactionNo | None = None
    transaction_no_to: TransactionNo | None = None
    created_at_from: datetime | None = None
    created_at_to: datetime | None = None
    ipaddress: list[IPvAnyAddress] | None = None


# ----------------------------------------------
#  Terminal
# ----------------------------------------------


class Terminal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ip: str = Field(unique=True)


class TerminalCreate(SQLModel):
    ip: IPvAnyAddress


# ----------------------------------------------
#  CategoryMaster
# ----------------------------------------------


class ProductCategoryMaster(SQLModel, table=True):
    category_id: int = Field(primary_key=True)
    sub_category_id: int = Field(primary_key=True)
    category_name: str


# ----------------------------------------------
#  PaymentLabelMaster
# ----------------------------------------------


class PaymentLabelMaster(SQLModel, table=True):
    category: str = Field(primary_key=True)
    item_id: int = Field(primary_key=True)
    item_label: str
