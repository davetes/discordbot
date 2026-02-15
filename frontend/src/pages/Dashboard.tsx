import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Server, Users, Terminal, Headphones, Plus, Shield, UserPlus, Music, AlertTriangle, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const iconMap: Record<string, any> = { Server, Users, Terminal, Headphones };
const activityIconMap: Record<string, any> = { Plus, Terminal, Shield, UserPlus, Music, AlertTriangle };

const Dashboard = () => {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  const statsCards = data?.statsCards ?? [];
  const serverGrowth = data?.serverGrowth ?? [];
  const commandUsage = data?.commandUsage ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const botName = data?.botInfo?.name ?? "Discord Bot";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of {botName} performance</p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-discord-green/30 text-discord-green">
          <span className="w-2 h-2 rounded-full bg-discord-green animate-pulse" />
          Online • {data?.botInfo?.uptime ?? "0d 0h 0m"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = iconMap[stat.icon];
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-discord-green flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Server Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={serverGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 6% 25%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(228 6% 18%)", border: "1px solid hsl(228 6% 25%)", borderRadius: 8, color: "hsl(210 17% 90%)" }} />
                <Area type="monotone" dataKey="servers" stroke="hsl(235 86% 65%)" fill="hsl(235 86% 65% / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Commands This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={commandUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 6% 25%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(228 6% 18%)", border: "1px solid hsl(228 6% 25%)", borderRadius: 8, color: "hsl(210 17% 90%)" }} />
                <Bar dataKey="commands" fill="hsl(235 86% 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const Icon = activityIconMap[item.icon];
              return (
                <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: item.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
