from pathlib import Path

from pydantic_settings import BaseSettings

_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "liga.db"


class Settings(BaseSettings):
    app_name: str = "liga.paraguaya.futbol API"
    app_version: str = "0.6.0"
    debug: bool = True

    database_url: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH.as_posix()}"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,https://frontend-ten-swart-85.vercel.app"

    api_football_key: str = ""

    admin_api_key: str = "Rufi141414%$"

    jwt_secret: str = "change-me-in-production-2026"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "admin@ligapy.app"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
