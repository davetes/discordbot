export const botInfo = {
  name: "AuroraBot",
  avatar: "🤖",
  status: "online" as const,
  uptime: "14d 7h 23m",
  version: "3.2.1",
};

export const statsCards = [
  { label: "Total Servers", value: "1,247", change: "+12", icon: "Server" },
  { label: "Total Users", value: "84,329", change: "+843", icon: "Users" },
  { label: "Commands Today", value: "12,847", change: "+2.4%", icon: "Terminal" },
  { label: "Voice Sessions", value: "38", change: "+5", icon: "Headphones" },
];

export const serverGrowth = [
  { month: "Aug", servers: 980 },
  { month: "Sep", servers: 1020 },
  { month: "Oct", servers: 1065 },
  { month: "Nov", servers: 1120 },
  { month: "Dec", servers: 1180 },
  { month: "Jan", servers: 1220 },
  { month: "Feb", servers: 1247 },
];

export const commandUsage = [
  { day: "Mon", commands: 1820 },
  { day: "Tue", commands: 2100 },
  { day: "Wed", commands: 1950 },
  { day: "Thu", commands: 2340 },
  { day: "Fri", commands: 2780 },
  { day: "Sat", commands: 3100 },
  { day: "Sun", commands: 2650 },
];

export const recentActivity = [
  { id: 1, type: "join", message: "Bot added to **Pixel Paradise**", time: "2 min ago", icon: "Plus" },
  { id: 2, type: "command", message: "!ban executed by **ModeratorX** in Gaming Hub", time: "5 min ago", icon: "Terminal" },
  { id: 3, type: "mod", message: "Auto-mod removed spam in **Chill Zone**", time: "8 min ago", icon: "Shield" },
  { id: 4, type: "join", message: "New member **CoolUser#1234** joined via invite", time: "12 min ago", icon: "UserPlus" },
  { id: 5, type: "command", message: "!play Lofi Beats requested in **Music Lounge**", time: "15 min ago", icon: "Music" },
  { id: 6, type: "mod", message: "Warning issued to **ToxicPlayer** in Ranked Chat", time: "20 min ago", icon: "AlertTriangle" },
];

export const servers = [
  { id: 1, name: "Gaming Hub", members: 15420, joined: "2024-03-15", prefix: "!", language: "English", modules: ["moderation", "music", "fun"], icon: "🎮", status: "active" },
  { id: 2, name: "Pixel Paradise", members: 8930, joined: "2024-06-22", prefix: "?", language: "English", modules: ["moderation", "utility"], icon: "🌴", status: "active" },
  { id: 3, name: "Music Lounge", members: 4210, joined: "2024-08-10", prefix: "!", language: "English", modules: ["music", "fun"], icon: "🎵", status: "active" },
  { id: 4, name: "Dev Central", members: 12750, joined: "2024-01-08", prefix: ".", language: "English", modules: ["moderation", "utility", "fun"], icon: "💻", status: "active" },
  { id: 5, name: "Chill Zone", members: 6340, joined: "2024-09-01", prefix: "!", language: "Spanish", modules: ["moderation", "music"], icon: "☕", status: "active" },
  { id: 6, name: "Art Studio", members: 3180, joined: "2024-11-14", prefix: "-", language: "English", modules: ["utility", "fun"], icon: "🎨", status: "inactive" },
  { id: 7, name: "Ranked Arena", members: 9870, joined: "2024-04-20", prefix: "!", language: "English", modules: ["moderation", "utility"], icon: "⚔️", status: "active" },
  { id: 8, name: "Anime Corner", members: 7650, joined: "2024-07-03", prefix: "~", language: "Japanese", modules: ["fun", "music", "utility"], icon: "🌸", status: "active" },
];

export const members = [
  { id: 1, name: "ModeratorX", tag: "#0001", avatar: "🛡️", role: "Admin", joined: "2024-01-10", warnings: 0, status: "online" },
  { id: 2, name: "CoolUser", tag: "#1234", avatar: "😎", role: "Member", joined: "2024-06-15", warnings: 1, status: "online" },
  { id: 3, name: "ToxicPlayer", tag: "#6666", avatar: "💀", role: "Member", joined: "2024-03-22", warnings: 3, status: "offline" },
  { id: 4, name: "MusicBot_Fan", tag: "#4321", avatar: "🎶", role: "VIP", joined: "2024-02-28", warnings: 0, status: "idle" },
  { id: 5, name: "NightOwl", tag: "#9999", avatar: "🦉", role: "Moderator", joined: "2024-04-05", warnings: 0, status: "dnd" },
  { id: 6, name: "PixelArtist", tag: "#5678", avatar: "🎨", role: "Member", joined: "2024-08-12", warnings: 2, status: "online" },
  { id: 7, name: "SpeedRunner", tag: "#3333", avatar: "🏃", role: "Member", joined: "2024-05-20", warnings: 0, status: "online" },
  { id: 8, name: "ChillVibes", tag: "#7777", avatar: "🧘", role: "VIP", joined: "2024-07-01", warnings: 0, status: "idle" },
  { id: 9, name: "CodeMaster", tag: "#2222", avatar: "⌨️", role: "Admin", joined: "2024-01-05", warnings: 0, status: "online" },
  { id: 10, name: "Troll_King", tag: "#0666", avatar: "👹", role: "Member", joined: "2024-09-30", warnings: 5, status: "offline" },
];

export const commands = [
  { name: "ban", category: "moderation", description: "Ban a user from the server", usage: 1240, enabled: true, cooldown: "5s" },
  { name: "kick", category: "moderation", description: "Kick a user from the server", usage: 890, enabled: true, cooldown: "3s" },
  { name: "mute", category: "moderation", description: "Mute a user in the server", usage: 2100, enabled: true, cooldown: "3s" },
  { name: "warn", category: "moderation", description: "Issue a warning to a user", usage: 3450, enabled: true, cooldown: "2s" },
  { name: "purge", category: "moderation", description: "Delete multiple messages at once", usage: 670, enabled: true, cooldown: "10s" },
  { name: "play", category: "music", description: "Play a song in voice channel", usage: 8920, enabled: true, cooldown: "2s" },
  { name: "skip", category: "music", description: "Skip the current song", usage: 4530, enabled: true, cooldown: "1s" },
  { name: "queue", category: "music", description: "Show the current music queue", usage: 3210, enabled: true, cooldown: "3s" },
  { name: "pause", category: "music", description: "Pause the current song", usage: 1870, enabled: true, cooldown: "1s" },
  { name: "meme", category: "fun", description: "Get a random meme", usage: 6780, enabled: true, cooldown: "5s" },
  { name: "joke", category: "fun", description: "Tell a random joke", usage: 4120, enabled: true, cooldown: "5s" },
  { name: "8ball", category: "fun", description: "Ask the magic 8-ball", usage: 3890, enabled: true, cooldown: "3s" },
  { name: "poll", category: "utility", description: "Create a poll", usage: 2340, enabled: true, cooldown: "10s" },
  { name: "remind", category: "utility", description: "Set a reminder", usage: 1560, enabled: true, cooldown: "5s" },
  { name: "serverinfo", category: "utility", description: "Get server information", usage: 980, enabled: true, cooldown: "5s" },
  { name: "userinfo", category: "utility", description: "Get user information", usage: 1230, enabled: false, cooldown: "5s" },
];

export const analyticsData = {
  commandBreakdown: [
    { name: "Music", value: 18530, fill: "hsl(var(--chart-1))" },
    { name: "Fun", value: 14790, fill: "hsl(var(--chart-2))" },
    { name: "Moderation", value: 8350, fill: "hsl(var(--chart-3))" },
    { name: "Utility", value: 6110, fill: "hsl(var(--chart-4))" },
  ],
  peakHours: [
    { hour: "00:00", users: 120 }, { hour: "02:00", users: 80 },
    { hour: "04:00", users: 45 }, { hour: "06:00", users: 60 },
    { hour: "08:00", users: 180 }, { hour: "10:00", users: 320 },
    { hour: "12:00", users: 450 }, { hour: "14:00", users: 520 },
    { hour: "16:00", users: 680 }, { hour: "18:00", users: 890 },
    { hour: "20:00", users: 1020 }, { hour: "22:00", users: 760 },
  ],
  topServers: [
    { name: "Gaming Hub", commands: 4230 },
    { name: "Dev Central", commands: 3180 },
    { name: "Ranked Arena", commands: 2870 },
    { name: "Anime Corner", commands: 2450 },
    { name: "Pixel Paradise", commands: 1920 },
  ],
  topUsers: [
    { name: "ModeratorX", commands: 892 },
    { name: "CodeMaster", commands: 745 },
    { name: "NightOwl", commands: 623 },
    { name: "MusicBot_Fan", commands: 581 },
    { name: "SpeedRunner", commands: 434 },
  ],
};

export const logs = [
  { id: 1, timestamp: "2025-02-15 14:32:01", server: "Gaming Hub", user: "ModeratorX", action: "ban", details: "Banned ToxicPlayer for spam", level: "warn" },
  { id: 2, timestamp: "2025-02-15 14:28:45", server: "Chill Zone", user: "AuroraBot", action: "automod", details: "Removed spam message (3 links detected)", level: "info" },
  { id: 3, timestamp: "2025-02-15 14:25:12", server: "Music Lounge", user: "MusicBot_Fan", action: "command", details: "!play Lofi Hip Hop Radio", level: "info" },
  { id: 4, timestamp: "2025-02-15 14:20:33", server: "Dev Central", user: "CodeMaster", action: "role_change", details: "Promoted SpeedRunner to Moderator", level: "info" },
  { id: 5, timestamp: "2025-02-15 14:15:07", server: "Ranked Arena", user: "NightOwl", action: "mute", details: "Muted Troll_King for 30 minutes", level: "warn" },
  { id: 6, timestamp: "2025-02-15 14:10:22", server: "Gaming Hub", user: "AuroraBot", action: "error", details: "Failed to connect to voice channel #general", level: "error" },
  { id: 7, timestamp: "2025-02-15 14:05:48", server: "Pixel Paradise", user: "PixelArtist", action: "message_delete", details: "Deleted 15 messages in #off-topic", level: "info" },
  { id: 8, timestamp: "2025-02-15 14:00:11", server: "Anime Corner", user: "ChillVibes", action: "command", details: "!meme requested in #memes", level: "info" },
  { id: 9, timestamp: "2025-02-15 13:55:30", server: "Gaming Hub", user: "AuroraBot", action: "join", details: "New member CoolUser#1234 joined", level: "info" },
  { id: 10, timestamp: "2025-02-15 13:50:05", server: "Art Studio", user: "ModeratorX", action: "warn", details: "Warning #2 issued to PixelArtist", level: "warn" },
];

export const botSettings = {
  general: {
    name: "AuroraBot",
    status: "Watching over 1,247 servers",
    activityType: "watching",
    avatarUrl: "",
  },
  automod: {
    spamFilter: true,
    linkFilter: true,
    capsFilter: false,
    wordBlacklist: ["spam", "scam", "discord.gg"],
    maxMentions: 5,
    maxEmojis: 10,
  },
  welcome: {
    enabled: true,
    channel: "#welcome",
    message: "Welcome to the server, {user}! 🎉 Please read the rules in #rules.",
    dmOnJoin: false,
  },
  leave: {
    enabled: true,
    channel: "#logs",
    message: "{user} has left the server. 👋",
  },
  leveling: {
    enabled: true,
    xpPerMessage: 15,
    xpCooldown: 60,
    levelUpChannel: "#general",
    roleRewards: [
      { level: 5, role: "Active Member" },
      { level: 10, role: "Regular" },
      { level: 25, role: "Veteran" },
      { level: 50, role: "Legend" },
    ],
  },
};
