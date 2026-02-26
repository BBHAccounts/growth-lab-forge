import { useState, useRef, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function renderMarkdown(text: string) {
  // Split into lines, then process inline markdown
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) elements.push(<br key={`br-${lineIdx}`} />);

    // Process inline: bold (**text**), italic (*text*), bullet points
    const isBullet = /^\s*[\*\-]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[\*\-]\s+/, "") : line;

    // Split by **bold** and *italic* patterns
    const parts = cleanLine.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const inlineElements = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return <em key={partIdx}>{part.slice(1, -1)}</em>;
      }
      return <span key={partIdx}>{part}</span>;
    });

    if (isBullet) {
      elements.push(
        <span key={`line-${lineIdx}`} className="flex gap-1.5 items-start">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{inlineElements}</span>
        </span>
      );
    } else {
      elements.push(<span key={`line-${lineIdx}`}>{inlineElements}</span>);
    }
  });

  return elements;
}

interface FieldAssistantProps {
  modelId: string;
  stepTitle: string;
  stepInstruction: string;
  fieldLabel: string;
  currentValue: unknown;
  allProgress: Record<string, unknown>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function FieldAssistant({
  modelId,
  stepTitle,
  stepInstruction,
  fieldLabel,
  currentValue,
  allProgress,
}: FieldAssistantProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/model-assistant`;

  const streamResponse = async (chatMessages: Message[]) => {
    setLoading(true);
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          modelId,
          fieldLabel,
          stepTitle,
          stepInstruction,
          currentValue: typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue || ""),
          allProgress,
          messages: chatMessages,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429 || resp.status === 402) {
          toast({ title: "AI Assistant", description: err.error, variant: "destructive" });
        } else {
          toast({ title: "AI Assistant Error", description: err.error || "Something went wrong", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
              // Auto-scroll
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("FieldAssistant stream error:", e);
      toast({ title: "Connection error", description: "Could not reach the AI assistant", variant: "destructive" });
    }

    setLoading(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !initialLoaded) {
      setInitialLoaded(true);
      // Auto-fetch initial hint
      streamResponse([]);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    streamResponse(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-primary"
          title="Get AI coaching hint"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-3 border-b">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Coach
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hints &amp; examples — won't write your answer
          </p>
        </div>

        <div ref={scrollRef} className="max-h-64 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user"
                  ? "bg-muted rounded-lg px-3 py-2"
                  : "text-foreground leading-relaxed"
              }`}
            >
              {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
            </div>
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        <div className="p-2 border-t flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up…"
            className="h-8 text-sm"
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
