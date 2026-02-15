"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Sparkles, User, Wand2 } from "lucide-react";

const defaultIntents = [
  { id: "welcome", label: "Welcome Message", enabled: true, response: "Welcome to the server! Let me know if you need help." },
  { id: "rules", label: "Rules Inquiry", enabled: true, response: "Please read #rules. Be respectful and have fun!" },
  { id: "support", label: "Support Request", enabled: false, response: "Thanks for reaching out. A moderator will be with you shortly." },
  { id: "commands", label: "Command Help", enabled: true, response: "Try !help to see available commands." },
];

const samplePrompts = [
  "How do I set up moderation?",
  "Where can I find server rules?",
  "Can you list music commands?",
  "What does the bot do?",
];

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

const Chat = () => {
  const [intents, setIntents] = useState(defaultIntents);
  const [selectedIntent, setSelectedIntent] = useState(defaultIntents[0].id);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    { id: "seed-1", role: "assistant", content: "Hi! I can help draft responses and manage auto-replies." },
  ]);

  const activeIntent = useMemo(
    () => intents.find((intent) => intent.id === selectedIntent) ?? intents[0],
    [intents, selectedIntent],
  );

  const handleToggle = (id: string, enabled: boolean) => {
    setIntents((prev) => prev.map((intent) => (intent.id === id ? { ...intent, enabled } : intent)));
  };

  const handleResponseChange = (value: string) => {
    setIntents((prev) => prev.map((intent) => (intent.id === selectedIntent ? { ...intent, response: value } : intent)));
  };

  const addMessage = (role: ChatMessage["role"], content: string) => {
    setHistory((prev) => [
      ...prev,
      { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content },
    ]);
  };

  const generateResponse = (prompt: string) => {
    const canned = activeIntent?.response || "Thanks for your message! We'll get back to you soon.";
    return `${canned} (Suggested for: ${prompt})`;
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const prompt = message.trim();
    setMessage("");
    addMessage("user", prompt);
    addMessage("assistant", generateResponse(prompt));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat AI Responses</h1>
          <p className="text-muted-foreground text-sm">Manage auto-replies and draft AI responses for your bot.</p>
        </div>
        <Badge variant="outline" className="gap-2 border-primary/30 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI Response Manager
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Live Response Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-72 rounded-md border border-border bg-secondary/30 p-4">
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className={`flex items-start gap-3 ${entry.role === "user" ? "justify-end" : ""}`}>
                    {entry.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                        entry.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                      }`}
                    >
                      {entry.content}
                    </div>
                    {entry.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask the AI to draft a reply..."
                className="bg-secondary border-border"
              />
              <Button onClick={handleSend} className="gap-2">
                <Wand2 className="h-4 w-4" />
                Generate
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => setMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auto-Reply Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {intents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{intent.label}</p>
                    <p className="text-xs text-muted-foreground">AI can suggest or auto-send this response.</p>
                  </div>
                  <Switch checked={intent.enabled} onCheckedChange={(value) => handleToggle(intent.id, value)} />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Selected Intent</label>
              <Select value={selectedIntent} onValueChange={setSelectedIntent}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose an intent" />
                </SelectTrigger>
                <SelectContent>
                  {intents.map((intent) => (
                    <SelectItem key={intent.id} value={intent.id}>{intent.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Response Template</label>
              <Textarea
                value={activeIntent?.response ?? ""}
                onChange={(event) => handleResponseChange(event.target.value)}
                rows={6}
                className="bg-secondary border-border"
              />
            </div>

            <Button className="w-full">Save Responses</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
