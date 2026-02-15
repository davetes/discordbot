from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Iterable

import discord

from .config import settings


class DiscordBotManager:
    def __init__(self) -> None:
        self.started_at = datetime.now(timezone.utc)
        intents = discord.Intents.default()
        intents.guilds = True
        intents.members = True
        intents.messages = True
        intents.message_content = True
        self.client = discord.Client(intents=intents)
        self._ready_event = asyncio.Event()

        @self.client.event
        async def on_ready() -> None:  # type: ignore[override]
            self._ready_event.set()

    async def start(self) -> None:
        if self.client.is_closed():
            raise RuntimeError("Discord client is closed.")
        if self.client.is_ready():
            return
        token = settings.discord_bot_token
        if not token:
            raise RuntimeError("DISCORD_BOT_TOKEN is not configured.")
        await self.client.start(token)

    async def close(self) -> None:
        if not self.client.is_closed():
            await self.client.close()

    async def wait_until_ready(self, timeout: float = 20.0) -> None:
        await asyncio.wait_for(self._ready_event.wait(), timeout=timeout)

    def is_ready(self) -> bool:
        return self.client.is_ready()

    def guilds(self) -> Iterable[discord.Guild]:
        return self.client.guilds

    def get_guild(self, guild_id: int) -> discord.Guild | None:
        return self.client.get_guild(guild_id)

    async def send_message(self, channel_id: int, content: str) -> None:
        channel = self.client.get_channel(channel_id)
        if channel is None:
            raise ValueError("Channel not found or not cached.")
        if not isinstance(channel, (discord.TextChannel, discord.Thread)):
            raise ValueError("Channel is not a text channel.")
        await channel.send(content)


bot_manager = DiscordBotManager()


async def start_bot() -> None:
    await bot_manager.start()


async def stop_bot() -> None:
    await bot_manager.close()
