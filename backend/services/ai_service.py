from google import genai
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

def get_financial_advice(user_question: str, financial_context: dict) -> str:
    context = f"""
    You are FinSage, a helpful and friendly personal finance coach.
    
    Here is the user's current financial data:
    - Total Income: ₹{financial_context.get('total_income', 0):,.2f}
    - Total Expenses: ₹{financial_context.get('total_expense', 0):,.2f}
    - Current Balance: ₹{financial_context.get('balance', 0):,.2f}
    - Spending by Category: {financial_context.get('category_spending', {})}
    
    Recent Transactions:
    {financial_context.get('recent_transactions', 'No transactions yet')}
    
    Based on this REAL data, answer the user's question with specific,
    personalized advice. Be concise, friendly, and helpful.
    If the user has no transactions yet, encourage them to add some.
    Always respond in a conversational tone.
    """

    prompt = f"{context}\n\nUser Question: {user_question}"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text