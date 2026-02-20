import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, Ban, UserMinus, VolumeX, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  online: "bg-discord-green",
  idle: "bg-discord-yellow",
  dnd: "bg-discord-red",
  offline: "bg-muted-foreground",
};

const Members = () => {
  const [search, setSearch] = useState("");
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: api.members });
  const [actionDialog, setActionDialog] = useState<{ member: (typeof members)[number]; action: string } | null>(null);
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);

  const actionMutation = useMutation({
    mutationFn: ({ memberId, action }: { memberId: number; action: string }) =>
      api.memberAction(memberId, {
        action: action.toLowerCase(),
        reason: reason.trim() || undefined,
        durationMinutes: action.toLowerCase() === "mute" ? durationMinutes : undefined,
        guildId: actionDialog?.member.guild_id,
      }),
    onSuccess: () => {
      toast({ title: "Action executed", description: "Member action completed" });
      setActionDialog(null);
      setReason("");
    },
    onError: () => toast({ title: "Action failed", description: "Could not perform member action" }),
  });

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = () => {
    if (actionDialog) {
      actionMutation.mutate({ memberId: actionDialog.member.id, action: actionDialog.action });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Member Management</h1>
        <p className="text-muted-foreground text-sm">Manage users across all servers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border" />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{member.avatar}</span>
                      <div>
                        <span className="font-medium text-foreground">{member.name}</span>
                        <span className="text-muted-foreground text-xs">{member.tag}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "Admin" ? "default" : member.role === "Moderator" ? "outline" : "secondary"} className="text-xs">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusColors[member.status]}`} />
                      <span className="text-xs text-muted-foreground capitalize">{member.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{member.joined}</TableCell>
                  <TableCell>
                    {member.warnings > 0 ? (
                      <Badge variant="destructive" className="text-xs">{member.warnings}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {[
                        { action: "Warn", icon: AlertTriangle, variant: "ghost" as const },
                        { action: "Mute", icon: VolumeX, variant: "ghost" as const },
                        { action: "Kick", icon: UserMinus, variant: "ghost" as const },
                        { action: "Ban", icon: Ban, variant: "ghost" as const },
                      ].map(({ action, icon: Icon, variant }) => (
                        <Button key={action} variant={variant} size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setActionDialog({ member, action })}>
                          <Icon className="w-3.5 h-3.5" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirm {actionDialog?.action}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog?.action.toLowerCase()} <strong>{actionDialog?.member.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="bg-secondary border-border" />
            </div>
            {actionDialog?.action === "Mute" && (
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value || 0))}
                  className="bg-secondary border-border"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleAction}>{actionDialog?.action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
