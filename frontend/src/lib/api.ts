export type BotInfo = {
  name: string;
  avatar: string;
  status: string;
  uptime: string;
  version: string;
};

export type DashboardCard = {
  label: string;
  value: string;
  change: string;
  icon: string;
};

export type ServerGrowthPoint = { month: string; servers: number };
export type CommandUsagePoint = { day: string; commands: number };
export type ActivityItem = { id: number; type: string; message: string; time: string; icon: string };

export type DashboardResponse = {
  botInfo: BotInfo;
  statsCards: DashboardCard[];
  serverGrowth: ServerGrowthPoint[];
  commandUsage: CommandUsagePoint[];
  recentActivity: ActivityItem[];
};

export type ServerItem = {
  id: number;
  name: string;
  members: number;
  joined: string;
  prefix: string;
  language: string;
  modules: string[];
  icon: string;
  status: string;
};

export type MemberItem = {
  id: number;
  name: string;
  tag: string;
  avatar: string;
  role: string;
  joined: string;
  warnings: number;
  status: string;
};

export type CommandItem = {
  name: string;
  category: string;
  description: string;
  usage: number;
  enabled: boolean;
  cooldown: string;
};

export type AnalyticsData = {
  commandBreakdown: { name: string; value: number; fill: string }[];
  peakHours: { hour: string; users: number }[];
  topServers: { name: string; commands: number }[];
  topUsers: { name: string; commands: number }[];
};

export type LogItem = {
  id: number;
  timestamp: string;
  server: string;
  user: string;
  action: string;
  details: string;
  level: string;
};

export type BotSettings = {
  general: { name: string; status: string; activityType: string; avatarUrl: string };
  automod: { spamFilter: boolean; linkFilter: boolean; capsFilter: boolean; wordBlacklist: string[]; maxMentions: number; maxEmojis: number };
  welcome: { enabled: boolean; channel: string; message: string; dmOnJoin: boolean };
  leave: { enabled: boolean; channel: string; message: string };
  leveling: { enabled: boolean; xpPerMessage: number; xpCooldown: number; levelUpChannel: string; roleRewards: { level: number; role: string }[] };
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  botInfo: () => apiGet<BotInfo>("/bot/info"),
  dashboard: () => apiGet<DashboardResponse>("/dashboard"),
  servers: () => apiGet<ServerItem[]>("/servers"),
  members: () => apiGet<MemberItem[]>("/members"),
  commands: () => apiGet<CommandItem[]>("/commands"),
  analytics: (range: string) => apiGet<AnalyticsData>(`/analytics?range=${range}`),
  logs: () => apiGet<LogItem[]>("/logs"),
  settings: () => apiGet<BotSettings>("/settings"),
};
