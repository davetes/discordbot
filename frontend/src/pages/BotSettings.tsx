import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const BotSettings = () => {
  const { data: botSettings } = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const defaultSettings = useMemo(
    () => ({
      general: { name: "Discord Bot", status: "Online", activityType: "watching", avatarUrl: "" },
      automod: { spamFilter: true, linkFilter: true, capsFilter: false, wordBlacklist: [], maxMentions: 5, maxEmojis: 10 },
      welcome: { enabled: false, channel: "#welcome", message: "Welcome to the server, {user}!", dmOnJoin: false },
      leave: { enabled: false, channel: "#logs", message: "{user} has left the server." },
      leveling: { enabled: false, xpPerMessage: 15, xpCooldown: 60, levelUpChannel: "#general", roleRewards: [] },
    }),
    []
  );

  const settings = botSettings ?? defaultSettings;
  const [blacklist, setBlacklist] = useState(settings.automod.wordBlacklist);
  const [newWord, setNewWord] = useState("");

  useEffect(() => {
    setBlacklist(settings.automod.wordBlacklist);
  }, [settings.automod.wordBlacklist]);

  const addWord = () => {
    if (newWord.trim() && !blacklist.includes(newWord.trim())) {
      setBlacklist([...blacklist, newWord.trim()]);
      setNewWord("");
    }
  };

  const save = () => toast({ title: "Settings saved", description: "Bot configuration updated successfully" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bot Settings</h1>
        <p className="text-muted-foreground text-sm">Configure bot behavior and features</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-secondary">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="automod">Auto-Mod</TabsTrigger>
          <TabsTrigger value="welcome">Welcome/Leave</TabsTrigger>
          <TabsTrigger value="leveling">Leveling</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">General Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bot Name</Label>
                  <Input defaultValue={settings.general.name} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Select defaultValue={settings.general.activityType}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="playing">Playing</SelectItem>
                      <SelectItem value="watching">Watching</SelectItem>
                      <SelectItem value="listening">Listening to</SelectItem>
                      <SelectItem value="competing">Competing in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status Message</Label>
                <Input defaultValue={settings.general.status} className="bg-secondary border-border" />
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automod" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Auto-Moderation Rules</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Spam Filter", key: "spamFilter", default: settings.automod.spamFilter },
                { label: "Link Filter", key: "linkFilter", default: settings.automod.linkFilter },
                { label: "Caps Lock Filter", key: "capsFilter", default: settings.automod.capsFilter },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <Label>{item.label}</Label>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Mentions per Message</Label>
                  <Input type="number" defaultValue={settings.automod.maxMentions} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Max Emojis per Message</Label>
                  <Input type="number" defaultValue={settings.automod.maxEmojis} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Word Blacklist</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {blacklist.map((w) => (
                    <Badge key={w} variant="secondary" className="gap-1">
                      {w}
                      <button onClick={() => setBlacklist(blacklist.filter((x) => x !== w))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Add word..." className="bg-secondary border-border" onKeyDown={(e) => e.key === "Enter" && addWord()} />
                  <Button variant="secondary" onClick={addWord}>Add</Button>
                </div>
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Welcome Message</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch defaultChecked={settings.welcome.enabled} />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Input defaultValue={settings.welcome.channel} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea defaultValue={settings.welcome.message} className="bg-secondary border-border" />
                <p className="text-xs text-muted-foreground">Use {"{user}"} for username, {"{server}"} for server name</p>
              </div>
              <div className="flex items-center justify-between">
                <Label>DM on Join</Label>
                <Switch defaultChecked={settings.welcome.dmOnJoin} />
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Leave Message</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch defaultChecked={settings.leave.enabled} />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Input defaultValue={settings.leave.channel} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea defaultValue={settings.leave.message} className="bg-secondary border-border" />
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leveling" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm">Leveling System</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Leveling</Label>
                <Switch defaultChecked={settings.leveling.enabled} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP per Message</Label>
                  <Input type="number" defaultValue={settings.leveling.xpPerMessage} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>XP Cooldown (seconds)</Label>
                  <Input type="number" defaultValue={settings.leveling.xpCooldown} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Level Up Announcement Channel</Label>
                <Input defaultValue={settings.leveling.levelUpChannel} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Role Rewards</Label>
                <div className="space-y-2">
                  {settings.leveling.roleRewards.map((reward) => (
                    <div key={reward.level} className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
                      <Badge variant="outline" className="text-xs">Lv.{reward.level}</Badge>
                      <span className="text-sm text-foreground">{reward.role}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BotSettings;
