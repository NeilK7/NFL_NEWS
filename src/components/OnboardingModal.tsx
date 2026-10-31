"use client";

import React, { useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { 
  Trophy, 
  Search, 
  Check, 
  Star, 
  ArrowRight, 
  Sparkles, 
  X
} from "lucide-react";
import { NFLTeam, Player, UserPreferences } from "@/types";
import { NFL_TEAMS } from "@/lib/nfl-teams";
import { saveUserPreferences } from "@/lib/supabase";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: UserPreferences | null;
  onSavePreferences: (prefs: UserPreferences) => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState<"ALL" | "AFC" | "NFC">("ALL");

  // Selected state
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    currentPreferences?.favoriteTeamIds || ["kc", "sf"]
  );
  const [primaryTeamId, setPrimaryTeamId] = useState<string>(
    currentPreferences?.primaryTeamId || "kc"
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    currentPreferences?.favoritePlayerIds || ["mahomes", "cmc"]
  );
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Filter teams
  const filteredTeams = NFL_TEAMS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesConf =
      conferenceFilter === "ALL" ? true : t.conference === conferenceFilter;
    return matchesSearch && matchesConf;
  });

  // Collect relevant star players
  const availablePlayers: { player: Player; team: NFLTeam }[] = [];
  NFL_TEAMS.forEach((team) => {
    team.starPlayers.forEach((player) => {
      // Prioritize players from selected teams, or all star players
      availablePlayers.push({ player, team });
    });
  });

  const toggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      if (selectedTeamIds.length === 1) return; // Must have at least one
      const updated = selectedTeamIds.filter((id) => id !== teamId);
      setSelectedTeamIds(updated);
      if (primaryTeamId === teamId) {
        setPrimaryTeamId(updated[0]);
      }
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const newPrefs: UserPreferences = {
      favoriteTeamIds: selectedTeamIds,
      primaryTeamId: primaryTeamId || selectedTeamIds[0] || "kc",
      favoritePlayerIds: selectedPlayerIds,
      notificationsEnabled: true,
      theme: "dark",
    };

    try {
      await saveUserPreferences(newPrefs);
      
      // Fire luxury celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d4af37", "#fef08a", "#10b981", "#ffffff"],
      });

      onSavePreferences(newPrefs);
      onClose();
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-gradient-to-b from-[#131926] to-[#0a0d14] border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden text-gray-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Gold Trim Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 px-6 py-2 flex items-center justify-between text-black font-bold text-xs uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 fill-black" />
            Apex War Room Customizer
          </span>
          <span>Step {step} of 2</span>
        </div>

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {step === 1 ? (
                <>
                  Select Your <span className="gold-gradient-text">NFL Franchises</span>
                </>
              ) : (
                <>
                  Track Your <span className="gold-gradient-text">Star Players</span>
                </>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {step === 1
                ? "Choose your favorite teams to power your personalized schedule, live injury alerts & highlights."
                : "Select the superstar playmakers you want real-time fantasy updates and stat lines for."}
            </p>
          </div>
          {currentPreferences && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {step === 1 ? (
            /* STEP 1: TEAMS */
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by team, city or code..."
                    className="w-full bg-gray-900/90 border border-gray-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800 self-end sm:self-auto">
                  {(["ALL", "AFC", "NFC"] as const).map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setConferenceFilter(conf)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        conferenceFilter === conf
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {conf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Count Indicator */}
              <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800/80">
                <span>
                  Selected: <strong className="text-amber-400 font-bold">{selectedTeamIds.length}</strong> teams
                </span>
                <span className="text-[11px] text-gray-400">
                  Click a selected team to set as <strong className="text-amber-300">Primary Hub</strong>
                </span>
              </div>

              {/* Grid of 32 Teams */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredTeams.map((team) => {
                  const isSelected = selectedTeamIds.includes(team.id);
                  const isPrimary = primaryTeamId === team.id;

                  return (
                    <div
                      key={team.id}
                      onClick={() => {
                        if (!isSelected) {
                          toggleTeam(team.id);
                          if (selectedTeamIds.length === 0) setPrimaryTeamId(team.id);
                        } else {
                          // If already selected, make it primary or deselect
                          if (!isPrimary) {
                            setPrimaryTeamId(team.id);
                          } else {
                            toggleTeam(team.id);
                          }
                        }
                      }}
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-between group ${
                        isSelected
                          ? "bg-gray-800/90 border-amber-500 shadow-md shadow-amber-500/10"
                          : "bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50"
                      }`}
                      style={{
                        boxShadow: isSelected
                          ? `0 0 15px ${team.primaryColor}33`
                          : undefined,
                      }}
                    >
                      {/* Primary Badge */}
                      {isPrimary && (
                        <span className="absolute top-2 left-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black tracking-wider flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-black" /> Primary
                        </span>
                      )}

                      {/* Selection Checkmark */}
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-amber-400 text-black font-bold"
                            : "border border-gray-700 text-transparent group-hover:border-gray-500"
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>

                      <div className="w-14 h-14 relative my-2">
                        <Image
                          src={team.logoUrl}
                          alt={team.name}
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="56px"
                        />
                      </div>

                      <div className="text-center w-full">
                        <div className="font-bold text-xs text-white truncate">
                          {team.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {team.conference} • {team.division}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: STAR PLAYERS */
            <div className="space-y-4">
              <div className="text-xs text-gray-400 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800/80 flex items-center justify-between">
                <span>
                  Tracking <strong className="text-amber-400 font-bold">{selectedPlayerIds.length}</strong> players
                </span>
                <span className="text-[11px] text-gray-400">
                  Select key weapons for live injury & game feed priority
                </span>
              </div>

              {/* Player Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {availablePlayers.map(({ player, team }) => {
                  const isTracked = selectedPlayerIds.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isTracked
                          ? "bg-gray-800/90 border-amber-500 shadow-md shadow-amber-500/10"
                          : "bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs text-amber-400 flex-shrink-0">
                          #{player.number}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            <span className="text-[10px] font-semibold text-gray-400 px-1.5 py-0.2 bg-gray-800 rounded">
                              {player.position}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span className="font-medium text-amber-300">{team.name}</span>
                            <span>•</span>
                            <span>{player.experience || player.statsHighlight || player.status}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isTracked
                            ? "bg-amber-400 text-black font-bold"
                            : "border border-gray-700 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-gray-800 bg-[#0e131e] flex items-center justify-between">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Teams
            </button>
          ) : (
            <div className="text-xs text-gray-500">
              * Preferences persist automatically to Supabase backend & local cache.
            </div>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={selectedTeamIds.length === 0}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              Next: Select Star Players
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="py-2.5 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              {saving ? "Locking In..." : "Launch Apex Command Center"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
