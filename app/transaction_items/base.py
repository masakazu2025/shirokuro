from abc import ABC, abstractmethod
from pathlib import Path


class BaseReader(ABC):
    def __init__(self, filepath: Path):
        self.filepath = filepath

    @abstractmethod
    def read(self):
        pass


class BaseItem(ABC):
    def __init__(self, transaction_id: str):
        self.transaction_id = transaction_id

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "name"):
            raise TypeError(f"{cls.__name__} に name が定義されていません")
        if not hasattr(cls, "label"):
            raise TypeError(f"{cls.__name__} に label が定義されていません")

    def _resolve_filepath(
        self,
        transaction_id: str,
        root_dir: Path,
        prefix: str,
        suffix: str,
    ) -> Path:
        dirpath = root_dir / transaction_id
        filename = f"{prefix}-{transaction_id}{suffix}"
        return dirpath / filename
