import pdfplumber
import json
from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file"""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def parse_transactions_with_ai(pdf_text: str) -> list:
    """Use Gemini to extract transactions from bank statement text"""
    
    prompt = f"""
    You are a bank statement parser. Extract all transactions from this bank statement text.
    
    Return ONLY a valid JSON array with no extra text, no markdown, no code blocks.
    Each transaction must have exactly these fields:
    - title: string (description of transaction)
    - amount: number (positive number only)
    - type: string (either "income" or "expense")
    - category: string (one of: food, rent, transport, shopping, entertainment, health, salary, freelance, other)
    - note: string (any extra detail or empty string)
    
    Rules:
    - Credits/deposits = income
    - Debits/withdrawals = expense
    - Guess category from transaction description
    - If you cannot find any transactions, return an empty array []
    
    Bank statement text:
    {pdf_text[:3000]}
    
    Return only the JSON array:
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    raw = response.text.strip()
    
    # Clean up response in case AI adds markdown
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    
    transactions = json.loads(raw)
    return transactions