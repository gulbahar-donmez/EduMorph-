import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List
import json

from fastapi import FastAPI, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from models import User, Base, LearningStyleResult, PersonalityResult
from database import engine, get_db
from schemas import UserCreate, User as UserSchema, Token, TokenData, ContentRequest
from passlib.context import CryptContext
from jose import JWTError, jwt
import google.generativeai as genai

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Güvenlik ayarları
SECRET_KEY = "acoztm3revp1vfj7ld5sz2ndg5xp79r9fnr2p4hx2dy63h6a8efhj6rm54u8evh8"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 saat

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Gemini API yapılandırması
GEMINI_API_KEY = "AIzaSyDW8dyttXw4sq4I6cYjehFEJyh0JtSvqJs"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=Token)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Email kontrolü
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Bu email adresi zaten kullanımda"
            )

        # Kullanıcı adı kontrolü
        existing_username = db.query(User).filter(User.username == user.username).first()
        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Bu kullanıcı adı zaten kullanımda"
            )

        # Yeni kullanıcı oluştur
        hashed_password = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            role="user",
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Access token oluştur
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.username}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Kayıt işlemi sırasında bir hata oluştu: {str(e)}"
        )

@app.post("/token", response_model=Token)
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Login attempt for username: {username}")  # Debug login attempt
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"User not found: {username}")  # Debug user not found
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print(f"Found user: {user.username}, checking password")  # Debug user found
        if not verify_password(password, user.hashed_password):
            print(f"Password verification failed for user: {user.username}")  # Debug password verification
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        print(f"Password verified for user: {user.username}")  # Debug password verified
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        print(f"Token created for user: {user.username}")  # Debug token creation
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug error
        raise HTTPException(
            status_code=500,
            detail=f"Giriş işlemi sırasında bir hata oluştu: {str(e)}"
        )

@app.post("/create-sample-user")
async def create_sample_user(db: Session = Depends(get_db)):
    try:
        # Örnek kullanıcı bilgileri
        sample_user = User(
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            hashed_password=get_password_hash("test123"),
            role="student",
            is_active=True
        )
        
        # Kullanıcıyı veritabanına ekle
        db.add(sample_user)
        db.commit()
        db.refresh(sample_user)
        
        print(f"Sample user created: {sample_user.username}")  # Debug user creation
        
        return {
            "message": "Örnek kullanıcı başarıyla oluşturuldu",
            "user": {
                "username": sample_user.username,
                "email": sample_user.email
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating sample user: {str(e)}")  # Debug error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kullanıcı oluşturulurken hata oluştu: {str(e)}"
        )

@app.post("/api/generate-content")
async def generate_content(request: ContentRequest, current_user: User = Depends(get_current_user)):
    try:
        # Gemini API'yi yapılandır
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        # Prompt'u zenginleştir
        enhanced_prompt = f"""
        Lütfen aşağıdaki konu hakkında detaylı ve kapsamlı bir analiz yapın.
        Analiz en az 500 kelime uzunluğunda olsun ve şu bölümleri içersin:
        
        1. Genel Değerlendirme
        2. Detaylı Analiz
        3. Öneriler ve Stratejiler
        4. Uygulama İpuçları
        5. web formatında yazın
        
        Analiz edilecek konu:
        {request.prompt}
        
        Lütfen yanıtınızı Türkçe olarak verin ve teknik terimleri açıklayın.
        """
        
        # AI'dan yanıt al
        response = model.generate_content(enhanced_prompt)
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="AI yanıtı alınamadı")
            
        return {"content": response.text}
        
    except Exception as e:
        print(f"AI içerik üretme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"İçerik üretilirken bir hata oluştu: {str(e)}")

@app.get("/api/learning-style")
async def get_learning_style(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        print(f"Fetching learning style for user {current_user.username}")  # Debug log
        
        # Kullanıcının en son öğrenme stili sonucunu getir
        result = db.query(LearningStyleResult)\
            .filter(LearningStyleResult.user_id == current_user.id)\
            .order_by(LearningStyleResult.created_at.desc())\
            .first()
            
        if not result:
            print(f"No learning style found for user {current_user.username}")  # Debug log
            raise HTTPException(
                status_code=404,
                detail="Öğrenme stili sonucu bulunamadı"
            )
            
        # JSON string'i Python objesine çevir
        try:
            recommendations = json.loads(result.recommendations)
            print(f"Successfully loaded learning style with recommendations: {recommendations}")  # Debug log
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")  # Debug log
            recommendations = []
            
        return {
            "style": result.style,
            "description": result.description,
            "recommendations": recommendations
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in get_learning_style: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500,
            detail=f"Öğrenme stili sonuçları alınırken bir hata oluştu: {str(e)}"
        )

@app.get("/api/personality-analysis")
async def get_personality_analysis(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        print(f"Fetching personality analysis for user {current_user.username}")  # Debug log
        
        # Kullanıcının en son kişilik analizi sonucunu getir
        result = db.query(PersonalityResult)\
            .filter(PersonalityResult.user_id == current_user.id)\
            .order_by(PersonalityResult.created_at.desc())\
            .first()
            
        if not result:
            print(f"No personality analysis found for user {current_user.username}")  # Debug log
            raise HTTPException(
                status_code=404,
                detail="Kişilik analizi sonucu bulunamadı"
            )
            
        # JSON string'leri Python objelerine çevir
        try:
            traits = json.loads(result.traits)
            recommendations = json.loads(result.recommendations)
            print(f"Successfully loaded personality analysis with traits: {traits}")  # Debug log
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")  # Debug log
            traits = []
            recommendations = []
            
        return {
            "traits": traits,
            "recommendations": recommendations
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in get_personality_analysis: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500,
            detail=f"Kişilik analizi sonuçları alınırken bir hata oluştu: {str(e)}"
        )

@app.post("/api/save-learning-style")
async def save_learning_style(
    result: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"Saving learning style for user {current_user.username}")  # Debug log
        print(f"Received data: {result}")  # Debug log
        
        # Yeni öğrenme stili sonucu oluştur
        new_result = LearningStyleResult(
            user_id=current_user.id,
            style=result.get("style", ""),
            description=result.get("description", ""),
            recommendations=json.dumps(result.get("recommendations", []))
        )
        
        # Veritabanına kaydet
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        
        print(f"Successfully saved learning style with ID: {new_result.id}")  # Debug log
        return {"message": "Öğrenme stili sonucu başarıyla kaydedildi"}
    except Exception as e:
        db.rollback()
        print(f"Error in save_learning_style: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500,
            detail=f"Öğrenme stili sonucu kaydedilirken bir hata oluştu: {str(e)}"
        )

@app.post("/api/save-personality-analysis")
async def save_personality_analysis(
    result: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print(f"Saving personality analysis for user {current_user.username}")  # Debug log
        print(f"Received data: {result}")  # Debug log
        
        # Yeni kişilik analizi sonucu oluştur
        new_result = PersonalityResult(
            user_id=current_user.id,
            traits=json.dumps(result.get("traits", [])),
            recommendations=json.dumps(result.get("recommendations", []))
        )
        
        # Veritabanına kaydet
        db.add(new_result)
        db.commit()
        db.refresh(new_result)
        
        print(f"Successfully saved personality analysis with ID: {new_result.id}")  # Debug log
        return {"message": "Kişilik analizi sonucu başarıyla kaydedildi"}
    except Exception as e:
        db.rollback()
        print(f"Error in save_personality_analysis: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500,
            detail=f"Kişilik analizi sonucu kaydedilirken bir hata oluştu: {str(e)}"
        )

@app.get("/api/user-info")
async def get_user_info(current_user: User = Depends(get_current_user)):
    try:
        return {
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "username": current_user.username
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Kullanıcı bilgileri alınırken bir hata oluştu: {str(e)}"
        )