from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_db
from app.routers.transaction import router as transaction_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(transaction_router, prefix="/transactions", tags=["transactions"])
