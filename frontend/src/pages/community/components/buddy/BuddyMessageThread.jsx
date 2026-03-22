import React, { useState, useEffect, useRef } from "react";
import { communityService } from "@/services/communityService";
import { useInterval } from "@/hooks/useInterval";
import { Send, MessageSquare } from "lucide-react";

export function BuddyMessageThread({ pair }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const res = await communityService.getMessages({ limit: 50 });
      setMessages(res.data);
    } catch {/* */}
  };

  useEffect(() => { load(); }, []);

  // Poll every 30s
  useInterval(load, 30000);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await communityService.sendMessage({ content: text.trim() });
      setText("");
      await load();
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Messages</span>
        <span className="ml-auto text-xs text-muted-foreground">{pair.partner_alias}</span>
      </div>

      <div className="flex flex-col gap-2 p-4 max-h-72 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say hi!</p>
        )}
        {messages.map((m, idx) => {
          const isLast = idx === messages.length - 1;
          return (
            <div key={m.id} className={`flex flex-col ${m.is_mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.is_mine
                    ? "bg-foreground text-background rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
              {m.is_mine && isLast && m.read && (
                <span className="text-[10px] text-muted-foreground mt-0.5 mr-0.5">Seen</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="flex items-center justify-center h-9 w-9 rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
