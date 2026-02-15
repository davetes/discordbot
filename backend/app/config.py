from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    frontend_origin: str = "http://localhost:3000"
    discord_bot_token: str | None = None
    discord_guild_id: int | None = None
    discord_default_channel_id: int | None = None

    @field_validator("discord_guild_id", "discord_default_channel_id", mode="before")
    @classmethod
    def _empty_to_none(cls, value):
        if value == "" or value is None:
            return None
        return value


settings = Settings()
