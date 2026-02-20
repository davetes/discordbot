from __future__ import annotations

from typing import List
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .config import settings
from .discord_bot import bot_manager
from .database import SessionLocal
from .models import BotSettingsModel, LogEntryModel, CommandModel, ServerSettingsModel


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


class ServerSettings(BaseModel):
    prefix: str
    language: str
    modules: List[str]


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


class CommandToggleRequest(BaseModel):
    enabled: bool


class CommandCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    category: str = "custom"
    description: str | None = None
    response: str | None = None
    cooldown: str = "0s"
    enabled: bool = True


class SettingsUpdateRequest(BaseModel):
    general: dict
    automod: dict
    welcome: dict
    leave: dict
    leveling: dict


class AiIntent(BaseModel):
    id: str
    label: str
    enabled: bool
    response: str


class AiIntentPayload(BaseModel):
    intents: List[AiIntent]


class AiGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=400)
    intent_id: str | None = None


AI_INTENTS: List[AiIntent] = []


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
async def dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
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
    today = datetime.now(timezone.utc).date()
    day_labels = []
    day_counts = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_labels.append(day.strftime("%a"))
        day_counts.append(0)

    log_rows = db.query(LogEntryModel).filter(LogEntryModel.action == "command").all()
    for row in log_rows:
        try:
            ts = datetime.strptime(row.timestamp, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        day = ts.date()
        if day < today - timedelta(days=6) or day > today:
            continue
        idx = (day - (today - timedelta(days=6))).days
        if 0 <= idx < len(day_counts):
            day_counts[idx] += 1

    command_usage = [CommandUsagePoint(day=label, commands=count) for label, count in zip(day_labels, day_counts)]
    log_rows = db.query(LogEntryModel).order_by(LogEntryModel.timestamp.desc()).limit(8).all()
    icon_map = {
        "command": "Terminal",
        "automod": "Shield",
        "message": "Plus",
        "join": "UserPlus",
        "leave": "AlertTriangle",
    }
    recent = [
        ActivityItem(
            id=row.id,
            type=row.action,
            message=(
                f"**{row.server}**: {row.details}" if row.server else f"{row.action}: {row.details}"
            ),
            time=row.timestamp,
            icon=icon_map.get(row.action, "Plus"),
        )
        for row in log_rows
    ]
    return DashboardResponse(
        botInfo=bot,
        statsCards=stats,
        serverGrowth=server_growth,
        commandUsage=command_usage,
        recentActivity=recent,
    )


@router.get("/servers", response_model=List[ServerItem])
async def servers(db: Session = Depends(get_db)) -> List[ServerItem]:
    items: List[ServerItem] = []
    guilds = list(bot_manager.guilds())
    settings_rows = db.query(ServerSettingsModel).filter(ServerSettingsModel.guild_id.in_([g.id for g in guilds])).all()
    settings_by_id = {row.guild_id: row for row in settings_rows}

    for guild in guilds:
        settings_row = settings_by_id.get(guild.id)
        prefix = settings_row.prefix if settings_row else "!"
        language = settings_row.language if settings_row else "english"
        modules = settings_row.modules if settings_row else ["moderation", "utility"]
        joined = guild.me.joined_at.strftime("%Y-%m-%d") if guild.me and guild.me.joined_at else ""
        items.append(
            ServerItem(
                id=guild.id,
                name=guild.name,
                members=guild.member_count or 0,
                joined=joined,
                prefix=prefix,
                language=language.capitalize(),
                modules=modules,
                icon="🌐",
                status="active",
            )
        )
    return items


@router.get("/servers/{guild_id}/settings", response_model=ServerSettings)
async def server_settings_view(guild_id: int, db: Session = Depends(get_db)) -> ServerSettings:
    row = db.query(ServerSettingsModel).filter(ServerSettingsModel.guild_id == guild_id).first()
    if row is None:
        return ServerSettings(prefix="!", language="english", modules=["moderation", "utility"])
    return ServerSettings(prefix=row.prefix, language=row.language, modules=row.modules)


@router.post("/servers/{guild_id}/settings", response_model=ServerSettings)
async def server_settings_update(guild_id: int, payload: ServerSettings, db: Session = Depends(get_db)) -> ServerSettings:
    row = db.query(ServerSettingsModel).filter(ServerSettingsModel.guild_id == guild_id).first()
    if row is None:
        row = ServerSettingsModel(
            guild_id=guild_id,
            prefix=payload.prefix,
            language=payload.language,
            modules=payload.modules,
        )
        db.add(row)
    else:
        row.prefix = payload.prefix
        row.language = payload.language
        row.modules = payload.modules
    db.commit()
    return ServerSettings(prefix=row.prefix, language=row.language, modules=row.modules)


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
async def analytics(range_param: str = "7d", db: Session = Depends(get_db)) -> AnalyticsData:
    now = datetime.now(timezone.utc)
    duration = timedelta(days=7)
    if range_param.endswith("d") and range_param[:-1].isdigit():
        duration = timedelta(days=int(range_param[:-1]))
    elif range_param.endswith("h") and range_param[:-1].isdigit():
        duration = timedelta(hours=int(range_param[:-1]))
    start_time = now - duration

    rows = db.query(LogEntryModel).filter(LogEntryModel.action == "command").all()
    recent_rows = []
    for row in rows:
        try:
            ts = datetime.strptime(row.timestamp, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if ts >= start_time:
            recent_rows.append((row, ts))

    server_counts: dict[str, int] = {}
    hour_counts = {h: 0 for h in range(0, 24, 2)}
    for row, ts in recent_rows:
        if row.server:
            server_counts[row.server] = server_counts.get(row.server, 0) + 1
        bucket = (ts.hour // 2) * 2
        hour_counts[bucket] = hour_counts.get(bucket, 0) + 1

    command_rows = db.query(CommandModel).all()
    categories = {"music": 0, "fun": 0, "moderation": 0, "utility": 0}
    for cmd in command_rows:
        category = cmd.category.lower() if cmd.category else "utility"
        categories[category] = categories.get(category, 0) + (cmd.usage or 0)

    command_breakdown = [
        {"name": "Music", "value": categories.get("music", 0), "fill": "hsl(var(--chart-1))"},
        {"name": "Fun", "value": categories.get("fun", 0), "fill": "hsl(var(--chart-2))"},
        {"name": "Moderation", "value": categories.get("moderation", 0), "fill": "hsl(var(--chart-3))"},
        {"name": "Utility", "value": categories.get("utility", 0), "fill": "hsl(var(--chart-4))"},
    ]

    top_servers = [
        {"name": name, "commands": count}
        for name, count in sorted(server_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    if not top_servers:
        guilds = list(bot_manager.guilds())
        top_servers = [
            {"name": g.name, "commands": 0}
            for g in sorted(guilds, key=lambda x: x.member_count or 0, reverse=True)[:5]
        ]

    peak_hours = [{"hour": f"{h:02d}:00", "users": hour_counts.get(h, 0)} for h in range(0, 24, 2)]
    top_users = []

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


@router.post("/settings", response_model=BotSettings)
async def settings_update(payload: SettingsUpdateRequest, db: Session = Depends(get_db)) -> BotSettings:
    existing = db.query(BotSettingsModel).first()
    if existing is None:
        existing = BotSettingsModel(
            general=payload.general,
            automod=payload.automod,
            welcome=payload.welcome,
            leave=payload.leave,
            leveling=payload.leveling,
        )
        db.add(existing)
    else:
        existing.general = payload.general
        existing.automod = payload.automod
        existing.welcome = payload.welcome
        existing.leave = payload.leave
        existing.leveling = payload.leveling
    db.commit()
    db.refresh(existing)
    try:
        await bot_manager.refresh_settings()
    except Exception:
        pass
    return BotSettings(
        general=existing.general,
        automod=existing.automod,
        welcome=existing.welcome,
        leave=existing.leave,
        leveling=existing.leveling,
    )


@router.post("/commands/{name}/enabled")
async def command_toggle(name: str, payload: CommandToggleRequest, db: Session = Depends(get_db)) -> dict:
    row = db.query(CommandModel).filter(CommandModel.name == name).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Command not found")
    row.enabled = payload.enabled
    db.commit()
    return {"status": "ok", "name": name, "enabled": payload.enabled}


@router.post("/commands/custom")
async def command_create(payload: CommandCreateRequest, db: Session = Depends(get_db)) -> dict:
    exists = db.query(CommandModel).filter(CommandModel.name == payload.name).first()
    if exists is not None:
        raise HTTPException(status_code=409, detail="Command already exists")
    description = payload.description or payload.response or "Custom command"
    row = CommandModel(
        name=payload.name,
        category=payload.category,
        description=description,
        usage=0,
        enabled=payload.enabled,
        cooldown=payload.cooldown,
    )
    db.add(row)
    db.commit()
    return {"status": "created", "name": payload.name}


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


@router.get("/ai/intents", response_model=List[AiIntent])
async def get_ai_intents() -> List[AiIntent]:
    return AI_INTENTS


@router.post("/ai/intents")
async def save_ai_intents(payload: AiIntentPayload) -> dict:
    AI_INTENTS.clear()
    AI_INTENTS.extend(payload.intents)
    return {"status": "saved", "count": len(AI_INTENTS)}


@router.post("/ai/generate")
async def generate_ai_response(payload: AiGenerateRequest) -> dict:
    intents = AI_INTENTS
    chosen = None
    if payload.intent_id:
        chosen = next((i for i in intents if i.id == payload.intent_id), None)
    if chosen is None:
        chosen = next((i for i in intents if i.enabled), None)
    if chosen is None and intents:
        chosen = intents[0]
    canned = chosen.response if chosen else "Thanks for your message! We'll get back to you soon."
    response = f"{canned} (Suggested for: {payload.prompt})"
    return {"response": response}
