from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_analyses: int
    analyses_this_week: int
    average_confidence: float
    model_version: str


class DashboardActivityItem(BaseModel):
    date: str
    count: int


class DashboardDistributionItem(BaseModel):
    label: str
    count: int
