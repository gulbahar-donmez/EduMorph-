from database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime




class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    learning_style = relationship("LearningStyle", back_populates="user", uselist=False)


    tests = relationship("LearningTest", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    learning_style_results = relationship("LearningStyleResult", back_populates="user")
    personality_results = relationship("PersonalityResult", back_populates="user")



class LearningTest(Base):
    __tablename__ = "learning_tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    test_type = Column(String)
    score = Column(Integer)
    test_date = Column(DateTime, default=datetime.utcnow)


    user = relationship("User", back_populates="tests")



class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


    user = relationship("User", back_populates="recommendations")






class LearningStyle(Base):
    __tablename__ = "learning_styles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    visual_score = Column(Integer)
    auditory_score = Column(Integer)
    kinesthetic_score = Column(Integer)
    dominant_style = Column(String)
    assessment_date = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="learning_style")

class LearningStyleResult(Base):
    __tablename__ = "learning_style_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    style = Column(String)
    description = Column(String)
    recommendations = Column(String)  # JSON string olarak saklanacak
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="learning_style_results")

class PersonalityResult(Base):
    __tablename__ = "personality_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    traits = Column(String)  # JSON string olarak saklanacak
    recommendations = Column(String)  # JSON string olarak saklanacak
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="personality_results")