import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { StarRating } from "./StarRating";
import { ProGateCard } from "./ProGateCard";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ContentDetailModal({ contentId, onClose }) {
  const { currentUser } = useAuth();
  const role = currentUser?.user?.role;

  const [content, setContent] = useState(null);
  const [rating, setRating] = useState({ avg_rating: null, own_rating: null });
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        communityService.getContent(contentId),
        communityService.getContentRating(contentId),
      ]);
      setContent(cRes.data);
      setRating(rRes.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRate = async (stars) => {
    setRatingLoading(true);
    try {
      await communityService.rateContent(contentId, { stars });
      await load();
    } catch {/* */} finally {
      setRatingLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await communityService.publishContent(contentId);
      await load();
    } catch {/* */} finally {
      setPublishing(false);
    }
  };

  const isYouTube = (url) => url && (url.includes("youtube.com") || url.includes("youtu.be"));
  const youtubeEmbed = (url) => {
    const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background mx-4 max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4 z-10">
          <h3 className="text-base font-semibold text-foreground pr-4 line-clamp-1">
            {content?.title ?? "Loading…"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {content?.video_url && isYouTube(content.video_url) && (
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                <iframe
                  src={youtubeEmbed(content.video_url)}
                  title="Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            )}

            {content?.pro_gate ? (
              <>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.body}</p>
                <ProGateCard />
              </>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content?.body}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Community rating</p>
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(rating.avg_rating ?? 0)} readOnly />
                  <span className="text-xs text-muted-foreground">
                    {rating.avg_rating != null ? rating.avg_rating.toFixed(1) : "—"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Your rating</p>
                <StarRating
                  value={rating.own_rating ?? 0}
                  onChange={!ratingLoading ? handleRate : undefined}
                />
              </div>
            </div>

            {/* Publish button (admin/trainer only) */}
            {(role === "admin" || role === "trainer") && content && !content.published && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
