"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Tv, 
  Activity, 
  Play, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  Flame,
  Award,
  Video,
  X
} from "lucide-react";
import { NFLTeam, GameSchedule, Injury, SeasonHighlight, Player } from "@/types";

interface TeamDashboardProps {
  team: NFLTeam;
  starPlayers: Player[];
  onOpenAISummary: (prompt: string, title: string) => void;
}

export default function TeamDashboard({
  team,
  starPlayers,
  onOpenAISummary,
}: TeamDashboardProps) {
  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 3, hours: 14, minutes: 22, seconds: 45 });

  const [activeHighlight, setActiveHighlight] = useState<SeasonHighlight | null>(null);

  // Active Countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const nextGame = team.nextGame;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Franchise Hero Banner */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-gray-800 shadow-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor}26 0%, #0d121c 65%, #090b10 100%)`,
        }}
      >
        <div className="absolute -top-16 -right-16 w-80 h-80 opacity-15 pointer-events-none">
          <Image
            src={team.logoUrl}
            alt={team.name}
            fill
            className="object-contain"
            sizes="320px"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-3 flex items-center justify-center shadow-2xl border border-white/10"
              style={{ backgroundColor: `${team.primaryColor}33` }}
            >
              <div className="w-full h-full relative">
                <Image
                  src={team.logoUrl}
                  alt={team.name}
                  fill
                  className="object-contain drop-shadow-lg"
                  sizes="96px"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-900/80 text-amber-400 border border-amber-500/30">
                  {team.conference} {team.division}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {team.record.wins}-{team.record.losses}
                  {team.record.ties ? `-${team.record.ties}` : ""}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {team.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{team.stadium} • {team.city}</span>
              </p>
            </div>
          </div>

          {/* Quick AI Scout Action */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                onOpenAISummary(
                  `Generate an executive scouting report for the ${team.name} ahead of their matchup with ${nextGame.opponent}. Cover offensive schematics, key player health, and statistical edge.`,
                  `${team.name} Apex AI Scout Brief`
                )
              }
              className="py-2.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              AI Game Plan Brief
            </button>
          </div>
        </div>
      </div>

      {/* 2. Next Game Countdown Card & Matchup Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Game Showcase */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Next Matchup: Week {nextGame.week || 7}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>{nextGame.broadcastNetwork || nextGame.network}</span>
            </div>
          </div>

          {/* Matchup Duel */}
          <div className="py-6 flex items-center justify-around">
            {/* Team Primary */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto">
                <Image
                  src={team.logoUrl}
                  alt={team.name}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </div>
              <div className="font-extrabold text-sm sm:text-base text-white">
                {team.abbreviation}
              </div>
              <div className="text-xs text-gray-400">
                {team.record.wins}-{team.record.losses}
              </div>
            </div>

            {/* VS Emblem & Spread */}
            <div className="text-center px-4">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                {nextGame.isHome ? "VS" : "@"}
              </span>
              <div className="text-xs font-bold text-gray-300 mt-2">
                {nextGame.spread}
              </div>
              <div className="text-[11px] text-gray-500">
                {nextGame.date} • {nextGame.time}
              </div>
            </div>

            {/* Opponent */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto">
                <Image
                  src={nextGame.opponentLogo}
                  alt={nextGame.opponent}
                  fill
                  className="object-contain"
                  sizes="80px"
                />
              </div>
              <div className="font-extrabold text-sm sm:text-base text-white">
                {nextGame.opponent}
              </div>
              <div className="text-xs text-gray-400">
                {nextGame.isHome ? "Away Rival" : "Host Stadium"}
              </div>
            </div>
          </div>

          {/* Matchup Venue */}
          <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              {nextGame.venue || nextGame.stadium}
            </span>
            <span className="text-amber-400 font-medium">National Broadcast</span>
          </div>
        </div>

        {/* Kickoff Countdown Clock */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col justify-between text-center relative overflow-hidden">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Kickoff Countdown
            </div>
            <p className="text-xs text-gray-400">Time remaining until opening drive</p>
          </div>

          {/* Countdown Blocks */}
          <div className="grid grid-cols-4 gap-2 my-4">
            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Days</div>
            </div>
            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Hours</div>
            </div>
            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Mins</div>
            </div>
            <div className="p-3 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[9px] uppercase font-bold text-gray-400 mt-1">Secs</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
            AI Spread Predictor: {nextGame.spread} • Win Probability: 64.2%
          </div>
        </div>
      </div>

      {/* 3. Schedule Wire & Injury Wire Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Season Schedule */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">
                2024–2025 Schedule & Slate
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              18 Weeks Regular Season
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {team.schedule.map((game, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-gray-700 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-gray-400 w-12">
                    WK {game.week}
                  </span>
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image
                      src={game.opponentLogo}
                      alt={game.opponent}
                      fill
                      className="object-contain"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span className="text-gray-400 font-normal">
                        {game.isHome ? "vs" : "@"}
                      </span>
                      <span>{game.opponent}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {game.date} • {game.time || game.timeOrScore}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {game.result ? (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        game.result.startsWith("W")
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {game.result} ({game.timeOrScore})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {game.broadcastNetwork || game.tvNetwork || game.timeOrScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Team Injury Wire */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400 animate-pulse" />
              <h3 className="font-extrabold text-base text-white">
                Official Injury Wire & Status
              </h3>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Apex Medical Intelligence
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {team.injuries.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Clean bill of health! No current designations.
              </div>
            ) : (
              team.injuries.map((injury, idx) => {
                const getStatusStyle = (status: string) => {
                  switch (status) {
                    case "Out":
                    case "IR":
                      return "bg-red-500/20 text-red-400 border-red-500/30";
                    case "Doubtful":
                    case "Questionable":
                      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
                    default:
                      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                  }
                };

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800/90 space-y-2 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {injury.playerName}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                          {injury.position}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusStyle(
                          injury.status
                        )}`}
                      >
                        {injury.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="text-amber-400 font-medium">Injury:</span>
                      <span>{injury.injuryType || injury.injury}</span>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-800/60">
                      <span className="line-clamp-1">{injury.practiceStatus || injury.details}</span>
                      <span className="text-gray-500 flex-shrink-0 ml-2">{injury.updatedAt || injury.lastUpdated}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Season Video Highlights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-white">
              2024–2025 Season Video Highlights
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            HD Broadcast Game Replays & Top Plays
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {team.highlights.map((highlight) => (
            <div
              key={highlight.id}
              onClick={() => setActiveHighlight(highlight)}
              className="group glass-panel rounded-2xl overflow-hidden border border-gray-800 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-lg"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                <Image
                  src={highlight.thumbnailUrl}
                  alt={highlight.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-gray-200">
                  {highlight.duration}
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase">
                  Week {highlight.week}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {highlight.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {highlight.description}
                </p>
                <div className="text-[11px] text-gray-500 pt-1">
                  {highlight.opponent ? `Opponent: ${highlight.opponent}` : `${highlight.views} views`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Star Playmakers Roster */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">
              Franchise Star Playmakers
            </h3>
          </div>
          <span className="text-xs text-gray-400">War Room Priority Weapons</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {team.starPlayers.map((player) => (
            <div
              key={player.id}
              className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-mono font-bold flex items-center justify-center text-xs border border-amber-500/20">
                  #{player.number}
                </span>
                <span className="text-xs font-bold uppercase text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  {player.position}
                </span>
              </div>

              <div>
                <div className="font-extrabold text-sm text-white">
                  {player.name}
                </div>
                <div className="text-xs text-amber-300/90 font-medium mt-0.5">
                  {player.statsHighlight || (player.college ? `${player.college} • ${player.experience}` : player.status)}
                </div>
              </div>

              {/* Stats showcase */}
              {player.stats && (
                <div className="pt-2 border-t border-gray-800 grid grid-cols-3 gap-1 text-center">
                  {Object.entries(player.stats).map(([k, v]) => (
                    <div key={k} className="p-1 rounded bg-gray-950">
                      <div className="text-[10px] text-gray-500 uppercase">{k}</div>
                      <div className="text-xs font-bold text-amber-300 font-mono">
                        {String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      {activeHighlight && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveHighlight(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-[#121622] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">
                  {activeHighlight.title}
                </h4>
                <p className="text-xs text-gray-400">
                  Week {activeHighlight.week} vs {activeHighlight.opponent}
                </p>
              </div>
              <button
                onClick={() => setActiveHighlight(null)}
                className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeHighlight.videoUrl}?autoplay=1`}
                title={activeHighlight.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
