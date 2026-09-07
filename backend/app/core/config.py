"""Application configuration.

Settings are read from environment variables and an optional ``.env`` file
(``backend/.env``). Values needed by later tasks (database, JWT, Gemini) are
declared here now with safe placeholder defaults so the skeleton boots without a
fully populated ``.env``; later tasks tighten validation.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_name: str = "AI Career Assistant API"
    environment: str = "development"
    debug: bool = True

    # --- Database ---
    # SQLAlchemy URL, e.g. mysql+pymysql://user:pass@host:3306/career_assistant
    database_url: str = ""
    db_echo: bool = False
    db_pool_pre_ping: bool = True
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # --- JWT (Task 5+) ---
    jwt_secret_key: str = "insecure-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # --- Gemini (Task 7+) ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # --- CORS ---
    # Comma-separated in the environment; exposed as a list via ``cors_origins``.
    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def sqlalchemy_url(self) -> str:
        """Validated database URL. Raises if unconfigured."""
        if not self.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
                "and set DATABASE_URL (e.g. mysql+pymysql://career:pass@localhost:3306/career_assistant)."
            )
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance."""
    return Settings()


settings = get_settings()
