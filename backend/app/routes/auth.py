"""
Auth route – simple username/password login that returns a JWT.

For a production system consider replacing the hard-coded admin credentials
with a proper User table, bcrypt hashing and refresh-token support.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt

from app.config import settings
from app.schemas import TokenRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
ALGORITHM = "HS256"

# In production store hashed credentials in the database.
_DEMO_USERS: dict[str, str] = {
    "admin": "admin123",
    "gate_operator": "gate@123",
}


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Obtain a JWT access token",
)
def login(body: TokenRequest):
    stored_password = _DEMO_USERS.get(body.username)
    if not stored_password or stored_password != body.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(subject=body.username)
    return TokenResponse(access_token=token)
