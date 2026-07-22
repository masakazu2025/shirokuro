# Shirokuro

POSレジの取引データを管理するツールです。バックエンド（API）とフロントエンド（閲覧UI）を分離したモノレポ構成にしています。

## 構成

```
shirokuro-fullstack/
├── backend/    # FastAPI + SQLModel によるREST API
└── frontend/   # 閲覧UI
```

それぞれのセットアップ・実行方法は各ディレクトリのREADMEを参照してください。

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
