import pytest
from pathlib import Path
from app.transaction_items.journal import JournalItem, JournalReader

TRANSACTION_ID = "2026060721325600001"
JOURNAL_TEXT = "テストジャーナルデータ"


@pytest.fixture
def journal_item(tmp_path):
    journal_dir = tmp_path / TRANSACTION_ID
    journal_dir.mkdir(parents=True)
    file = journal_dir / f"{JournalItem.prefix}-{TRANSACTION_ID}.txt"
    file.write_text(JOURNAL_TEXT, encoding="utf-8")
    return JournalItem(TRANSACTION_ID, tmp_path)


def test_journal_file_to_json(journal_item):
    json_data = journal_item.to_json()
    assert json_data["transaction_id"] == TRANSACTION_ID
    assert json_data["type"] == "text"
    assert json_data["name"] == "journal"
    assert json_data["label"] == "ジャーナル"
    assert json_data["data"] == JOURNAL_TEXT
