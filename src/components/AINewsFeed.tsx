"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Zap, 
  Search,
  X
} from "lucide-react";
import { NewsArticle, AISummaryResponse } from "@/types";

interface AINewsFeedProps {
  onOpenAISummary?: (prompt: string, title: string) => void;
}

export default function AINewsFeed({}: AINewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBrief, setActiveBrief] = useState<{
    article: NewsArticle;
    brief: AISummaryResponse | null;
    loading: boolean;
  } | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleGenerateBrief = async (article: NewsArticle) => {
    setActiveBrief({ article, brief: null, loading: true });

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: article.title,
          context: `${article.summary} Source: ${article.source}. Category: ${article.category}.`,
        }),
      });
      const data = await res.json();
      setActiveBrief({ article, brief: data, loading: false });
    } catch (err) {
      console.error("Failed to summarize:", err);
      setActiveBrief({
        article,
        brief: {
          summary: article.summary,
          keyTakeaways: ["High-impact league transaction", "Watch practice reports"],
          fantasyImpact: "Neutral to slight positive target share",
          urgency: "Medium",
        },
        loading: false,
      });
    }
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSource =
      selectedSource === "ALL" ? true : art.source.toLowerCase().includes(selectedSource.toLowerCase());
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.teamTag?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Intelligence Ribbon */}
      <div className="glass-panel-gold rounded-2xl p-6 border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Ingestion Engine Active
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Live AI NFL Intelligence Wire
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time multi-source crawler synthesizing Yahoo Sports, ESPN, and Pro Football Insiders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="py-2 px-3.5 rounded-xl bg-gray-900 border border-gray-700 hover:border-amber-500 text-xs font-semibold text-gray-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Scan Feeds</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Source Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-gray-900/80 rounded-xl border border-gray-800">
          {[
            { id: "ALL", label: "All Intelligence" },
            { id: "yahoo", label: "Yahoo Sports" },
            { id: "espn", label: "ESPN" },
            { id: "insider", label: "NFL Insider" },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedSource === src.id
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news, players, teams..."
            className="w-full bg-gray-900/90 border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* News Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-gray-900/50 border border-gray-800 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-gray-800 text-gray-400">
          No articles matched your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredArticles.map((article) => {
            const isYahoo = article.source.toLowerCase().includes("yahoo");
            const isEspn = article.source.toLowerCase().includes("espn");

            return (
              <div
                key={article.id}
                className="glass-panel rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Source & Category Ribbon */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isYahoo
                            ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                            : isEspn
                            ? "bg-red-900/40 text-red-300 border border-red-500/30"
                            : "bg-amber-900/40 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {article.source}
                      </span>
                      {(article.teamTag || article.tags?.[0]) && (
                        <span className="text-[10px] font-bold text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">
                          {article.teamTag || article.tags?.[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.publishedAt}
                    </span>
                  </div>

                  {/* Headline & Summary */}
                  <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                {/* AI Tactical Synthesis Button & Link */}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleGenerateBrief(article)}
                    className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    AI Intelligence Brief
                  </button>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Read Original Source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Intelligence Brief Modal */}
      {activeBrief && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveBrief(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-gradient-to-b from-[#141a27] to-[#0a0d15] border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl p-6 text-gray-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-800">
              <div className="space-y-1 pr-6">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-amber-400" /> Apex AI Synthesis
                </span>
                <h3 className="text-lg font-bold text-white line-clamp-2">
                  {activeBrief.article.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveBrief(null)}
                className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brief Content */}
            <div className="py-5 overflow-y-auto space-y-5 flex-1">
              {activeBrief.loading ? (
                <div className="p-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-gray-300">
                    Apex AI Neural Scanner synthesizing cross-source intelligence...
                  </p>
                </div>
              ) : activeBrief.brief ? (
                <>
                  {/* Executive Brief */}
                  <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Executive Summary
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed">
                      {activeBrief.brief.summary}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-white">
                      Key Takeaways & Roster Impact
                    </div>
                    <ul className="space-y-2">
                      {activeBrief.brief.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fantasy & Wagering Angle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 space-y-1">
                      <div className="text-[11px] font-bold text-gray-400 uppercase">
                        Fantasy & Wagering Outlook
                      </div>
                      <div className="text-xs font-medium text-emerald-300">
                        {activeBrief.brief.fantasyImpact}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800 space-y-1">
                      <div className="text-[11px] font-bold text-gray-400 uppercase">
                        War Room Urgency
                      </div>
                      <div className="text-xs font-bold text-amber-400 uppercase">
                        {activeBrief.brief.urgency} Priority
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>Source: {activeBrief.article.source}</span>
              <a
                href={activeBrief.article.url}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Read full source article <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
