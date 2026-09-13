from pydantic import BaseModel


class ModelInfo(BaseModel):
    name: str | None = None
    version: str | None = None
    architecture: str | None = None
    framework: str = "PyTorch"
    input_size: list[int] | None = None
    classes: list[str] = []
    num_classes: int = 0
    training_dataset: str | None = None
    validation_metrics: dict = {}
    model_available: bool = False
