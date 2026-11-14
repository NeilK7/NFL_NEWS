"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Smartphone, 
  Sliders, 
  Radio, 
  Database, 
  Sparkles,
  Shield
} from "lucide-react";
import { NFLTeam } from "@/types";
import AllTeamsDropdown from "@/components/AllTeamsDropdown";

interface NavbarProps {
  currentTab: "war-room" | "ai-news" | "scoreboard";
  onTabChange: (tab: "war-room" | "ai-news" | "scoreboard") => void;
  selectedTeam: NFLTeam;
  favoriteTeams: NFLTeam[];
  onSelectTeam: (team: NFLTeam) => void;
  onToggleFavoriteTeam?: (team: NFLTeam) => void;
  onOpenTeamStats: (team: NFLTeam) => void;
  onOpenTeamNews: (team: NFLTeam) => void;
  onOpenPreferences: () => void;
  onOpenAppleModal: () => void;
  isSupabaseSynced: boolean;
}

export default function Navbar({
  currentTab,
  onTabChange,
  selectedTeam,
  favoriteTeams,
  onSelectTeam,
  onToggleFavoriteTeam,
  onOpenTeamStats,
  onOpenTeamNews,
  onOpenPreferences,
  onOpenAppleModal,
  isSupabaseSynced,
}: NavbarProps) {
  const [tickerItems, setTickerItems] = useState<{ tag: string; text: string }[]>([
    { tag: "LIVE WIRE", text: "Syncing live NFL scores & breaking news from Yahoo Sports and NFL.com..." },
  ]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/scoreboard", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tickerItems) && data.tickerItems.length > 0) {
            setTickerItems(data.tickerItems);
          }
        }
      } catch {
        // keep current ticker items
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#090b10]/90 backdrop-blur-xl">
      {/* Real-time Apex Live Wire Ticker */}
      <div className="bg-[#0f1422] border-b border-amber-500/20 px-4 py-1.5 overflow-hidden text-xs flex items-center">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex-shrink-0 mr-3">
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span>LIVE NFL WIRE</span>
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap flex items-center gap-8 text-gray-300">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2">
              <span className="text-[10px] font-semibold text-amber-300 bg-gray-800 px-1.5 py-0.2 rounded">
                {item.tag}
              </span>
              <span>{item.text}</span>
              <span className="text-gray-600">•</span>
            </div>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0 pl-3 border-l border-gray-800 text-[11px] text-gray-400">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>{isSupabaseSynced ? "Vault Synced" : "Local Vault"}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/40">
              <Trophy className="w-5 h-5 text-black stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  GRIDIRON
                </span>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight gold-gradient-text">
                  APEX
                </span>
                <span className="hidden sm:inline-block text-[9px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  LIVE AI
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block -mt-1 font-medium tracking-wide">
                Yahoo Sports & NFL.com Live AI Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-900/60 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => onTabChange("war-room")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === "war-room"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/10"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Team War Room</span>
            </button>

            <button
              onClick={() => onTabChange("ai-news")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === "ai-news"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/10"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Intelligence</span>
            </button>

            <button
              onClick={() => onTabChange("scoreboard")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentTab === "scoreboard"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/10"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Scores & Standings</span>
            </button>
          </nav>

          {/* Right Actions: Team Quick-Selector & Apple Modal Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* All 32 NFL Teams Dropdown (News & Stats) */}
            <AllTeamsDropdown
              selectedTeam={selectedTeam}
              favoriteTeams={favoriteTeams}
              onSelectTeam={onSelectTeam}
              onToggleFavoriteTeam={onToggleFavoriteTeam}
              onOpenTeamStats={onOpenTeamStats}
              onOpenTeamNews={onOpenTeamNews}
            />

            {/* Apple Ecosystem Download Link */}
            <button
              onClick={onOpenAppleModal}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/40 rounded-xl text-xs font-semibold text-amber-300 transition-all hover:scale-[1.02] shadow-sm"
              title="Download App for iPhone, iPad, and Mac"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Apple App</span>
              <span className="sm:hidden">App</span>
            </button>

            {/* Customize / War Room Settings */}
            <button
              onClick={onOpenPreferences}
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white transition-all"
              title="Customize Teams and Star Players"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-gray-800/80">
          <button
            onClick={() => onTabChange("war-room")}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              currentTab === "war-room"
                ? "bg-amber-500 text-black font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>War Room</span>
          </button>
          <button
            onClick={() => onTabChange("ai-news")}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              currentTab === "ai-news"
                ? "bg-amber-500 text-black font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI News</span>
          </button>
          <button
            onClick={() => onTabChange("scoreboard")}
            className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-medium ${
              currentTab === "scoreboard"
                ? "bg-amber-500 text-black font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Scores</span>
          </button>
        </div>
      </div>
    </header>
  );
}
