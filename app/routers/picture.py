from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from database import get_session
from models import Picture, PictureResponse

router = APIRouter()


@router.post("/", response_model=Picture, status_code=201)
def create_picture(picture: Picture, session: Session = Depends(get_session)):
    db_picture = Picture.model_validate(picture)
    session.add(db_picture)
    session.commit()
    session.refresh(db_picture)
    return db_picture


@router.get("/", response_model=list[PictureResponse])
def read_pictures(session: Session = Depends(get_session)):
    pictures = session.exec(select(Picture)).all()
    return pictures


@router.get("/{picture_id}", response_model=Picture)
def get_picture(picture_id: str, session: Session = Depends(get_session)):
    # picture = session.get(Picture, picture_id)
    ext = "png"
    filepath = f"/path/to/picutre.{ext}"
    return FileResponse(filepath, media_type=f"image/{ext}")
