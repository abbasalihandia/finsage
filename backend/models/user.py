try:
    from sqlalchemy import Column, Integer, String, DateTime  # type: ignore[import]
    from sqlalchemy.sql import func  # type: ignore[import]
except ImportError:
    from typing import Any
    Column = Any
    Integer = Any
    String = Any
    DateTime = Any
    func = Any

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())