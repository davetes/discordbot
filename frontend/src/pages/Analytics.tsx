import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const timeRanges = ["7d", "30d", "90d"];

const Analytics = () => {
  const [range, setRange] = useState("7d");
  const { data: analyticsData } = useQuery({ queryKey: ["analytics", range], queryFn: () => api.analytics(range) });
  const commandBreakdown = analyticsData?.commandBreakdown ?? [];
  const peakHours = analyticsData?.peakHours ?? [];
  const topServers = analyticsData?.topServers ?? [];
  const topUsers = analyticsData?.topUsers ?? [];
  const topServerMax = Math.max(...topServers.map((s) => s.commands), 1);
  const topUserMax = Math.max(...topUsers.map((u) => u.commands), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Detailed usage statistics and insights</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {timeRanges.map((r) => (
            <Button key={r} variant={range === r ? "default" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Command Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={commandBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {commandBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(228 6% 18%)", border: "1px solid hsl(228 6% 25%)", borderRadius: 8, color: "hsl(210 17% 90%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-4 flex flex-wrap gap-3">
            {commandBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground">{item.name}: {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Activity Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 6% 25%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215 10% 55%)" }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(228 6% 18%)", border: "1px solid hsl(228 6% 25%)", borderRadius: 8, color: "hsl(210 17% 90%)" }} />
                <Area type="monotone" dataKey="users" stroke="hsl(280 60% 55%)" fill="hsl(280 60% 55% / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServers.map((server, i) => (
                <div key={server.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{server.name}</span>
                      <span className="text-xs text-muted-foreground">{server.commands.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(server.commands / topServerMax) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.map((user, i) => (
                <div key={user.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.commands.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-discord-green rounded-full" style={{ width: `${(user.commands / topUserMax) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
