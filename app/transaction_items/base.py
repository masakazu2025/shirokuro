from abc import ABC, abstractmethod


class BaseItem(ABC):
    def __init__(self, transaction_id: str):
        self.transaction_id = transaction_id

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, "name"):
            raise TypeError(f"{cls.__name__} に name が定義されていません")
        if not hasattr(cls, "label"):
            raise TypeError(f"{cls.__name__} に label が定義されていません")

    @abstractmethod
    def to_json(self) -> dict:
        pass
