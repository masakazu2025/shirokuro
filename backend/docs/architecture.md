# アーキテクチャ

## 全体構成

```
shirokuro-backend/
├── main.py                      # エントリーポイント・ルーター登録
├── database.py                 # DB接続・セッション管理
├── models.py                   # SQLModelデータモデル
└── app/
    ├── routers/
    │   └── transaction.py      # 取引エンドポイント
    └── transaction_items/
        ├── base.py             # アイテムの抽象基底クラス
        ├── journal.py          # ジャーナルアイテム
        ├── product_record.py   # 商品レコードアイテム
        ├── payment_record.py   # 支払レコードアイテム
        └── __init__.py         # レジストリ・Enum定義
```

> 画像（端末スクリーンショット）アイテムは元の社内ツールでは実装されていた機能ですが、
> 今回はスコープ外としています。将来的にレジストリパターンで追加可能です。

## TransactionItems のレジストリパターン

取引に紐づくデータ種別（ジャーナル・画像など）を追加する際に、
ルーター側のコードを変更せず拡張できるよう、レジストリパターンを採用しています。

**仕組み：**

1. `BaseItem` を継承して `name` / `label` / `to_json()` を実装する
2. `__init__.py` の `_items` リストに追加する
3. `item_registry`（dict）と `ItemName`（Enum）が自動生成される

```python
# 新しいアイテムを追加する場合
class NewItem(BaseItem):
    name = "new_item"
    label = "新アイテム"

    def to_json(self) -> dict:
        ...

# __init__.py の _items に追加するだけでAPIに反映される
_items = [JournalItem, ProductRecordItem, PaymentRecordItem, NewItem]
```

`BaseItem.__init_subclass__` により、`name` / `label` の定義漏れをクラス定義時点でエラー検出できます。

## データモデル

```
Transaction
├── transaction_id  (PK, str)
├── shop_no         (int)   店舗番号
├── register_no     (int)   レジ番号
├── transaction_no  (int)   取引番号
├── created_at      (datetime)
├── started_at      (datetime | None)
└── ended_at        (datetime | None)
```

## DB初期化

FastAPI の `lifespan` を使い、アプリ起動時に `SQLModel.metadata.create_all()` でテーブルを自動作成します。
開発環境では SQLite ファイル（`database.db`）を使用します。
