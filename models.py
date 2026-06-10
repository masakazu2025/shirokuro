from sqlmodel import SQLModel, Field
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


class TransactionUpdate(SQLModel):
    started_at: datetime | None
    ended_at: datetime | None


class TransactionItem(SQLModel):
    name: str
    label: str
    url: str


# ----------------------------------------------
#  Pictrure
# ----------------------------------------------


class Picture(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    filename: str
    shop_no: int
    register_no: int
    created_at: datetime  # ファイル作成日時


class PictureResponse(Picture):
    filepath: str
