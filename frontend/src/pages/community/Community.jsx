import React, { useState } from "react";
import { Users, Trophy, Rss, BookOpen } from "lucide-react";
import { BuddyTab } from "./components/BuddyTab";
import { ChallengesTab } from "./components/ChallengesTab";
import { FeedTab } from "./components/FeedTab";
import { ContentTab } from "./components/ContentTab";

const TABS = [
  { id: "buddy",      label: "Buddy",      icon: Users    },
  { id: "challenges", label: "Challenges", icon: Trophy   },
  { id: "feed",       label: "Feed",       icon: Rss      },
  { id: "content",    label: "Content",    icon: BookOpen },
];

export default function Community() {
  const [activeTab, setActiveTab] = useState("buddy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Community</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Privacy-first community — no public profiles, no follower counts, all opt-in.
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-8 inline-flex w-full rounded-xl bg-muted p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "buddy"      && <BuddyTab />}
      {activeTab === "challenges" && <ChallengesTab />}
      {activeTab === "feed"       && <FeedTab />}
      {activeTab === "content"    && <ContentTab />}
    </div>
  );
}
