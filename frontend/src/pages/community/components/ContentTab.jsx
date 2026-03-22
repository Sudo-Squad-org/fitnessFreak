import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { ContentCard } from "./content/ContentCard";
import { ContentDetailModal } from "./content/ContentDetailModal";
import { CreateContentForm } from "./content/CreateContentForm";
import { useAuth } from "@/hooks/useAuth";
import { CONTENT_TYPES, COMMUNITY_GOALS, FITNESS_LEVELS } from "@/constants";
import { Plus, Loader2 } from "lucide-react";

export function ContentTab() {
  const { currentUser } = useAuth();
  const role = currentUser?.user?.role;
  const canCreate = role === "admin" || role === "trainer";

  const [filters, setFilters] = useState({ type: "", goal_type: "", fitness_level: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (filters.type)          params.type          = filters.type;
      if (filters.goal_type)     params.goal_type     = filters.goal_type;
      if (filters.fitness_level) params.fitness_level = filters.fitness_level;
      const res = await communityService.listContent(params);
      setItems(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: f[k] === v ? "" : v }));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter("type", t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                  filters.type === t
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FITNESS_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setFilter("fitness_level", l)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                  filters.fitness_level === l
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">No content found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ContentCard key={item.id} content={item} onOpen={() => setSelected(item)} />
          ))}
        </div>
      )}

      {selected && (
        <ContentDetailModal
          contentId={selected.id}
          onClose={() => { setSelected(null); load(); }}
        />
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 mx-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-foreground mb-4">Create Content</h3>
            <CreateContentForm
              onCreated={() => { setShowCreate(false); load(); }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
