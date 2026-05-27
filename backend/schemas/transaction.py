from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionCreate(BaseModel):
    title: str
    amount: float
    type: str  # "income" or "expense"
    category: str
    note: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    type: str
    category: str
    date: datetime
    note: Optional[str] = None

    class Config:
        from_attributes = True