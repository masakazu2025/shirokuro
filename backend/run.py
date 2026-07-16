from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db
from app.routers.transaction import router as transaction_router
from app.routers.terminal import router as terminal_router
from seed import reset_and_seed_sample_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    reset_and_seed_sample_data()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(transaction_router, prefix="/transactions", tags=["transactions"])
app.include_router(terminal_router, prefix="/terminals", tags=["terminals"])
