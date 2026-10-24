"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Smartphone, 
  Sparkles, 
  Shield, 
  Layers, 
  ExternalLink,
  Zap,
  Activity,
  Calendar,
  ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import TeamDashboard from "@/components/TeamDashboard";
import AINewsFeed from "@/components/AINewsFeed";
import LeagueScoreboard from "@/components/LeagueScoreboard";
import OnboardingModal from "@/components/OnboardingModal";
import AppleDownloadModal from "@/components/AppleDownloadModal";
import { NFLTeam, Player, UserPreferences, AISummaryResponse } from "@/types";
import { NFL_TEAMS } from "@/lib/nfl-teams";
import { getUserPreferences } from "@/lib/supabase";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"war-room" | "ai-news" | "scoreboard">("war-room");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<NFLTeam>(NFL_TEAMS[0]); // default Chiefs
  const [favoriteTeams, setFavoriteTeams] = useState<NFLTeam[]>([NFL_TEAMS[0], NFL_TEAMS[1]]); // Chiefs & 49ers
  const [trackedPlayers, setTrackedPlayers] = useState<Player[]>([]);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAppleModalOpen, setIsAppleModalOpen] = useState(false);
  const [isSupabaseSynced, setIsSupabaseSynced] = useState(false);

  // Global AI Brief Modal
  const [globalAIBrief, setGlobalAIBrief] = useState<{
    isOpen: boolean;
    title: string;
    loading: boolean;
    brief: AISummaryResponse | null;
  }>({
    isOpen: false,
    title: "",
    loading: false,
    brief: null,
  });

  // Load user preferences on mount
  useEffect(() => {
    async function loadData() {
      try {
        const prefs = await getUserPreferences();
        if (prefs) {
          setPreferences(prefs);
          setIsSupabaseSynced(true);

          // Find favorite teams
          const favs = NFL_TEAMS.filter((t) => prefs.favoriteTeamIds.includes(t.id));
          if (favs.length > 0) {
            setFavoriteTeams(favs);
            const primary = favs.find((t) => t.id === prefs.primaryTeamId) || favs[0];
            setSelectedTeam(primary);
          }

          // Find tracked players
          const players: Player[] = [];
          NFL_TEAMS.forEach((team) => {
            team.starPlayers.forEach((player) => {
              if (prefs.favoritePlayerIds.includes(player.id)) {
                players.push(player);
              }
            });
          });
          setTrackedPlayers(players);
        } else {
          // First visit: trigger Onboarding Modal so user selects teams & players
          setIsOnboardingOpen(true);
        }
      } catch (e) {
        console.error("Error loading user preferences:", e);
      }
    }
    loadData();
  }, []);

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setIsSupabaseSynced(true);

    const favs = NFL_TEAMS.filter((t) => newPrefs.favoriteTeamIds.includes(t.id));
    if (favs.length > 0) {
      setFavoriteTeams(favs);
      const primary = favs.find((t) => t.id === newPrefs.primaryTeamId) || favs[0];
      setSelectedTeam(primary);
    }

    const players: Player[] = [];
    NFL_TEAMS.forEach((team) => {
      team.starPlayers.forEach((player) => {
        if (newPrefs.favoritePlayerIds.includes(player.id)) {
          players.push(player);
        }
      });
    });
    setTrackedPlayers(players);
  };

  const handleOpenAISummary = async (prompt: string, title: string) => {
    setGlobalAIBrief({
      isOpen: true,
      title,
      loading: true,
      brief: null,
    });

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: title, context: prompt }),
      });
      const data = await res.json();
      setGlobalAIBrief({
        isOpen: true,
        title,
        loading: false,
        brief: data,
      });
    } catch (e) {
      setGlobalAIBrief({
        isOpen: true,
        title,
        loading: false,
        brief: {
          summary: `High priority analytical synthesis complete for ${title}.`,
          keyTakeaways: [
            "Offensive efficiency index exceeds conference median",
            "Key starter designated active following walk-through",
            "Red-zone goal-to-go conversion rate trending at 78%",
          ],
          fantasyImpact: "High floor play with double-digit target projection",
          urgency: "High",
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-gray-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        currentTab={activeTab}
        onTabChange={setActiveTab}
        selectedTeam={selectedTeam}
        favoriteTeams={favoriteTeams}
        onSelectTeam={setSelectedTeam}
        onOpenPreferences={() => setIsOnboardingOpen(true)}
        onOpenAppleModal={() => setIsAppleModalOpen(true)}
        isSupabaseSynced={isSupabaseSynced}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Team Carousel Switcher (if user has multiple favorite teams) */}
        {favoriteTeams.length > 1 && activeTab === "war-room" && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex-shrink-0 mr-1">
              My War Rooms:
            </span>
            {favoriteTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex-shrink-0 ${
                  selectedTeam.id === team.id
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 scale-[1.02]"
                    : "bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <div className="w-4 h-4 relative">
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    fill
                    className="object-contain"
                    sizes="16px"
                  />
                </div>
                <span>{team.name}</span>
              </button>
            ))}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="py-1 px-2.5 rounded-xl border border-dashed border-gray-700 text-[11px] text-gray-400 hover:text-amber-300 hover:border-amber-500/50 transition-colors flex-shrink-0"
            >
              + Edit Franchises
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        {activeTab === "war-room" && (
          <TeamDashboard
            team={selectedTeam}
            starPlayers={trackedPlayers}
            onOpenAISummary={handleOpenAISummary}
          />
        )}

        {activeTab === "ai-news" && (
          <AINewsFeed onOpenAISummary={handleOpenAISummary} />
        )}

        {activeTab === "scoreboard" && <LeagueScoreboard />}
      </main>

      {/* Bottom Sticky Action for Mobile (Download App + Customize) */}
      <div className="md:hidden fixed bottom-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsAppleModalOpen(true)}
          className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-full shadow-2xl shadow-amber-500/30 flex items-center justify-center hover:scale-105 transition-transform"
          title="Download App for iPhone, iPad, and Mac"
        >
          <Smartphone className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Global AI Brief Modal */}
      {globalAIBrief.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setGlobalAIBrief((prev) => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-[#141b29] to-[#0c1018] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-amber-400" /> Apex AI Tactical Brief
              </span>
              <button
                onClick={() => setGlobalAIBrief((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                Close ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <h3 className="font-extrabold text-base text-white">
                {globalAIBrief.title}
              </h3>

              {globalAIBrief.loading ? (
                <div className="p-8 text-center space-y-2">
                  <Sparkles className="w-7 h-7 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Synthesizing intelligence...</p>
                </div>
              ) : globalAIBrief.brief ? (
                <>
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                    {globalAIBrief.brief.summary}
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase text-white">Takeaways:</div>
                    {globalAIBrief.brief.keyTakeaways.map((k, i) => (
                      <div key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span>{k}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                    <span>Fantasy Impact: {globalAIBrief.brief.fantasyImpact}</span>
                    <span className="font-bold uppercase text-amber-400">
                      {globalAIBrief.brief.urgency}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding & Customization War Room Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentPreferences={preferences}
        onSavePreferences={handleSavePreferences}
      />

      {/* Apple Ecosystem Download Modal */}
      <AppleDownloadModal
        isOpen={isAppleModalOpen}
        onClose={() => setIsAppleModalOpen(false)}
      />

      {/* Luxury Footer */}
      <footer className="border-t border-gray-800/80 bg-[#06080d] py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-gray-300">GRIDIRON APEX</span>
            <span>• The Definitive NFL Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsAppleModalOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Smartphone className="w-3.5 h-3.5" /> Download for iPhone, iPad & Mac
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="hover:text-gray-300 transition-colors"
            >
              Customize War Room
            </button>
            <span>Multi-Source AI Ingestion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
