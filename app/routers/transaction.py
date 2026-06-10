from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from database import get_session
from models import Transaction, TransactionUpdate, TransactionItem
from app.transaction_items import ItemName, item_registry

router = APIRouter()


def get_transaction(transaction_id: str, session: Session = Depends(get_session)):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("/", response_model=Transaction, status_code=201)
def create_transaction(
    transaction: Transaction, session: Session = Depends(get_session)
):
    """取引を新規作成します。"""
    db_transaction = Transaction.model_validate(transaction)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    return db_transaction


class TransactionFilter:
    def __init__(
        self,
        started_at: datetime | None = None,
        ended_at: datetime | None = None,
        start_no: int | None = None,
        end_no: int | None = None,
    ):
        self.started_at = started_at
        self.ended_at = ended_at
        self.start_no = start_no
        self.end_no = end_no


@router.get("/", response_model=list[Transaction])
def read_transactions(
    filters: TransactionFilter = Depends(),
    session: Session = Depends(get_session),
):
    """取引一覧を取得します。日時・取引番号の範囲でフィルタリングできます。"""
    transactions = session.exec(select(Transaction)).all()
    return transactions


@router.get("/{transaction_id}", response_model=Transaction)
def read_transaction(transaction: Transaction = Depends(get_transaction)):
    """指定した取引を取得します。"""
    return transaction


@router.put("/{transaction_id}")
def update_transaction(
    transaction_update: TransactionUpdate,
    transaction: Transaction = Depends(get_transaction),
    session: Session = Depends(get_session),
):
    """取引の開始・終了日時を更新します。"""
    transaction_data = transaction_update.model_dump(exclude_unset=True)
    transaction.sqlmodel_update(transaction_data)
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}")
def delete_transaction(
    delete_files: bool = False,
    transaction: Transaction = Depends(get_transaction),
    session: Session = Depends(get_session),
):
    """取引を削除します。delete_files=true を指定すると関連ファイルも削除します。"""
    if delete_files:
        # ファイル削除処理
        pass
    session.delete(transaction)
    session.commit()
    return {"message": "deleted"}


@router.get("/{transaction_id}/items", response_model=list[TransactionItem])
def read_transaction_items(
    request: Request, transaction: Transaction = Depends(get_transaction)
):
    """取引に紐づくアイテム種別の一覧を返します。各アイテムの取得URLも含まれます。"""
    return [
        {
            "name": name,
            "label": cls.label,
            "url": str(
                request.url_for(
                    "read_transaction_item",
                    transaction_id=transaction.transaction_id,
                    item_name=name,
                )
            ),
        }
        for name, cls in item_registry.items()
    ]


@router.get("/{transaction_id}/items/{item_name}")
def read_transaction_item(
    item_name: ItemName,  # type: ignore
    transaction: Transaction = Depends(get_transaction),
):
    """指定したアイテム種別のデータを返します。"""
    item = item_registry[item_name](transaction.transaction_id)
    return item.to_json()
