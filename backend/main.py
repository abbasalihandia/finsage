from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import user, transaction, budget
from routes import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinSage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "FinSage API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}