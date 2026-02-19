from __future__ import annotations

from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .config import settings
from .discord_bot import bot_manager
from .database import SessionLocal
from .models import BotSettingsModel, LogEntryModel, CommandModel


router = APIRouter()


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class StatusResponse(BaseModel):
    ready: bool
    guild_count: int


class BotInfo(BaseModel):
    name: str
    avatar: str
    status: str
    uptime: str
    version: str


class GuildInfo(BaseModel):
    id: int
    name: str
    member_count: int | None


class DashboardCard(BaseModel):
    label: str
    value: str
    change: str
    icon: str


class ServerGrowthPoint(BaseModel):
    month: str
    servers: int


class CommandUsagePoint(BaseModel):
    day: str
    commands: int


class ActivityItem(BaseModel):
    id: int
    type: str
    message: str
    time: str
    icon: str


class DashboardResponse(BaseModel):
    botInfo: BotInfo
    statsCards: List[DashboardCard]
    serverGrowth: List[ServerGrowthPoint]
    commandUsage: List[CommandUsagePoint]
    recentActivity: List[ActivityItem]


class ChannelInfo(BaseModel):
    id: int
    name: str
    type: str


class ServerItem(BaseModel):
    id: int
    name: str
    members: int
    joined: str
    prefix: str
    language: str
    modules: List[str]
    icon: str
    status: str


class MemberItem(BaseModel):
    id: int
    name: str
    tag: str
    avatar: str
    role: str
    joined: str
    warnings: int
    status: str


class CommandItem(BaseModel):
    name: str
    category: str
    description: str
    usage: int
    enabled: bool
    cooldown: str


class AnalyticsData(BaseModel):
    commandBreakdown: List[dict]
    peakHours: List[dict]
    topServers: List[dict]
    topUsers: List[dict]


class LogItem(BaseModel):
    id: int
    timestamp: str
    server: str
    user: str
    action: str
    details: str
    level: str


class BotSettings(BaseModel):
    general: dict
    automod: dict
    welcome: dict
    leave: dict
    leveling: dict


class MessageRequest(BaseModel):
    channel_id: int = Field(..., description="Discord channel id")
    content: str = Field(..., min_length=1, max_length=2000)


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/bot/status", response_model=StatusResponse)
async def bot_status() -> StatusResponse:
    return StatusResponse(ready=bot_manager.is_ready(), guild_count=len(list(bot_manager.guilds())))


@router.get("/bot/info", response_model=BotInfo)
async def bot_info() -> BotInfo:
    bot_user = bot_manager.client.user
    name = bot_user.name if bot_user else "Discord Bot"
    uptime_seconds = int((datetime.now(timezone.utc) - bot_manager.started_at).total_seconds())
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, _ = divmod(remainder, 60)
    uptime = f"{days}d {hours}h {minutes}m"
    return BotInfo(
        name=name,
        avatar="🤖",
        status="online" if bot_manager.is_ready() else "offline",
        uptime=uptime,
        version="1.0.0",
    )


@router.get("/guilds", response_model=List[GuildInfo])
async def list_guilds() -> List[GuildInfo]:
    return [
        GuildInfo(id=guild.id, name=guild.name, member_count=guild.member_count)
        for guild in bot_manager.guilds()
    ]


@router.get("/guilds/{guild_id}/channels", response_model=List[ChannelInfo])
async def list_channels(guild_id: int) -> List[ChannelInfo]:
    guild = bot_manager.get_guild(guild_id)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    channels = []
    for channel in guild.channels:
        channel_type = channel.__class__.__name__
        channels.append(ChannelInfo(id=channel.id, name=channel.name, type=channel_type))
    return channels


def _resolve_primary_guild_id() -> int | None:
    if settings.discord_guild_id:
        return settings.discord_guild_id
    guilds = list(bot_manager.guilds())
    return guilds[0].id if guilds else None


async def _get_primary_guild():
    guild_id = _resolve_primary_guild_id()
    return bot_manager.get_guild(guild_id) if guild_id else None


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard() -> DashboardResponse:
    bot = await bot_info()
    guilds = list(bot_manager.guilds())
    total_servers = len(guilds)
    total_users = sum(g.member_count or 0 for g in guilds)
    stats = [
        DashboardCard(label="Total Servers", value=str(total_servers), change="+0", icon="Server"),
        DashboardCard(label="Total Users", value=str(total_users), change="+0", icon="Users"),
        DashboardCard(label="Commands Today", value="0", change="+0", icon="Terminal"),
        DashboardCard(label="Voice Sessions", value="0", change="+0", icon="Headphones"),
    ]
    months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]
    server_growth = [ServerGrowthPoint(month=m, servers=total_servers) for m in months]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    command_usage = [CommandUsagePoint(day=d, commands=0) for d in days]
    recent = []
    return DashboardResponse(
        botInfo=bot,
        statsCards=stats,
        serverGrowth=server_growth,
        commandUsage=command_usage,
        recentActivity=recent,
    )


@router.get("/servers", response_model=List[ServerItem])
async def servers() -> List[ServerItem]:
    items: List[ServerItem] = []
    for guild in bot_manager.guilds():
        joined = guild.me.joined_at.strftime("%Y-%m-%d") if guild.me and guild.me.joined_at else ""
        items.append(
            ServerItem(
                id=guild.id,
                name=guild.name,
                members=guild.member_count or 0,
                joined=joined,
                prefix="!",
                language="English",
                modules=["moderation", "utility"],
                icon="🌐",
                status="active",
            )
        )
    return items


@router.get("/members", response_model=List[MemberItem])
async def members() -> List[MemberItem]:
    guild = await _get_primary_guild()
    if guild is None:
        return []
    results: List[MemberItem] = []
    async for member in guild.fetch_members(limit=50):
        joined = member.joined_at.strftime("%Y-%m-%d") if member.joined_at else ""
        role = member.top_role.name if member.top_role else "Member"
        tag = f"#{member.discriminator}" if member.discriminator != "0" else "#0000"
        results.append(
            MemberItem(
                id=member.id,
                name=member.display_name,
                tag=tag,
                avatar="👤",
                role=role,
                joined=joined,
                warnings=0,
                status="offline",
            )
        )
    return results


@router.get("/commands", response_model=List[CommandItem])
async def commands(db: Session = Depends(get_db)) -> List[CommandItem]:
    rows = db.query(CommandModel).all()
    return [
        CommandItem(
            name=row.name,
            category=row.category,
            description=row.description,
            usage=row.usage,
            enabled=row.enabled,
            cooldown=row.cooldown,
        )
        for row in rows
    ]


@router.get("/analytics", response_model=AnalyticsData)
async def analytics(range: str = "7d") -> AnalyticsData:
    guilds = list(bot_manager.guilds())
    top_servers = [
        {"name": g.name, "commands": (g.member_count or 0) * 2}
        for g in sorted(guilds, key=lambda x: x.member_count or 0, reverse=True)[:5]
    ]
    top_users = []
    command_breakdown = [
        {"name": "Music", "value": 0, "fill": "hsl(var(--chart-1))"},
        {"name": "Fun", "value": 0, "fill": "hsl(var(--chart-2))"},
        {"name": "Moderation", "value": 0, "fill": "hsl(var(--chart-3))"},
        {"name": "Utility", "value": 0, "fill": "hsl(var(--chart-4))"},
    ]
    peak_hours = [{"hour": f"{h:02d}:00", "users": 0} for h in range(0, 24, 2)]
    return AnalyticsData(
        commandBreakdown=command_breakdown,
        peakHours=peak_hours,
        topServers=top_servers,
        topUsers=top_users,
    )


@router.get("/logs", response_model=List[LogItem])
async def logs(db: Session = Depends(get_db)) -> List[LogItem]:
    rows = db.query(LogEntryModel).order_by(LogEntryModel.timestamp.desc()).limit(100).all()
    return [
        LogItem(
            id=row.id,
            timestamp=row.timestamp,
            server=row.server,
            user=row.user,
            action=row.action,
            details=row.details,
            level=row.level,
        )
        for row in rows
    ]


@router.get("/settings", response_model=BotSettings)
async def settings_view(db: Session = Depends(get_db)) -> BotSettings:
    existing = db.query(BotSettingsModel).first()
    if existing is None:
        existing = BotSettingsModel(
            general={
                "name": "Discord Bot",
                "status": "Online",
                "activityType": "watching",
                "avatarUrl": "",
            },
            automod={
                "spamFilter": True,
                "linkFilter": True,
                "capsFilter": False,
                "wordBlacklist": [],
                "maxMentions": 5,
                "maxEmojis": 10,
            },
            welcome={
                "enabled": False,
                "channel": "#welcome",
                "message": "Welcome to the server, {user}!",
                "dmOnJoin": False,
            },
            leave={
                "enabled": False,
                "channel": "#logs",
                "message": "{user} has left the server.",
            },
            leveling={
                "enabled": False,
                "xpPerMessage": 15,
                "xpCooldown": 60,
                "levelUpChannel": "#general",
                "roleRewards": [],
            },
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)

    return BotSettings(
        general=existing.general,
        automod=existing.automod,
        welcome=existing.welcome,
        leave=existing.leave,
        leveling=existing.leveling,
    )


@router.post("/messages")
async def send_message(payload: MessageRequest, db: Session = Depends(get_db)) -> dict:
    if not bot_manager.is_ready():
        raise HTTPException(status_code=503, detail="Bot not ready")
    try:
        await bot_manager.send_message(payload.channel_id, payload.content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    log_entry = LogEntryModel(
        id=int(datetime.now(timezone.utc).timestamp() * 1000),
        timestamp=now,
        server="",
        user="bot",
        action="message",
        details=payload.content,
        level="info",
    )
    db.add(log_entry)
    db.commit()
    return {"status": "sent"}


@router.get("/config")
async def get_config() -> dict:
    return {
        "default_guild_id": settings.discord_guild_id,
        "default_channel_id": settings.discord_default_channel_id,
    }
