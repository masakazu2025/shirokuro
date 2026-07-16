from datetime import datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.transaction_items import item_registry, JournalItem
from app.transaction_items.base import ItemDataError
from app.transaction_items.payment_record import PaymentRecordItem
from app.transaction_items.product_record import ProductRecordItem
from database import get_session
from models import (
    Transaction,
    TransactionSearchQuery,
    TransactionUpdate,
    TransactionItem,
)
from pathlib import Path

router = APIRouter()


def get_transaction(transaction_id: str, session: Session = Depends(get_session)):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


def get_transaction_root_dir() -> Path:
    return Path("data/transactions")


@router.get("/", response_model=list[Transaction])
def read_transactions(
    search_query: TransactionSearchQuery = Depends(),
    session: Session = Depends(get_session),
):
    """取引一覧を取得します。検索条件を指定した場合は絞り込みます。"""
    if (
        search_query.created_at_from is not None
        and search_query.created_at_to is not None
        and search_query.created_at_from > search_query.created_at_to
    ):
        raise HTTPException(
            status_code=422,
            detail="created_at_from must be before or equal to created_at_to",
        )
    statement = select(Transaction)
    if search_query.shop_no is not None:
        statement = statement.where(Transaction.shop_no == search_query.shop_no)
    if search_query.register_no is not None:
        statement = statement.where(
            Transaction.register_no == search_query.register_no
        )
    if search_query.transaction_no is not None:
        statement = statement.where(
            Transaction.transaction_no == search_query.transaction_no
        )
    if search_query.ipaddress is not None:
        statement = statement.where(
            Transaction.ipaddress == str(search_query.ipaddress)
        )
    if search_query.created_at_from is not None:
        statement = statement.where(
            Transaction.created_at
            >= datetime.combine(search_query.created_at_from, time.min)
        )
    if search_query.created_at_to is not None:
        statement = statement.where(
            Transaction.created_at
            < datetime.combine(
                search_query.created_at_to + timedelta(days=1), time.min
            )
        )
    transactions = session.exec(statement).all()
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
    base_url = request.url_for(
        "read_transaction", transaction_id=transaction.transaction_id
    )
    return [
        {"name": name, "label": cls.label, "url": f"{base_url}/items/{name}"}
        for name, cls in item_registry.items()
    ]


@router.get("/{transaction_id}/items/journal")
def read_journal_item(
    transaction: Transaction = Depends(get_transaction),
    root_dir: Path = Depends(get_transaction_root_dir),
):
    """指定したジャーナルのデータを返します。"""
    item = JournalItem(transaction.transaction_id, root_dir)
    try:
        return item.to_json()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")


@router.get("/{transaction_id}/items/product_record")
def read_product_record_item(
    transaction: Transaction = Depends(get_transaction),
    root_dir: Path = Depends(get_transaction_root_dir),
    session: Session = Depends(get_session),
):
    """指定した商品レコードのデータを返します。"""
    item = ProductRecordItem(transaction.transaction_id, root_dir)
    try:
        return item.to_json(session)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ItemDataError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/{transaction_id}/items/payment_record")
def read_payment_record_item(
    transaction: Transaction = Depends(get_transaction),
    root_dir: Path = Depends(get_transaction_root_dir),
    session: Session = Depends(get_session),
):
    """指定した支払レコードのデータを返します。"""
    item = PaymentRecordItem(transaction.transaction_id, root_dir)
    try:
        return item.to_json(session)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ItemDataError as e:
        raise HTTPException(status_code=422, detail=str(e))
