from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Request
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

# 取引番号の最大値(9999)にちなんだ、検索結果件数の安全弁上限。
SEARCH_RESULT_LIMIT = 10000


def get_transaction(transaction_id: str, session: Session = Depends(get_session)):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


def get_transaction_root_dir() -> Path:
    return Path(__file__).resolve().parent.parent.parent / "demo_data" / "transactions"


# Depends()だとlist型フィールド(shop_no等)がクエリパラメータと認識されずbody扱いになる既知の問題があるため、
# Query()を使う。FastAPI 0.115.0で公式にサポートされたQuery Parameter Models。
# https://github.com/fastapi/fastapi/discussions/10371
# https://github.com/fastapi/fastapi/issues/2869
@router.get("/", response_model=list[Transaction])
def read_transactions(
    search_query: Annotated[TransactionSearchQuery, Query()],
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
    if (
        search_query.transaction_no_from is not None
        and search_query.transaction_no_to is not None
        and search_query.transaction_no_from > search_query.transaction_no_to
    ):
        raise HTTPException(
            status_code=422,
            detail="transaction_no_from must be before or equal to transaction_no_to",
        )
    statement = select(Transaction)
    if search_query.shop_no is not None:
        statement = statement.where(Transaction.shop_no.in_(search_query.shop_no))
    if search_query.register_no is not None:
        statement = statement.where(
            Transaction.register_no.in_(search_query.register_no)
        )
    if search_query.transaction_no_from is not None:
        statement = statement.where(
            Transaction.transaction_no >= search_query.transaction_no_from
        )
    if search_query.transaction_no_to is not None:
        statement = statement.where(
            Transaction.transaction_no <= search_query.transaction_no_to
        )
    if search_query.ipaddress is not None:
        statement = statement.where(
            Transaction.ipaddress.in_([str(ip) for ip in search_query.ipaddress])
        )
    if search_query.created_at_from is not None:
        statement = statement.where(
            Transaction.created_at >= search_query.created_at_from
        )
    if search_query.created_at_to is not None:
        statement = statement.where(
            Transaction.created_at <= search_query.created_at_to
        )
    # 条件を絞らずに検索されたときの事故防止用の安全弁。実運用は日時等で絞られる前提なので、
    # 通常はここに到達しない想定。境界値(ちょうどSEARCH_RESULT_LIMIT件)の扱いは
    # 未実装・理由つきで見送り。詳細はdocs/検索機能.md「以降実装(理由つきで保留)」を参照。
    statement = statement.limit(SEARCH_RESULT_LIMIT)
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
    transaction: Transaction = Depends(get_transaction),
    session: Session = Depends(get_session),
):
    """取引を削除します。"""
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
