from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.budget import Budget
from models.transaction import Transaction
from schemas.budget import BudgetCreate, BudgetResponse
from utils.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/", response_model=BudgetResponse)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if budget already exists for this category and month
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == data.category,
        Budget.month == data.month
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and month"
        )

    budget = Budget(
        user_id=current_user.id,
        category=data.category,
        limit_amount=data.limit_amount,
        month=data.month
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)

    return {
        "id": budget.id,
        "category": budget.category,
        "limit_amount": budget.limit_amount,
        "month": budget.month,
        "spent": 0
    }

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    month: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month
    ).all()

    result = []
    for budget in budgets:
        # Calculate how much has been spent in this category this month
        transactions = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == budget.category,
            Transaction.type == "expense"
        ).all()

        spent = sum(t.amount for t in transactions)

        result.append({
            "id": budget.id,
            "category": budget.category,
            "limit_amount": budget.limit_amount,
            "month": budget.month,
            "spent": spent
        })

    return result