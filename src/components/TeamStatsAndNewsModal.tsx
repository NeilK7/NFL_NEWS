"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  X, 
  BarChart2, 
  Newspaper, 
  Sparkles, 
  ChevronDown, 
  Shield, 
  TrendingUp, 
  Award, 
  Target, 
  ExternalLink,
  Search,
  RefreshCw,
  Flame,
  CheckCircle2
} from "lucide-react";
import { NFLTeam, NewsArticle, TeamStats } from "@/types";
import { NFL_TEAMS } from "@/lib/nfl-teams";
import { getTeamStats } from "@/lib/team-stats";
import { getTeamNews } from "@/lib/team-news";

interface TeamStatsAndNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: NFLTeam;
  onSelectTeam: (team: NFLTeam) => void;
  initialTab?: "stats" | "news";
  onOpenAISummary: (prompt: string, title: string) => void;
}

export default function TeamStatsAndNewsModal({
  isOpen,
  onClose,
  team,
  onSelectTeam,
  initialTab = "stats",
  onOpenAISummary,
}: TeamStatsAndNewsModalProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "news">(initialTab);
  const [teamSelectorOpen, setTeamSelectorOpen] = useState(false);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSearch, setNewsSearch] = useState("");
  const [liveStats, setLiveStats] = useState<TeamStats | null>(null);
  const [liveRecord, setLiveRecord] = useState<{ wins: number; losses: number; ties: number }>(
    team.record
  );

  const stats: TeamStats = liveStats || team.teamStats || getTeamStats(team.id);

  // Synchronize initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load team news and live stats when modal opens or team changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLiveStats(null);
    setLiveRecord(team.record);

    async function fetchTeamNewsAndStats() {
      setNewsLoading(true);
      try {
        const fullTeamName = `${team.city} ${team.name}`;
        const [newsRes, intelRes] = await Promise.all([
          fetch(`/api/news?team=${team.id}`, { cache: "no-store" }),
          fetch(
            `/api/team-intel?teamName=${encodeURIComponent(fullTeamName)}&teamAbbr=${encodeURIComponent(
              team.abbreviation
            )}`,
            { cache: "no-store" }
          ),
        ]);

        if (newsRes.ok) {
          const data = await newsRes.json();
          if (isMounted && data.articles && data.articles.length > 0) {
            setNewsArticles(data.articles);
          } else if (isMounted) {
            setNewsArticles(getTeamNews(team.id, team.name, team.abbreviation));
          }
        } else if (isMounted) {
          setNewsArticles(getTeamNews(team.id, team.name, team.abbreviation));
        }

        if (intelRes.ok) {
          const intelData = await intelRes.json();
          if (isMounted && intelData.liveTeamStats) {
            setLiveStats(intelData.liveTeamStats);
          }
          if (isMounted && intelData.liveTeamData?.record) {
            setLiveRecord(intelData.liveTeamData.record);
          }
        }
      } catch {
        if (isMounted) {
          setNewsArticles(getTeamNews(team.id, team.name, team.abbreviation));
        }
      } finally {
        if (isMounted) setNewsLoading(false);
      }
    }

    fetchTeamNewsAndStats();
    return () => {
      isMounted = false;
    };
  }, [isOpen, team.id, team.city, team.name, team.abbreviation, team.record]);

  if (!isOpen) return null;

  const filteredNews = newsArticles.filter((art) => {
    if (!newsSearch.trim()) return true;
    const q = newsSearch.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c101a] border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Team Switcher */}
        <div 
          className="p-5 sm:p-6 border-b border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor}22 0%, #0d121c 65%, #090b10 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-2.5 flex items-center justify-center shadow-xl border border-white/10"
              style={{ backgroundColor: `${team.primaryColor}33` }}
            >
              <div className="w-full h-full relative">
                <Image
                  src={team.logoUrl}
                  alt={team.name}
                  fill
                  className="object-contain drop-shadow-md"
                  sizes="64px"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                {/* Team Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTeamSelectorOpen(!teamSelectorOpen)}
                    className="flex items-center gap-1.5 font-black text-xl sm:text-2xl text-white hover:text-amber-300 transition-colors"
                  >
                    <span>{team.city} {team.name}</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>

                  {teamSelectorOpen && (
                    <div className="absolute left-0 mt-2 w-72 max-h-60 overflow-y-auto bg-[#101522] border border-amber-500/30 rounded-2xl shadow-2xl z-50 p-2 space-y-1 divide-y divide-gray-800/50">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400">
                        Switch Team
                      </div>
                      {NFL_TEAMS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectTeam(t);
                            setTeamSelectorOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                            team.id === t.id
                              ? "bg-amber-500/20 text-amber-300"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          <div className="w-5 h-5 relative flex-shrink-0">
                            <Image
                              src={t.logoUrl}
                              alt={t.name}
                              fill
                              className="object-contain"
                              sizes="20px"
                            />
                          </div>
                          <span className="truncate">{t.city} {t.name}</span>
                          <span className="ml-auto text-[10px] text-gray-500 font-mono">
                            {t.record.wins}-{t.record.losses}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span className="px-2 py-0.5 rounded bg-gray-900 font-bold text-amber-400 border border-amber-500/20">
                  {team.conference} {team.division}
                </span>
                <span>•</span>
                <span className="font-semibold text-white">
                  Record: {liveRecord.wins}-{liveRecord.losses}
                  {liveRecord.ties ? `-${liveRecord.ties}` : ""}
                </span>
                <span>•</span>
                <span className="text-gray-400">{team.stadium}</span>
              </div>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "stats"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Team Stats</span>
              </button>
              <button
                onClick={() => setActiveTab("news")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "news"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Team News ({newsArticles.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: TEAM STATS */}
          {activeTab === "stats" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800/80 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-gray-400 flex items-center justify-between">
                    <span>Points / Game</span>
                    {stats.rankings?.scoringOffenseRank && (
                      <span className="text-amber-400 font-mono">#{stats.rankings.scoringOffenseRank} NFL</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.pointsPerGame.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500">Offensive Scoring Output</div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800/80 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-gray-400 flex items-center justify-between">
                    <span>Pts Allowed / G</span>
                    {stats.rankings?.scoringDefenseRank && (
                      <span className="text-emerald-400 font-mono">#{stats.rankings.scoringDefenseRank} NFL</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.pointsAllowedPerGame.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500">Defensive Scoring Wall</div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800/80 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-gray-400 flex items-center justify-between">
                    <span>Total Yards / G</span>
                    {stats.rankings?.totalOffenseRank && (
                      <span className="text-amber-400 font-mono">#{stats.rankings.totalOffenseRank} NFL</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.totalYardsPerGame.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Pass: {stats.passingYardsPerGame} • Rush: {stats.rushingYardsPerGame}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800/80 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-gray-400 flex items-center justify-between">
                    <span>Yards Allowed / G</span>
                    {stats.rankings?.totalDefenseRank && (
                      <span className="text-emerald-400 font-mono">#{stats.rankings.totalDefenseRank} NFL</span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {stats.yardsAllowedPerGame.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Def Pass: {stats.passYardsAllowedPerGame} • Def Rush: {stats.rushYardsAllowedPerGame}
                  </div>
                </div>
              </div>

              {/* Secondary Metrics: Turnovers, Sacks, Efficiency */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Turnover Diff</div>
                    <div className={`text-lg font-black font-mono ${stats.turnoverDifferential >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stats.turnoverDifferential > 0 ? `+${stats.turnoverDifferential}` : stats.turnoverDifferential}
                    </div>
                  </div>
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Team Sacks</div>
                    <div className="text-lg font-black text-white font-mono">
                      {stats.sacks} Sacks
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">3rd Down %</div>
                    <div className="text-lg font-black text-amber-300 font-mono">
                      {stats.thirdDownPct.toFixed(1)}%
                    </div>
                  </div>
                  <Target className="w-5 h-5 text-gray-600" />
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400">Red Zone TD %</div>
                    <div className="text-lg font-black text-amber-300 font-mono">
                      {stats.redZonePct.toFixed(1)}%
                    </div>
                  </div>
                  <Flame className="w-5 h-5 text-gray-600" />
                </div>
              </div>

              {/* Franchise Statistical Leaders */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    {team.name} Franchise Statistical Leaders
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {stats.leaders?.passing && (
                    <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-400">Passing Leader</div>
                      <div className="font-extrabold text-sm text-white">{stats.leaders.passing.name}</div>
                      <div className="text-xs text-gray-300 font-mono pt-1">{stats.leaders.passing.stat}</div>
                    </div>
                  )}

                  {stats.leaders?.rushing && (
                    <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-400">Rushing Leader</div>
                      <div className="font-extrabold text-sm text-white">{stats.leaders.rushing.name}</div>
                      <div className="text-xs text-gray-300 font-mono pt-1">{stats.leaders.rushing.stat}</div>
                    </div>
                  )}

                  {stats.leaders?.receiving && (
                    <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-400">Receiving Leader</div>
                      <div className="font-extrabold text-sm text-white">{stats.leaders.receiving.name}</div>
                      <div className="text-xs text-gray-300 font-mono pt-1">{stats.leaders.receiving.stat}</div>
                    </div>
                  )}

                  {stats.leaders?.defense && (
                    <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-400">Defensive Anchor</div>
                      <div className="font-extrabold text-sm text-white">{stats.leaders.defense.name}</div>
                      <div className="text-xs text-gray-300 font-mono pt-1">{stats.leaders.defense.stat}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Situational Record Overview */}
              <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800 flex flex-wrap items-center justify-around gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Current Streak: </span>
                  <span className="font-bold text-white">{stats.streak}</span>
                </div>
                <div>
                  <span className="text-gray-400">Home Record: </span>
                  <span className="font-bold text-white">{stats.homeRecord}</span>
                </div>
                <div>
                  <span className="text-gray-400">Away Record: </span>
                  <span className="font-bold text-white">{stats.awayRecord}</span>
                </div>
                <div>
                  <span className="text-gray-400">Division Record: </span>
                  <span className="font-bold text-white">{stats.divisionRecord}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM NEWS */}
          {activeTab === "news" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Search within News */}
              <div className="flex items-center gap-3 justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newsSearch}
                    onChange={(e) => setNewsSearch(e.target.value)}
                    placeholder={`Search ${team.name} news stories...`}
                    className="w-full bg-gray-900 border border-gray-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Showing {filteredNews.length} verified reports
                </div>
              </div>

              {newsLoading ? (
                <div className="p-12 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Scanning ESPN, Yahoo Sports & NFL Wire for {team.name}...</p>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400">
                  No headlines match &quot;{newsSearch}&quot;.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredNews.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-amber-500/40 transition-all space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {article.source}
                          </span>
                          <span className="text-[11px] text-gray-400">• {article.publishedAt}</span>
                          {article.author && (
                            <span className="hidden sm:inline text-[11px] text-gray-500">
                              by {article.author}
                            </span>
                          )}
                        </div>

                        {/* Trigger AI Brief */}
                        <button
                          onClick={() =>
                            onOpenAISummary(
                              `${article.summary} Source: ${article.source}. Tags: ${article.tags.join(", ")}.`,
                              article.title
                            )
                          }
                          className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Sparkles className="w-3 h-3 fill-black" />
                          <span>AI Brief</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-base text-white group-hover:text-amber-300 transition-colors leading-snug">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-800/60">
                        {article.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}

                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Full Article</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#090b10] border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Apex Intelligence Engine Active</span>
          </div>
          <button
            onClick={() => {
              onClose();
            }}
            className="py-1.5 px-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-500 text-xs font-bold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
