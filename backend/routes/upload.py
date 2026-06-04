import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.transaction import Transaction
from utils.dependencies import get_current_user
from services.pdf_parser import extract_text_from_pdf, parse_transactions_with_ai

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/bank-statement")
async def upload_bank_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Extract text from PDF
        pdf_text = extract_text_from_pdf(tmp_path)

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Parse transactions using AI
        transactions = parse_transactions_with_ai(pdf_text)

        if not transactions:
            return {"message": "No transactions found", "transactions": []}

        # Save all transactions to database
        saved = []
        for t in transactions:
            transaction = Transaction(
                user_id=current_user.id,
                title=t.get("title", "Unknown"),
                amount=float(t.get("amount", 0)),
                type=t.get("type", "expense"),
                category=t.get("category", "other"),
                note=t.get("note", "")
            )
            db.add(transaction)
            saved.append(t)

        db.commit()

        return {
            "message": f"Successfully imported {len(saved)} transactions",
            "count": len(saved),
            "transactions": saved
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

    finally:
        # Always clean up temp file
        os.unlink(tmp_path)