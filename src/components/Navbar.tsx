"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Smartphone, 
  Sliders, 
  ChevronDown, 
  Radio, 
  Database, 
  Sparkles,
  Shield
} from "lucide-react";
import { NFLTeam } from "@/types";

interface NavbarProps {
  currentTab: "war-room" | "ai-news" | "scoreboard";
  onTabChange: (tab: "war-room" | "ai-news" | "scoreboard") => void;
  selectedTeam: NFLTeam;
  favoriteTeams: NFLTeam[];
  onSelectTeam: (team: NFLTeam) => void;
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
  onOpenPreferences,
  onOpenAppleModal,
  isSupabaseSynced,
}: NavbarProps) {
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  const tickerItems = [
    { tag: "LIVE WIRE", text: "Chiefs @ 49ers Super Bowl LVIII Rematch Sunday 4:25 PM ET" },
    { tag: "YAHOO SPORTS", text: "AI Digest: Christian McCaffrey ramp-up timeline confirmed by medical staff" },
    { tag: "ESPN BREAKING", text: "Lamar Jackson posts 4th career game with 4+ Pass TD and 100+ Rush Yds" },
    { tag: "INJURY REPORT", text: "Apex AI scanner updated 32 injury designations across AFC & NFC" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#090b10]/90 backdrop-blur-xl">
      {/* Real-time Apex Live Wire Ticker */}
      <div className="bg-[#0f1422] border-b border-amber-500/20 px-4 py-1.5 overflow-hidden text-xs flex items-center">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex-shrink-0 mr-3">
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span>APEX WIRE</span>
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap flex items-center gap-8 text-gray-300">
          {tickerItems.map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-800 px-1.5 py-0.2 rounded">
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
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block -mt-1 font-medium tracking-wide">
                Elite NFL War Room & AI Intelligence
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
            {/* Team Selector Dropdown */}
            {favoriteTeams.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 bg-gray-900/90 border border-gray-700/80 rounded-xl hover:border-amber-500/50 transition-all text-xs font-medium text-gray-200"
                >
                  <div className="w-5 h-5 relative flex-shrink-0">
                    <Image
                      src={selectedTeam.logoUrl}
                      alt={selectedTeam.name}
                      fill
                      className="object-contain"
                      sizes="20px"
                    />
                  </div>
                  <span className="hidden sm:inline font-semibold text-white">
                    {selectedTeam.abbreviation}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {teamDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-[#121722] border border-gray-800 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in duration-100"
                    onMouseLeave={() => setTeamDropdownOpen(false)}
                  >
                    <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
                      My Favorites ({favoriteTeams.length})
                    </div>
                    {favoriteTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => {
                          onSelectTeam(team);
                          setTeamDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                          selectedTeam.id === team.id
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        <div className="w-5 h-5 relative flex-shrink-0">
                          <Image
                            src={team.logoUrl}
                            alt={team.name}
                            fill
                            className="object-contain"
                            sizes="20px"
                          />
                        </div>
                        <span className="flex-1 truncate">{team.name}</span>
                        {selectedTeam.id === team.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                      </button>
                    ))}
                    <div className="pt-1 border-t border-gray-800">
                      <button
                        onClick={() => {
                          setTeamDropdownOpen(false);
                          onOpenPreferences();
                        }}
                        className="w-full text-center py-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        + Manage Teams & Players
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Apple Ecosystem Download Link (User requirement) */}
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
