from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
import re
from typing import Iterable

import discord

from .config import settings
from .database import SessionLocal
from .models import BotSettingsModel, LogEntryModel


DEFAULT_SETTINGS = {
    "general": {"name": "Discord Bot", "status": "online", "activityType": "watching", "avatarUrl": ""},
    "automod": {
        "spamFilter": True,
        "linkFilter": True,
        "capsFilter": False,
        "wordBlacklist": [],
        "maxMentions": 5,
        "maxEmojis": 10,
    },
    "welcome": {"enabled": False, "channel": "#welcome", "message": "Welcome to the server, {user}!", "dmOnJoin": False},
    "leave": {"enabled": False, "channel": "#logs", "message": "{user} has left the server."},
    "leveling": {"enabled": False, "xpPerMessage": 15, "xpCooldown": 60, "levelUpChannel": "#general", "roleRewards": []},
}


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
        self._settings = DEFAULT_SETTINGS
        self._settings_lock = asyncio.Lock()
        self._refresh_task: asyncio.Task[None] | None = None

        @self.client.event
        async def on_ready() -> None:  # type: ignore[override]
            self._ready_event.set()
            if self._refresh_task is None or self._refresh_task.done():
                self._refresh_task = asyncio.create_task(self._periodic_refresh())
            await self.refresh_settings()

        @self.client.event
        async def on_message(message: discord.Message) -> None:  # type: ignore[override]
            if message.author.bot or message.guild is None:
                return
            settings_snapshot = await self.get_settings()
            reason = self._violates_automod(message, settings_snapshot.get("automod", {}))
            if reason:
                try:
                    await message.delete()
                except discord.Forbidden:
                    logging.warning("Missing permissions to delete message: %s", reason)
                except discord.HTTPException:
                    logging.exception("Failed to delete message: %s", reason)
                await self._log_action("automod", f"{reason}: {message.content}")

        @self.client.event
        async def on_member_join(member: discord.Member) -> None:  # type: ignore[override]
            settings_snapshot = await self.get_settings()
            welcome = settings_snapshot.get("welcome", {})
            if not welcome.get("enabled"):
                return
            channel = self._resolve_channel(member.guild, welcome.get("channel", ""))
            if channel:
                content = self._format_template(welcome.get("message", ""), member)
                await channel.send(content)
            if welcome.get("dmOnJoin"):
                try:
                    await member.send(self._format_template(welcome.get("message", ""), member))
                except discord.Forbidden:
                    logging.warning("Missing permissions to DM member on join")

        @self.client.event
        async def on_member_remove(member: discord.Member) -> None:  # type: ignore[override]
            settings_snapshot = await self.get_settings()
            leave = settings_snapshot.get("leave", {})
            if not leave.get("enabled"):
                return
            channel = self._resolve_channel(member.guild, leave.get("channel", ""))
            if channel:
                content = self._format_template(leave.get("message", ""), member)
                await channel.send(content)

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
        if self._refresh_task is not None:
            self._refresh_task.cancel()

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
            try:
                channel = await self.client.fetch_channel(channel_id)
            except discord.NotFound as exc:
                raise ValueError("Channel not found.") from exc
            except discord.Forbidden as exc:
                raise ValueError("Bot does not have permission to access this channel.") from exc
            except discord.HTTPException as exc:
                raise ValueError("Failed to fetch channel from Discord.") from exc

        if not isinstance(channel, (discord.TextChannel, discord.Thread)):
            raise ValueError("Channel is not a text channel.")

        try:
            await channel.send(content)
        except discord.Forbidden as exc:
            raise ValueError("Bot does not have permission to send messages in this channel.") from exc
        except discord.HTTPException as exc:
            raise ValueError("Discord API error while sending message.") from exc

    async def refresh_settings(self) -> None:
        new_settings = await asyncio.to_thread(self._load_settings_sync)
        async with self._settings_lock:
            self._settings = new_settings
        await self._apply_presence(new_settings.get("general", {}))

    async def get_settings(self) -> dict:
        async with self._settings_lock:
            return self._settings

    async def _periodic_refresh(self) -> None:
        while not self.client.is_closed():
            try:
                await self.refresh_settings()
            except Exception:
                logging.exception("Failed to refresh bot settings")
            await asyncio.sleep(60)

    def _load_settings_sync(self) -> dict:
        session = SessionLocal()
        try:
            existing = session.query(BotSettingsModel).first()
            if existing is None:
                existing = BotSettingsModel(
                    general=DEFAULT_SETTINGS["general"],
                    automod=DEFAULT_SETTINGS["automod"],
                    welcome=DEFAULT_SETTINGS["welcome"],
                    leave=DEFAULT_SETTINGS["leave"],
                    leveling=DEFAULT_SETTINGS["leveling"],
                )
                session.add(existing)
                session.commit()
                session.refresh(existing)
            return {
                "general": existing.general,
                "automod": existing.automod,
                "welcome": existing.welcome,
                "leave": existing.leave,
                "leveling": existing.leveling,
            }
        finally:
            session.close()

    async def _apply_presence(self, general: dict) -> None:
        if not self.client.is_ready():
            return
        activity_type = str(general.get("activityType", "watching")).lower()
        activity_name = str(general.get("status", "Online"))
        activity_map = {
            "playing": discord.ActivityType.playing,
            "watching": discord.ActivityType.watching,
            "listening": discord.ActivityType.listening,
            "competing": discord.ActivityType.competing,
        }
        activity = discord.Activity(type=activity_map.get(activity_type, discord.ActivityType.watching), name=activity_name)
        presence_status = str(general.get("status", "online")).lower()
        status_map = {
            "online": discord.Status.online,
            "idle": discord.Status.idle,
            "dnd": discord.Status.dnd,
            "invisible": discord.Status.invisible,
            "offline": discord.Status.offline,
        }
        await self.client.change_presence(activity=activity, status=status_map.get(presence_status, discord.Status.online))

    def _resolve_channel(self, guild: discord.Guild, value: str | None) -> discord.TextChannel | None:
        if not value:
            default_id = settings.discord_default_channel_id
            return guild.get_channel(default_id) if default_id else None
        cleaned = value.strip()
        if cleaned.isdigit():
            channel = guild.get_channel(int(cleaned))
            return channel if isinstance(channel, discord.TextChannel) else None
        if cleaned.startswith("#"):
            cleaned = cleaned[1:]
        return discord.utils.get(guild.text_channels, name=cleaned)

    def _format_template(self, template: str, member: discord.Member) -> str:
        return template.replace("{user}", member.display_name).replace("{server}", member.guild.name)

    def _violates_automod(self, message: discord.Message, automod: dict) -> str | None:
        content = message.content or ""
        lowered = content.lower()
        if automod.get("linkFilter") and ("http://" in lowered or "https://" in lowered or "www." in lowered):
            return "Link filter"

        word_blacklist = [w.lower() for w in automod.get("wordBlacklist", []) if isinstance(w, str)]
        if word_blacklist and any(word in lowered for word in word_blacklist):
            return "Blacklisted word"

        max_mentions = int(automod.get("maxMentions", 0) or 0)
        mention_count = len(message.mentions) + len(message.role_mentions)
        if max_mentions >= 0 and mention_count > max_mentions:
            return "Too many mentions"

        if automod.get("capsFilter"):
            letters = [c for c in content if c.isalpha()]
            if len(letters) >= 10:
                ratio = sum(1 for c in letters if c.isupper()) / len(letters)
                if ratio > 0.7:
                    return "Excessive caps"

        max_emojis = int(automod.get("maxEmojis", 0) or 0)
        if max_emojis > 0:
            emoji_count = self._count_emojis(content)
            if emoji_count > max_emojis:
                return "Too many emojis"

        return None

    def _count_emojis(self, content: str) -> int:
        custom = len(re.findall(r"<a?:\w+:\d+>", content))
        unicode_emojis = len(re.findall(r"[\U0001F300-\U0001FAFF]", content))
        return custom + unicode_emojis

    async def _log_action(self, action: str, details: str) -> None:
        def _write() -> None:
            session = SessionLocal()
            try:
                now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                entry = LogEntryModel(
                    id=int(datetime.now(timezone.utc).timestamp() * 1000),
                    timestamp=now,
                    server="",
                    user="bot",
                    action=action,
                    details=details,
                    level="info",
                )
                session.add(entry)
                session.commit()
            finally:
                session.close()

        await asyncio.to_thread(_write)


bot_manager = DiscordBotManager()


async def start_bot() -> None:
    await bot_manager.start()


async def stop_bot() -> None:
    await bot_manager.close()
