from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from config import AGENT_TOKEN_MINUTES, ALGORITHM, SECRET_KEY, TOKEN_MINUTES
from database import get_db
from models import User
from schemas import StaffCreate, Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_token(user: User) -> str:
    minutes = AGENT_TOKEN_MINUTES if user.role == "agent" else TOKEN_MINUTES
    expires = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": str(user.id), "exp": expires}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    try:
        user_id = int(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise invalid
    user = db.get(User, user_id)
    if not user:
        raise invalid
    return user


def require_roles(*roles: str):
    def check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Only {', '.join(roles)} can do this")
        return user

    return check


def add_user(db: Session, username: str, password: str, role: str) -> User:
    if db.scalar(select(User).where(User.username == username)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already taken")
    user = User(username=username, password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_owner(data: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(func.count(User.id))):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Store already has an owner; ask them to add you")
    return add_user(db, data.username, data.password, "owner")


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def add_staff(data: StaffCreate, db: Session = Depends(get_db), _: User = Depends(require_roles("owner"))):
    return add_user(db, data.username, data.password, data.role)


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles("owner"))):
    return db.scalars(select(User).order_by(User.id)).all()


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == form.username))
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong username or password")
    return Token(access_token=create_token(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
