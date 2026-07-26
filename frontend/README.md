# Shirokuro Frontend

`backend`のREST APIが返す取引データを閲覧するためのUIです。取引一覧から選択すると、ジャーナル・商品レコード・支払レコードをアイテム種別ごとに切り替えて閲覧できます（閲覧専用、更新・削除機能はありません）。

## 技術スタック

| 項目 | 内容 |
|------|------|
| ビルドツール | Vite |
| フレームワーク | React |
| スタイリング | Tailwind CSS |

## セットアップ

```bash
npm install
npm run dev
```

デフォルトでは`http://localhost:8000`のバックエンドAPIに接続します。変更する場合は`.env`に`VITE_API_BASE_URL`を設定してください。

```
VITE_API_BASE_URL=http://localhost:8000
```

バックエンドを先に起動しておく必要があります（[バックエンドのREADME](../backend/README.md)参照）。

## テスト実行

```bash
npm test
```

Vitest + React Testing Libraryでコンポーネントのテストを行っています。

## ドキュメント

- [検索機能の設計](../docs/検索機能.md)
