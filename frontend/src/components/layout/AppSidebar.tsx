"use client";

import {
  LayoutDashboard, Server, Users, Terminal, BarChart3, Settings, ScrollText, Bot, MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Servers", url: "/servers", icon: Server },
  { title: "Members", url: "/members", icon: Users },
  { title: "Commands", url: "/commands", icon: Terminal },
  { title: "Chat AI", url: "/chat", icon: MessageSquare },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logs", url: "/logs", icon: ScrollText },
];

export function AppSidebar() {
  const { data: botInfo } = useQuery({ queryKey: ["bot-info"], queryFn: api.botInfo });

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-lg">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{botInfo?.name ?? "Discord Bot"}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-discord-green" />
              <span className="text-xs text-muted-foreground">{botInfo?.status ?? "Offline"}</span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      activeClassName="bg-primary/15 text-primary font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">v{botInfo?.version ?? "1.0.0"} • Uptime: {botInfo?.uptime ?? "0d 0h 0m"}</p>
      </SidebarFooter>
    </Sidebar>
  );
}
