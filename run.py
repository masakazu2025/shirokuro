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

# 1. git初期化とリモート登録
git init
git remote add origin git@github.com:masakazu2025/shirokuro2-backend.git

# 2. GitHubの.gitignoreを取得
git pull origin main --allow-unrelated-histories

# 3. 状態確認（.gitignoreで除外されているか確認）
git status

# 4. ステージングとコミット
git add .
git commit -m "Initial commit"

# 5. プッシュ
git push -u origin main
