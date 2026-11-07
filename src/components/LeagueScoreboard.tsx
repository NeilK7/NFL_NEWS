"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Tv, 
  Radio,
  RefreshCw
} from "lucide-react";
import { NFL_TEAMS } from "@/lib/nfl-teams";

export default function LeagueScoreboard() {
  const [activeSubTab, setActiveSubTab] = useState<"scores" | "standings">("scores");
  const [activeConference, setActiveConference] = useState<"AFC" | "NFC">("AFC");
  const [games, setGames] = useState<any[]>([]);
  const [teamRecords, setTeamRecords] = useState<Record<string, { wins: number; losses: number; ties: number }>>({});
  const [weekLabel, setWeekLabel] = useState<string>("Official Live NFL Slate");
  const [updatedAt, setUpdatedAt] = useState<string>("Syncing...");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchScoreboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/scoreboard", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games)) setGames(data.games);
        if (data.teamRecords) setTeamRecords(data.teamRecords);
        if (data.weekLabel) setWeekLabel(data.weekLabel);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      }
    } catch (err) {
      console.warn("Scoreboard fetch failed:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoreboard(false);
    const interval = setInterval(() => {
      fetchScoreboard(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScoreboard]);

  const divisions = ["East", "North", "South", "West"] as const;

  const getDivisionTeams = (conf: "AFC" | "NFC", div: string) => {
    return NFL_TEAMS.filter((t) => t.conference === conf && t.division === div)
      .map((t) => ({
        ...t,
        record: teamRecords[t.id.toLowerCase()] || teamRecords[t.abbreviation.toLowerCase()] || t.record,
      }))
      .sort((a, b) => b.record.wins - a.record.wins);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Subtab navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NFL Live League Command Hub
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchScoreboard(false)}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500 text-xs text-gray-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Updated {updatedAt}</span>
          </button>

          <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveSubTab("scores")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "scores"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Live Scores
            </button>
            <button
              onClick={() => setActiveSubTab("standings")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "standings"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Standings
            </button>
          </div>
        </div>
      </div>

      {/* 1. LIVE SCORES */}
      {activeSubTab === "scores" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" /> {weekLabel}
            </span>
            <span>Auto-Syncing Live NFL Feed Every 30s</span>
          </div>

          {loading && games.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-gray-900/50 border border-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="glass-panel rounded-2xl p-4 border border-gray-800 hover:border-gray-700 transition-all space-y-3 relative overflow-hidden"
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-800/80">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">
                      {game.broadcastType}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                      <Tv className="w-3 h-3 text-amber-400" />
                      <span>{game.network}</span>
                    </div>
                  </div>

                  {/* Score lines */}
                  <div className="space-y-2 py-1">
                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 relative flex-shrink-0">
                          <Image
                            src={game.awayTeam.logoUrl}
                            alt={game.awayTeam.name}
                            fill
                            className="object-contain"
                            sizes="24px"
                          />
                        </div>
                        <span className="font-extrabold text-sm text-white">
                          {game.awayTeam.name}
                        </span>
                        {game.awayTeam.record && (
                          <span className="text-[10px] text-gray-500">
                            ({game.awayTeam.record})
                          </span>
                        )}
                        {game.possession === game.awayTeam.id && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <span className="font-mono font-black text-base text-white">
                        {game.awayScore}
                      </span>
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 relative flex-shrink-0">
                          <Image
                            src={game.homeTeam.logoUrl}
                            alt={game.homeTeam.name}
                            fill
                            className="object-contain"
                            sizes="24px"
                          />
                        </div>
                        <span className="font-extrabold text-sm text-white">
                          {game.homeTeam.name}
                        </span>
                        {game.homeTeam.record && (
                          <span className="text-[10px] text-gray-500">
                            ({game.homeTeam.record})
                          </span>
                        )}
                        {game.possession === game.homeTeam.id && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </div>
                      <span className="font-mono font-black text-base text-white">
                        {game.homeScore}
                      </span>
                    </div>
                  </div>

                  {/* Game status footer */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        game.isLive ? "text-red-400 font-bold flex items-center gap-1" : "text-amber-300"
                      }`}
                    >
                      {game.isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                      {game.status}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono truncate max-w-[140px]">
                      {game.downDistance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. NFL STANDINGS */}
      {activeSubTab === "standings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveConference("AFC")}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeConference === "AFC"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                AFC Standings
              </button>
              <button
                onClick={() => setActiveConference("NFC")}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeConference === "NFC"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                NFC Standings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {divisions.map((div) => {
              const teams = getDivisionTeams(activeConference, div);
              return (
                <div
                  key={div}
                  className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <h3 className="font-extrabold text-sm text-white">
                      {activeConference} {div}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400 uppercase">
                      <span>W</span>
                      <span>L</span>
                      <span>PCT</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {teams.map((t, idx) => {
                      const total = t.record.wins + t.record.losses;
                      const pct = total > 0 ? (t.record.wins / total).toFixed(3) : ".000";
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-gray-900/50 border border-gray-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-gray-500 w-3">{idx + 1}</span>
                            <div className="w-5 h-5 relative flex-shrink-0">
                              <Image
                                src={t.logoUrl}
                                alt={t.name}
                                fill
                                className="object-contain"
                                sizes="20px"
                              />
                            </div>
                            <span className="font-bold text-white">{t.city} {t.name}</span>
                          </div>

                          <div className="flex items-center gap-4 font-mono font-bold text-gray-300">
                            <span className="text-white">{t.record.wins}</span>
                            <span className="text-gray-400">{t.record.losses}</span>
                            <span className="text-amber-400">{pct}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
