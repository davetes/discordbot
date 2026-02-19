from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    frontend_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/tidy_bot_control"
    discord_bot_token: str | None = None
    discord_autostart: bool = True
    discord_guild_id: int | None = None
    discord_default_channel_id: int | None = None

    @field_validator("discord_guild_id", "discord_default_channel_id", mode="before")
    @classmethod
    def _empty_to_none(cls, value):
        if value == "" or value is None:
            return None
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def _default_database_url(cls, value):
        if value == "" or value is None:
            return "postgresql+psycopg://postgres:postgres@localhost:5432/tidy_bot_control"
        return value


settings = Settings()
