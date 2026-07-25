# Shirokuro

![Backend Tests](https://github.com/masakazu2025/shirokuro/actions/workflows/backend-tests.yml/badge.svg)
![Frontend Tests](https://github.com/masakazu2025/shirokuro/actions/workflows/frontend-tests.yml/badge.svg)

POSレジの取引データを管理するツールです。バックエンド（API）とフロントエンド（閲覧UI）を分離したモノレポ構成にしています。

社内で結合テストの評価業務を効率化するために作成したツールを、ポートフォリオ用に切り出し・再構築したものです。実データや社内固有の構造は含まれておらず、細部はデモ用のダミーデータ・簡略化した構造で構成しています。元になったツールの概要は[docs/現行ツール概要.md](docs/現行ツール概要.md)を参照してください。

## デモ

- フロントエンド: https://shirokuro-indol.vercel.app
- バックエンドAPI(Swagger UI): https://shirokuro-api-three.vercel.app/docs

## 構成

```
shirokuro/
├── backend/    # FastAPI + SQLModel によるREST API
└── frontend/   # 閲覧UI
```

それぞれのセットアップ・実行方法は各ディレクトリのREADMEを参照してください。

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
