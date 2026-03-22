import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { CommentsPanel } from "./CommentsPanel";
import { MessageCircle, Trash2 } from "lucide-react";

const MILESTONE_EMOJI = {
  workout_completed: "💪",
  goal_reached:      "🎯",
  streak_7days:      "🔥",
  streak_30days:     "🔥🔥",
  weight_milestone:  "⚖️",
  custom:            "⭐",
};

export function FeedPostCard({ post, onRefresh }) {
  const [reacted, setReacted] = useState(post.my_reaction);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggle = async () => {
    try {
      await communityService.toggleReaction(post.id);
      setReacted((r) => !r);
    } catch {/* */}
  };

  const deletePost = async () => {
    setDeleting(true);
    try {
      await communityService.deletePost(post.id);
      onRefresh();
    } catch {/* */} finally {
      setDeleting(false);
    }
  };

  const timeAgo = (dt) => {
    const diff = Date.now() - new Date(dt);
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">
            {MILESTONE_EMOJI[post.milestone_type] ?? "⭐"}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{post.alias}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {post.milestone_type.replace(/_/g, " ")}
              {post.goal_type && ` · ${post.goal_type.replace("_", " ")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          {post.is_mine && (
            <button
              onClick={deletePost}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {post.message && (
        <p className="mt-3 text-sm text-muted-foreground">{post.message}</p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            reacted ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-base">{reacted ? "💪" : "🤜"}</span>
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comment_count > 0 && post.comment_count}
          <span>{showComments ? "Hide" : "Comments"}</span>
        </button>
      </div>

      {showComments && <CommentsPanel postId={post.id} />}
    </div>
  );
}
