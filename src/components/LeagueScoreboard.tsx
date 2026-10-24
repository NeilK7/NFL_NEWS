"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Trophy, 
  Tv, 
  ChevronRight, 
  Flame, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  Clock,
  Radio
} from "lucide-react";
import { NFL_TEAMS } from "@/lib/nfl-teams";

export default function LeagueScoreboard() {
  const [activeSubTab, setActiveSubTab] = useState<"scores" | "standings" | "leaders">("scores");
  const [activeConference, setActiveConference] = useState<"AFC" | "NFC">("AFC");

  // Realistic sample scoreboard games for current slate
  const liveGames = [
    {
      id: "g1",
      homeTeam: NFL_TEAMS.find((t) => t.id === "sf")!,
      awayTeam: NFL_TEAMS.find((t) => t.id === "kc")!,
      homeScore: 24,
      awayScore: 27,
      status: "4th Quarter • 1:12",
      isLive: true,
      possession: "kc",
      downDistance: "2nd & 4 at SF 34",
      network: "FOX",
      broadcastType: "America's Game of the Week",
    },
    {
      id: "g2",
      homeTeam: NFL_TEAMS.find((t) => t.id === "bal")!,
      awayTeam: NFL_TEAMS.find((t) => t.id === "cin")!,
      homeScore: 35,
      awayScore: 34,
      status: "Final",
      isLive: false,
      possession: null,
      downDistance: "Final",
      network: "PRIME",
      broadcastType: "Thursday Night Football",
    },
    {
      id: "g3",
      homeTeam: NFL_TEAMS.find((t) => t.id === "det")!,
      awayTeam: NFL_TEAMS.find((t) => t.id === "gb")!,
      homeScore: 31,
      awayScore: 28,
      status: "Final",
      isLive: false,
      possession: null,
      downDistance: "Final",
      network: "CBS",
      broadcastType: "NFL on CBS",
    },
    {
      id: "g4",
      homeTeam: NFL_TEAMS.find((t) => t.id === "buf")!,
      awayTeam: NFL_TEAMS.find((t) => t.id === "mia")!,
      homeScore: 30,
      awayScore: 27,
      status: "Final",
      isLive: false,
      possession: null,
      downDistance: "Final",
      network: "CBS",
      broadcastType: "AFC East Rivalry",
    },
    {
      id: "g5",
      homeTeam: NFL_TEAMS.find((t) => t.id === "dal")!,
      awayTeam: NFL_TEAMS.find((t) => t.id === "phi")!,
      homeScore: 17,
      awayScore: 24,
      status: "Sun 8:20 PM ET",
      isLive: false,
      possession: null,
      downDistance: "Upcoming Kickoff",
      network: "NBC",
      broadcastType: "Sunday Night Football",
    },
  ];

  // Grouped standings
  const divisions = ["East", "North", "South", "West"] as const;

  const getDivisionTeams = (conf: "AFC" | "NFC", div: string) => {
    return NFL_TEAMS.filter((t) => t.conference === conf && t.division === div).sort(
      (a, b) => b.record.wins - a.record.wins
    );
  };

  // League leaders
  const statLeaders = [
    {
      category: "Passing Yards",
      leader: "Lamar Jackson",
      team: "BAL",
      stat: "2,876 YDS",
      secondary: "24 TD • 2 INT",
    },
    {
      category: "Rushing Yards",
      leader: "Derrick Henry",
      team: "BAL",
      stat: "1,120 YDS",
      secondary: "12 TD • 6.1 YPC",
    },
    {
      category: "Receiving Yards",
      leader: "Justin Jefferson",
      team: "MIN",
      stat: "912 YDS",
      secondary: "65 REC • 6 TD",
    },
    {
      category: "Sacks Leader",
      leader: "T.J. Watt",
      team: "PIT",
      stat: "11.5 SACKS",
      secondary: "4 FF • 1 INT",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Subtab navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NFL League Command Hub
          </h2>
        </div>

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
          <button
            onClick={() => setActiveSubTab("leaders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "leaders"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Leaders
          </button>
        </div>
      </div>

      {/* 1. LIVE SCORES */}
      {activeSubTab === "scores" && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Live League Slate
            </span>
            <span>Week 10 Official In-Progress Scores</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveGames.map((game) => (
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
                      game.isLive ? "text-red-400 font-bold flex items-center gap-1" : "text-gray-400"
                    }`}
                  >
                    {game.isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {game.status}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {game.downDistance}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
                      const pct = (t.record.wins / (t.record.wins + t.record.losses)).toFixed(3);
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
                            <span className="font-bold text-white">{t.name}</span>
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

      {/* 3. STAT LEADERS */}
      {activeSubTab === "leaders" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statLeaders.map((lead, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-3"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {lead.category}
              </div>
              <div>
                <div className="text-lg font-black text-white">{lead.leader}</div>
                <div className="text-xs text-gray-400 font-medium">{lead.team}</div>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <div className="text-xl font-black text-amber-300 font-mono">
                  {lead.stat}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{lead.secondary}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
