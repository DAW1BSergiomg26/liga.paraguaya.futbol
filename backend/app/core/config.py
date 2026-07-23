import os
import secrets
from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field

_DEFAULT_DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
_DEFAULT_DB_PATH = _DEFAULT_DB_DIR / "liga.db"


class Settings(BaseSettings):
    app_name: str = "liga.paraguaya.futbol API"
    app_version: str = "0.6.0"
    debug: bool = True

    database_url: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH.as_posix()}"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,https://ligaparaguayafutbol-qq067uc6x-daw1bsergiomg26s-projects.vercel.app"

    api_football_key: str = ""

    # En produccion (Render) se setea via variable de entorno ADMIN_API_KEY.
    # Si no se setea, queda vacia y las rutas admin quedan bloqueadas hasta
    # configurarla. No hay default inseguro hardcodeado.
    admin_api_key: str = ""

    # En produccion (Koyeb) se debe setear JWT_SECRET via variable de entorno.
    # Si no se setea, se genera un secreto efimero por arranque (los tokens
    # previos dejan de ser validos al reiniciar el contenedor).
    jwt_secret: str = Field(default_factory=lambda: os.environ.get("JWT_SECRET", "") or secrets.token_hex(32))
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
