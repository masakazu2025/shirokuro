from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from database import get_session
from models import Terminal, TerminalCreate

router = APIRouter()


@router.post("/", response_model=Terminal)
def create_terminal(
    terminal_create: TerminalCreate,
    session: Session = Depends(get_session),
):
    """端末を登録します。"""
    terminal = Terminal(ip=str(terminal_create.ip))
    session.add(terminal)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="ip already registered")
    session.refresh(terminal)
    return terminal


@router.get("/", response_model=list[Terminal])
def read_terminals(session: Session = Depends(get_session)):
    """端末一覧を取得します。"""
    terminals = session.exec(select(Terminal)).all()
    return terminals


@router.delete("/{terminal_id}")
def delete_terminal(terminal_id: int, session: Session = Depends(get_session)):
    """端末を削除します。"""
    terminal = session.get(Terminal, terminal_id)
    if not terminal:
        raise HTTPException(status_code=404, detail="Terminal not found")
    session.delete(terminal)
    session.commit()
    return {"message": "deleted"}
