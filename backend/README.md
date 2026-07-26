# Shirokuro Backend

POSレジの取引データを管理するREST APIサーバーです。
FastAPI + SQLModel で構築し、取引に紐づく各種データ（ジャーナル・商品レコード・支払レコードなど）を動的に拡張可能な設計にしています。

## 技術スタック

| 項目 | 内容 |
|------|------|
| 言語 | Python 3.12 |
| フレームワーク | FastAPI 0.136 |
| ORM | SQLModel 0.0.38 |
| DB | SQLite(ローカル開発) / Neon Postgres(本番、`DATABASE_URL`環境変数で切り替え) |
| テスト | pytest + httpx2 |
| パッケージ管理 | Poetry |

## セットアップ

```bash
# 依存パッケージのインストール
poetry install

# サーバー起動（DBは初回起動時に自動作成）
poetry run uvicorn main:app --reload
```

（Windowsの場合は`run.bat`でも同じコマンドを実行できます）

起動後、`http://localhost:8000/docs` でSwagger UIを確認できます。

初回起動時（DBが空の場合のみ）、`seed.py`が固定のサンプル取引データ（20件、`demo_transactions_data.py`）をDBに投入します。対応する取引ファイル（ジャーナル・商品レコード・支払レコード）は`demo_data/`配下にコミット済みの固定ファイルで、動的生成はしません。

- 日時: 全件`2026-07-14`（18:40〜20:53）の固定日付です。相対日付では生成していません（`transaction_id`が日時から生成される文字列で、`demo_data/`配下の固定ファイル名にも使われているため、動的に変えると紐付けが崩れます）。フロントエンドの検索UIも、この日付をデフォルト値にしています
- 端末: `10.0.0.1`（店1/レジ1）・`10.0.0.2`（店1/レジ2）・`10.0.0.3`（店1/レジ3）の3台分

うち2件は意図的に解析エラーを起こすデータになっており、エラーハンドリング（HTTP 422）を確認できます。

| 取引番号(transaction_no) | 取引ID(transaction_id) | エラー内容 |
|---|---|---|
| 6 | `2026071419153200005` | 商品レコード(CSV)の1行目のカテゴリIDが`invalid`という不正な値になっている |
| 15 | `2026071420183200014` | 支払レコード(JSON)が`["invalid", "structure"]`という、想定と異なる配列構造になっている |

デモデータの内容自体を作り直したい場合は、`scripts/generate_demo_data.py`（`create`/`clear`）を使ってください（`seed.py`からは独立しており、通常運用では実行不要です）。

## テスト実行

```bash
poetry run pytest
```

## ドキュメント

- [アーキテクチャ](docs/architecture.md)
