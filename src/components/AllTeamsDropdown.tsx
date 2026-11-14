"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Search, 
  ChevronDown, 
  BarChart2, 
  Newspaper, 
  Star, 
  Shield, 
  Sparkles,
  X
} from "lucide-react";
import { NFLTeam } from "@/types";
import { NFL_TEAMS } from "@/lib/nfl-teams";

interface AllTeamsDropdownProps {
  selectedTeam: NFLTeam;
  favoriteTeams?: NFLTeam[];
  onSelectTeam: (team: NFLTeam) => void;
  onOpenTeamStats: (team: NFLTeam) => void;
  onOpenTeamNews: (team: NFLTeam) => void;
}

export default function AllTeamsDropdown({
  selectedTeam,
  favoriteTeams = [],
  onSelectTeam,
  onOpenTeamStats,
  onOpenTeamNews,
}: AllTeamsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "AFC" | "NFC" | "FAVS">("ALL");
  const [liveRecords, setLiveRecords] = useState<
    Record<string, { wins: number; losses: number; ties: number }>
  >({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch live W-L records from official standings endpoint
  useEffect(() => {
    let mounted = true;
    fetch("/api/scoreboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.teamRecords) {
          setLiveRecords(data.teamRecords);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const getTeamRecord = (team: NFLTeam) =>
    liveRecords[team.id.toLowerCase()] ||
    liveRecords[team.abbreviation.toLowerCase()] ||
    team.record;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered teams list
  const filteredTeams = NFL_TEAMS.filter((team) => {
    const matchesSearch =
      !searchQuery.trim() ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${team.city} ${team.name}`.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === "AFC") {
      matchesTab = team.conference === "AFC";
    } else if (activeTab === "NFC") {
      matchesTab = team.conference === "NFC";
    } else if (activeTab === "FAVS") {
      matchesTab = favoriteTeams.some((f) => f.id === team.id);
    }

    return matchesSearch && matchesTab;
  });

  // Sort so Denver Broncos is highlighted at the top, then alphabetically
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (a.id === "den") return -1;
    if (b.id === "den") return 1;
    return a.city.localeCompare(b.city);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1.5 px-3 bg-[#0d121c]/90 hover:bg-[#141b29] border border-amber-500/40 hover:border-amber-400 rounded-xl transition-all shadow-md text-xs font-semibold text-gray-100 group"
        title="Select any of the 32 NFL Teams to view News and Stats"
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
        <div className="flex items-center gap-1.5 text-left">
          <span className="font-extrabold text-white group-hover:text-amber-300 transition-colors">
            {selectedTeam.city} {selectedTeam.name}
          </span>
          <span className="hidden xl:inline text-[10px] text-gray-400 font-mono">
            ({getTeamRecord(selectedTeam).wins}-{getTeamRecord(selectedTeam).losses})
          </span>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden md:inline">
          32 Teams
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-96 bg-[#0c101a] border border-amber-500/30 rounded-2xl shadow-2xl z-50 p-3 space-y-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white uppercase tracking-wider">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>All 32 NFL Franchises</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams (e.g. Broncos, KC, Bills)..."
                autoFocus
                className="w-full bg-gray-900/90 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-1 p-1 bg-gray-900/70 rounded-xl border border-gray-800 text-[11px] font-bold">
              {(
                [
                  { id: "ALL", label: "All 32" },
                  { id: "AFC", label: "AFC" },
                  { id: "NFC", label: "NFC" },
                  { id: "FAVS", label: `Favs (${favoriteTeams.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    activeTab === tab.id
                      ? "bg-amber-500 text-black shadow-sm font-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Denver Broncos Priority Banner */}
          {activeTab === "ALL" && !searchQuery && (
            <div className="p-2 rounded-xl bg-gradient-to-r from-orange-600/20 via-amber-600/10 to-blue-900/20 border border-orange-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 relative">
                  <Image
                    src="https://a.espncdn.com/i/teamlogos/nfl/500/den.png"
                    alt="Denver Broncos"
                    fill
                    className="object-contain"
                    sizes="20px"
                  />
                </div>
                <div className="text-[11px] font-extrabold text-orange-300">
                  Denver Broncos <span className="text-[9px] text-gray-400 font-normal">• Mile High Command</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const broncos = NFL_TEAMS.find((t) => t.id === "den")!;
                    onOpenTeamStats(broncos);
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1"
                >
                  <BarChart2 className="w-2.5 h-2.5" /> Stats
                </button>
                <button
                  onClick={() => {
                    const broncos = NFL_TEAMS.find((t) => t.id === "den")!;
                    onOpenTeamNews(broncos);
                    setIsOpen(false);
                  }}
                  className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-[10px] font-bold text-blue-300 flex items-center gap-1"
                >
                  <Newspaper className="w-2.5 h-2.5" /> News
                </button>
              </div>
            </div>
          )}

          {/* Team List */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-1 divide-y divide-gray-800/40">
            {sortedTeams.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No teams found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              sortedTeams.map((team) => {
                const isSelected = selectedTeam.id === team.id;
                const isFav = favoriteTeams.some((f) => f.id === team.id);

                return (
                  <div
                    key={team.id}
                    className={`pt-1 first:pt-0 group flex items-center justify-between p-2 rounded-xl transition-all ${
                      isSelected
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                        : "hover:bg-gray-800/80 text-gray-300"
                    }`}
                  >
                    {/* Team Info / Opens Stats & News + Selects War Room */}
                    <button
                      onClick={() => {
                        onSelectTeam(team);
                        onOpenTeamStats(team);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-6 h-6 relative flex-shrink-0">
                        <Image
                          src={team.logoUrl}
                          alt={team.name}
                          fill
                          className="object-contain"
                          sizes="24px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-extrabold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                            {team.city} {team.name}
                          </span>
                          {team.id === "den" && (
                            <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1 rounded font-bold border border-orange-500/30">
                              DEN
                            </span>
                          )}
                          {isFav && (
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {team.conference} {team.division} • {getTeamRecord(team).wins}-{getTeamRecord(team).losses}
                        </div>
                      </div>
                    </button>

                    {/* Dedicated Direct News & Stats Actions */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTeam(team);
                          onOpenTeamStats(team);
                          setIsOpen(false);
                        }}
                        className="p-1.5 px-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-amber-400 hover:bg-amber-500/10 text-gray-300 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                        title={`View stats for ${team.name}`}
                      >
                        <BarChart2 className="w-3 h-3 text-amber-400" />
                        <span>Stats</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTeam(team);
                          onOpenTeamNews(team);
                          setIsOpen(false);
                        }}
                        className="p-1.5 px-2 rounded-lg bg-gray-900 border border-gray-700 hover:border-blue-400 hover:bg-blue-500/10 text-gray-300 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                        title={`View breaking news for ${team.name}`}
                      >
                        <Newspaper className="w-3 h-3 text-blue-400" />
                        <span>News</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer */}
          <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-400" /> Real-time ESPN & Yahoo Stats
            </span>
            <span className="text-[10px] text-gray-500">32 NFL Teams Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
