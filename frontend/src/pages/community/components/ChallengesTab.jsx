import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { ChallengeCard } from "./challenges/ChallengeCard";
import { ChallengeDetailModal } from "./challenges/ChallengeDetailModal";
import { CreateChallengeForm } from "./challenges/CreateChallengeForm";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Loader2 } from "lucide-react";

export function ChallengesTab() {
  const { currentUser } = useAuth();
  const role = currentUser?.user?.role;
  const canCreate = role === "admin" || role === "trainer";

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await communityService.listChallenges({ limit: 20 });
      setChallenges(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Active Challenges</h2>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : challenges.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">No challenges yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {challenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onOpen={() => setSelected(c)} onRefresh={load} />
          ))}
        </div>
      )}

      {selected && (
        <ChallengeDetailModal
          challengeId={selected.id}
          onClose={() => { setSelected(null); load(); }}
        />
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 mx-4">
            <h3 className="text-base font-semibold text-foreground mb-4">Create Challenge</h3>
            <CreateChallengeForm
              onCreated={() => { setShowCreate(false); load(); }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
