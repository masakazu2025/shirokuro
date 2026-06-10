# Shirokuro Backend

POSレジの取引データを管理するREST APIサーバーです。
FastAPI + SQLModel で構築し、取引に紐づく各種データ（ジャーナル・画像）を動的に拡張可能な設計にしています。

## 技術スタック

| 項目 | 内容 |
|------|------|
| 言語 | Python 3.12 |
| フレームワーク | FastAPI 0.136 |
| ORM | SQLModel 0.0.38 |
| DB | SQLite |
| テスト | pytest + httpx2 |
| パッケージ管理 | Poetry |

## セットアップ

```bash
# 依存パッケージのインストール
poetry install

# サーバー起動（DBは初回起動時に自動作成）
python run.py
```

起動後、`http://localhost:8000/docs` でSwagger UIを確認できます。

## API概要

詳細は [docs/api.md](docs/api.md) を参照してください。

## テスト実行

```bash
poetry run pytest
```

## ドキュメント

- [アーキテクチャ](docs/architecture.md)
