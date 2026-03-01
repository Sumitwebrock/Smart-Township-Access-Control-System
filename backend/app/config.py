from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Smart Township Access Control System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database – defaults to SQLite (no installation needed)
    # Override with a real DATABASE_URL in .env for production
    DATABASE_URL: str = "sqlite:///./township_gate.db"

    # Security
    SECRET_KEY: str = "change-this-to-a-secure-random-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # File uploads
    UPLOAD_DIR: str = "uploads/photos"
    MAX_UPLOAD_SIZE_MB: int = 5

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
