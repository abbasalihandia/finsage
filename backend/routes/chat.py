from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.transaction import Transaction
from schemas.chat import ChatRequest, ChatResponse
from utils.dependencies import get_current_user
from services.ai_service import get_financial_advice

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.post("/ask", response_model=ChatResponse)
def ask_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get user's transactions
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(20).all()

    # Build financial summary
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = total_income - total_expense

    category_spending = {}
    for t in transactions:
        if t.type == "expense":
            category_spending[t.category] = category_spending.get(t.category, 0) + t.amount

    # Format recent transactions for context
    recent = "\n".join([
        f"- {t.title}: ₹{t.amount} ({t.type}, {t.category})"
        for t in transactions[:10]
    ])

    financial_context = {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "category_spending": category_spending,
        "recent_transactions": recent or "No transactions yet"
    }

    try:
        reply = get_financial_advice(request.message, financial_context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")