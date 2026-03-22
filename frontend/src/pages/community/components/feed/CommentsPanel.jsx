import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { Send, Trash2, Loader2 } from "lucide-react";

export function CommentsPanel({ postId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await communityService.getComments(postId);
      setComments(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await communityService.addComment(postId, { text: text.trim() });
      setText("");
      await load();
    } catch {/* */} finally {
      setSending(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      await communityService.deleteComment(id);
      await load();
    } catch {/* */}
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2 text-xs">
          <span className="font-medium text-foreground shrink-0">{c.alias}</span>
          <span className="text-muted-foreground flex-1">{c.text}</span>
          {c.is_mine && (
            <button
              onClick={() => deleteComment(c.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      <form onSubmit={submit} className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
