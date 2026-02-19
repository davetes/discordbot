import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const categories = ["all", "moderation", "music", "fun", "utility"];

const categoryColors: Record<string, string> = {
  moderation: "bg-discord-red/15 text-discord-red",
  music: "bg-primary/15 text-primary",
  fun: "bg-discord-green/15 text-discord-green",
  utility: "bg-discord-yellow/15 text-discord-yellow",
};

const Commands = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { data: commands = [] } = useQuery({ queryKey: ["commands"], queryFn: api.commands });
  const [cmdStates, setCmdStates] = useState<Record<string, boolean>>({});
  const [commandName, setCommandName] = useState("");
  const [commandResponse, setCommandResponse] = useState("");
  const [commandPermission, setCommandPermission] = useState("everyone");
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => api.updateCommandEnabled(name, enabled),
    onError: (_error, variables) => {
      setCmdStates((prev) => ({ ...prev, [variables.name]: !variables.enabled }));
      toast({ title: "Update failed", description: "Could not update command status" });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.createCommand({ name: commandName.trim(), response: commandResponse.trim(), permission: commandPermission }),
    onSuccess: () => {
      toast({ title: "Command created", description: "Custom command saved" });
      setCommandName("");
      setCommandResponse("");
      setCommandPermission("everyone");
      queryClient.invalidateQueries({ queryKey: ["commands"] });
    },
    onError: () => toast({ title: "Create failed", description: "Could not create command" }),
  });

  useEffect(() => {
    if (commands.length) {
      setCmdStates(Object.fromEntries(commands.map((c) => [c.name, c.enabled])));
    }
  }, [commands]);

  const filtered = activeTab === "all" ? commands : commands.filter((c) => c.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Management</h1>
          <p className="text-muted-foreground text-sm">Manage and configure bot commands</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Custom Command</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Custom Command</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Command Name</Label>
                <Input value={commandName} onChange={(e) => setCommandName(e.target.value)} placeholder="e.g. hello" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Response</Label>
                <Textarea value={commandResponse} onChange={(e) => setCommandResponse(e.target.value)} placeholder="What should the bot respond with?" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Required Permission</Label>
                <Select value={commandPermission} onValueChange={setCommandPermission}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select permission" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!commandName.trim() || !commandResponse.trim()) {
                    toast({ title: "Missing fields", description: "Name and response are required" });
                    return;
                  }
                  createMutation.mutate();
                }}
              >
                Create Command
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize text-sm">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Command</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Cooldown</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cmd) => (
                <TableRow key={cmd.name} className="border-border">
                  <TableCell className="font-mono text-primary text-sm">!{cmd.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-xs capitalize ${categoryColors[cmd.category]}`}>{cmd.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cmd.description}</TableCell>
                  <TableCell className="text-foreground text-sm">{cmd.usage.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cmd.cooldown}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={cmdStates[cmd.name]}
                      onCheckedChange={(v) => {
                        setCmdStates((p) => ({ ...p, [cmd.name]: v }));
                        toggleMutation.mutate({ name: cmd.name, enabled: v });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Commands;
