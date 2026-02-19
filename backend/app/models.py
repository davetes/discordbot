from __future__ import annotations

from sqlalchemy import BigInteger, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class BotSettingsModel(Base):
    __tablename__ = "bot_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    general: Mapped[dict] = mapped_column(JSONB, nullable=False)
    automod: Mapped[dict] = mapped_column(JSONB, nullable=False)
    welcome: Mapped[dict] = mapped_column(JSONB, nullable=False)
    leave: Mapped[dict] = mapped_column(JSONB, nullable=False)
    leveling: Mapped[dict] = mapped_column(JSONB, nullable=False)


class LogEntryModel(Base):
    __tablename__ = "bot_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    timestamp: Mapped[str] = mapped_column(String(32), nullable=False)
    server: Mapped[str] = mapped_column(String(128), nullable=False)
    user: Mapped[str] = mapped_column(String(128), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False)


class CommandModel(Base):
    __tablename__ = "bot_commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    enabled: Mapped[bool] = mapped_column(default=True, nullable=False)
    cooldown: Mapped[str] = mapped_column(String(16), default="0s", nullable=False)
