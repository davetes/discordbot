import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Settings, Users, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const Servers = () => {
  const [search, setSearch] = useState("");
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: api.servers });
  const [selectedServer, setSelectedServer] = useState<(typeof servers)[number] | null>(null);
  const [draft, setDraft] = useState({ prefix: "!", language: "english", modules: [] as string[] });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedServer) {
      setDraft({
        prefix: selectedServer.prefix,
        language: selectedServer.language.toLowerCase(),
        modules: selectedServer.modules,
      });
    }
  }, [selectedServer]);

  const saveMutation = useMutation({
    mutationFn: () => api.saveServerSettings(selectedServer!.id, draft),
    onSuccess: () => {
      toast({ title: "Server updated", description: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
    onError: () => toast({ title: "Save failed", description: "Could not save server settings" }),
  });

  const filtered = servers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Server Management</h1>
        <p className="text-muted-foreground text-sm">Manage all servers the bot is connected to</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search servers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((server) => (
          <Card key={server.id} className="bg-card border-border hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{server.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{server.name}</h3>
                    <Badge variant={server.status === "active" ? "default" : "secondary"} className="text-xs mt-0.5">
                      {server.status}
                    </Badge>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedServer(server)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">{server.icon}</span> {server.name} Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Prefix</Label>
                        <Input
                          value={draft.prefix}
                          onChange={(e) => setDraft((prev) => ({ ...prev, prefix: e.target.value }))}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={draft.language} onValueChange={(value) => setDraft((prev) => ({ ...prev, language: value }))}>
                          <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="japanese">Japanese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Modules</Label>
                        <div className="space-y-2">
                          {["moderation", "music", "fun", "utility"].map((mod) => (
                            <div key={mod} className="flex items-center justify-between">
                              <span className="text-sm capitalize text-foreground">{mod}</span>
                              <Switch
                                checked={draft.modules.includes(mod)}
                                onCheckedChange={(value) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    modules: value
                                      ? [...prev.modules, mod]
                                      : prev.modules.filter((item) => item !== mod),
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (!selectedServer) return;
                          saveMutation.mutate();
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{server.members.toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {server.joined}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {server.modules.map((mod) => (
                  <Badge key={mod} variant="secondary" className="text-xs capitalize">{mod}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Servers;
