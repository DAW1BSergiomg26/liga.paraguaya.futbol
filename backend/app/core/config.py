from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "liga.paraguaya.futbol API"
    app_version: str = "0.6.0"
    debug: bool = True

    database_url: str = "sqlite+aiosqlite:///./data/liga.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    api_football_key: str = ""

    admin_api_key: str = "admin123"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
