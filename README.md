# Shirokuro

![Backend Tests](https://github.com/masakazu2025/shirokuro/actions/workflows/backend-tests.yml/badge.svg)
![Frontend Tests](https://github.com/masakazu2025/shirokuro/actions/workflows/frontend-tests.yml/badge.svg)

POSレジの取引データを管理するツールです。バックエンド（API）とフロントエンド（閲覧UI）を分離したモノレポ構成にしています。

社内で結合テストの評価業務を効率化するために作成したツールを、ポートフォリオ用に切り出し・再構築したものです。実データや社内固有の構造は含まれておらず、細部はデモ用のダミーデータ・簡略化した構造で構成しています。元になったツールの概要は[現行ツール概要](docs/現行ツール概要.md)を参照してください。

## デモ

- [フロントエンド](https://shirokuro-indol.vercel.app)
- [バックエンドAPI(Swagger UI)](https://shirokuro-api-three.vercel.app/docs)

## 構成

```
shirokuro/
├── backend/    # FastAPI + SQLModel によるREST API
└── frontend/   # 閲覧UI
```

それぞれのセットアップ・実行方法は各ディレクトリのREADMEを参照してください。

- [バックエンド](backend/README.md)
- [フロントエンド](frontend/README.md)

## ドキュメント

- [現行ツール概要](docs/現行ツール概要.md) - 元になった社内ツールの概要
- [検索機能の設計](docs/検索機能.md) - 検索UIの方針・仕様
- [検索機能 設計まとめ](docs/検索機能サマリー.html) - 非エンジニア向けの要約資料
- [テスト一覧](docs/テスト一覧.md) - バックエンド・フロントエンド・E2Eのテスト内容一覧
