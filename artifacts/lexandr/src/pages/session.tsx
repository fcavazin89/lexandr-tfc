import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, FileText, Database, Activity, RefreshCw, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getGetResearchSessionQueryOptions,
  getListResearchSessionsQueryOptions,
  useGenerateResearchReport,
  getListResearchReportsQueryOptions,
} from "@workspace/api-client-react";

interface Message {
  id: number | string;
  role: string;
  content: string;
}

export default function Session() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const sessionId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    ...getGetResearchSessionQueryOptions(sessionId),
    enabled: !!sessionId,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateReport = useGenerateResearchReport();

  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages as Message[]);
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput("");

    const userId = Date.now();
    setMessages((prev) => [...prev, { role: "user", content: userMsg, id: userId }]);
    setIsStreaming(true);

    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId }]);

    setStreamError(null);

    try {
      const response = await fetch("/api/research/sessions/" + sessionId + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(part.slice(6));
            if (data.done) break;
            if (data.content) {
              assistantContent += data.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: assistantContent } : msg
                )
              );
            }
          } catch {
            /* ignore parse errors on individual SSE chunks */
          }
        }
      }

      await queryClient.invalidateQueries({
        queryKey: getGetResearchSessionQueryOptions(sessionId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: getListResearchSessionsQueryOptions().queryKey,
      });
    } catch (err) {
      console.error("Streaming error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStreamError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleGenerateReport = () => {
    generateReport.mutate(
      { id: sessionId },
      {
        onSuccess: (report) => {
          queryClient.invalidateQueries({ queryKey: getListResearchReportsQueryOptions().queryKey });
          setLocation(`/reports/${report.id}`);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setLocation("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-sm text-xs font-mono">
              SESSION #{sessionId}
            </span>
            <span className="text-muted-foreground text-sm font-mono flex items-center gap-1">
              <Activity className="w-3 h-3" /> ACTIVE
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-1">
            {session?.topic ?? "Research Session"}
          </h1>
          {session?.domain && (
            <span className="text-xs font-mono text-muted-foreground">{session.domain}</span>
          )}
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generateReport.isPending || messages.length === 0}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-sm text-sm font-mono hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateReport.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {generateReport.isPending ? "GENERATING..." : "GENERATE REPORT"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Protocol Ready. Awaiting Input.</p>
            {session?.description && (
              <p className="text-xs text-muted-foreground mt-3 max-w-md text-center">{session.description}</p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-12"
                  : "bg-card border border-border mr-12"
              } p-4 rounded-sm`}
            >
              <div className="text-xs font-mono mb-2 opacity-70 uppercase">
                {msg.role === "user" ? "USER_INPUT" : "LEXANDR_OUTPUT"}
              </div>
              <div
                className={`prose ${
                  msg.role === "user" ? "prose-invert" : "dark:prose-invert"
                } max-w-none prose-sm font-sans`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content || (isStreaming && i === messages.length - 1 ? "▊" : "")}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-card border border-border mr-12 p-4 rounded-sm flex items-center gap-3 text-primary font-mono text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              PROCESSING_DATA...
            </div>
          </div>
        )}

        {streamError && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 border border-destructive/40 mr-12 p-4 rounded-sm font-mono text-sm text-destructive">
              <p className="font-bold mb-1">TRANSMISSION_ERROR</p>
              <p className="opacity-80 text-xs">{streamError}</p>
              <button
                onClick={() => setStreamError(null)}
                className="mt-2 text-xs underline opacity-60 hover:opacity-100"
              >
                dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 border-t border-border mt-auto">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Enter research query or hypothesis..."
            className="w-full bg-background border border-border rounded-sm pl-4 pr-14 py-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono resize-none min-h-[80px]"
            disabled={isStreaming}
            rows={3}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute bottom-4 right-4 bg-primary text-primary-foreground p-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2 font-mono">
          LEXANDR — Autonomous Research Intelligence · Verify all outputs independently
        </p>
      </div>
    </div>
  );
}
