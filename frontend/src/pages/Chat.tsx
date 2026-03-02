"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Sparkles, User, Settings, MessageSquare, Send, Lightbulb } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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

type ChatMessage = { id: string; role: "user" | "assistant"; content: string; timestamp?: string };

const Chat = () => {
  const { data: fetchedIntents } = useQuery({ queryKey: ["ai-intents"], queryFn: api.aiIntents });
  const [intents, setIntents] = useState(defaultIntents);
  const [selectedIntent, setSelectedIntent] = useState(defaultIntents[0].id);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    { id: "seed-1", role: "assistant", content: "Hi! I'm your AI assistant. I can help draft responses and manage auto-replies for your Discord bot. Ask me anything!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetchedIntents && fetchedIntents.length) {
      setIntents(fetchedIntents);
      setSelectedIntent((prev) => fetchedIntents.find((i) => i.id === prev)?.id ?? fetchedIntents[0].id);
    }
  }, [fetchedIntents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

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
      { 
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, 
        role, 
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: () => api.saveAiIntents({ intents }),
    onSuccess: () => toast({ title: "Responses saved", description: "Auto-replies updated successfully" }),
    onError: () => toast({ title: "Save failed", description: "Could not save responses" }),
  });

  const generateMutation = useMutation({
    mutationFn: (prompt: string) => api.generateAiResponse({ prompt, intentId: selectedIntent }),
    onSuccess: (data) => addMessage("assistant", data.response),
    onError: () => addMessage("assistant", "Sorry, I couldn't generate a response right now. Please try again."),
  });

  const handleSend = () => {
    if (!message.trim()) return;
    const prompt = message.trim();
    setMessage("");
    addMessage("user", prompt);
    generateMutation.mutate(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chat AI</h1>
            <p className="text-muted-foreground text-sm">Create and manage AI-powered responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            AI Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] h-[calc(100vh-220px)]">
        {/* Chat Area */}
        <Card className="flex flex-col bg-card border-border overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Conversation
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setHistory([{ id: "seed-1", role: "assistant", content: "Chat cleared. Start a new conversation!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])} className="text-xs text-muted-foreground">
                Clear Chat
              </Button>
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {history.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex items-start gap-3 ${entry.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.role === "assistant" 
                      ? "bg-primary/10" 
                      : "bg-muted"
                  }`}>
                    {entry.role === "assistant" ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`max-w-[75%] ${entry.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        entry.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {entry.content}
                    </div>
                    {entry.timestamp && (
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {entry.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {generateMutation.isPending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-muted/20">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-background border-border"
                />
                <Button 
                  onClick={handleSend} 
                  size="icon"
                  disabled={!message.trim() || generateMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Quick prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((prompt) => (
                    <Button 
                      key={prompt} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setMessage(prompt)}
                      className="text-xs h-6 px-2"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Settings Panel */}
        <Card className="bg-card border-border overflow-y-auto">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Response Settings
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            {/* Intent List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto-Replies</h3>
              <div className="space-y-2">
                {intents.map((intent) => (
                  <div 
                    key={intent.id} 
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedIntent === intent.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedIntent(intent.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{intent.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {intent.response.slice(0, 40)}...
                      </p>
                    </div>
                    <Switch 
                      checked={intent.enabled} 
                      onCheckedChange={(value) => handleToggle(intent.id, value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Intent Editor */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit Response</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Intent</label>
                <Select value={selectedIntent} onValueChange={setSelectedIntent}>
                  <SelectTrigger className="bg-background border-border">
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
                  rows={5}
                  placeholder="Enter the response template..."
                  className="bg-background border-border resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Use {"{user}"} to mention the user, {"{server}"} for server name
                </p>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Sparkles className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{intents.filter(i => i.enabled).length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{history.filter(h => h.role === "user").length}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
