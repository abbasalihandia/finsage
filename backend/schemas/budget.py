from pydantic import BaseModel

class BudgetCreate(BaseModel):
    category: str
    limit_amount: float
    month: str  # format: "2024-01"

class BudgetResponse(BaseModel):
    id: int
    category: str
    limit_amount: float
    month: str
    spent: float = 0  # calculated field

    class Config:
        from_attributes = True