from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_db
from app.routers.transaction import router as transaction_router
from seed import reset_and_seed_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    reset_and_seed_sample_data()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(transaction_router, prefix="/transactions", tags=["transactions"])
