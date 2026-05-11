"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import SafeImage from "@/components/SafeImage";
import { teamService, type Team as FSTeam, type Player } from "@/lib/teamService";
import { fallbackTeams, type DisplayTeam } from "@/data/teamsData";
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

// ── Game gradient map ──────────────────────────────────────────
const GAME_GRADIENTS: Record<string, string> = {
  default:  "linear-gradient(160deg,#0A0A0A 0%,#1a1a1a 100%)",
  fortnite: "linear-gradient(160deg,#0A0A0A 0%,#1a2a4a 60%,rgba(0,120,255,0.15) 100%)",
  "rocket league": "linear-gradient(160deg,#0A0A0A 0%,#1a1a2a 60%,rgba(255,90,0,0.12) 100%)",
  "rainbow six":
    "linear-gradient(160deg,#0A0A0A 0%,#1a1a1a 60%,rgba(168,85,247,0.12) 100%)",
  apex: "linear-gradient(160deg,#0A0A0A 0%,#2a1a1a 60%,rgba(200,50,50,0.12) 100%)",
};

function getGradient(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(GAME_GRADIENTS)) {
    if (lower.includes(key)) return GAME_GRADIENTS[key];
  }
  return GAME_GRADIENTS.default;
}

// ── Player detail modal ────────────────────────────────────────
function PlayerModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-[4px] border border-[#E5E5E5] w-full max-w-md p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Avatar */}
        {player.image && (
          <div className="relative w-20 h-20 rounded-[4px] overflow-hidden mb-5 bg-[#F5F5F5]">
            <Image
              src={player.image}
              alt={player.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <p className="font-grotesk font-black uppercase text-[#0A0A0A] text-2xl leading-none tracking-tight">
          {player.name}
        </p>
        {player.game && (
          <p className="text-[#6B6B6B] text-sm mt-1">{player.game}</p>
        )}
        {player.role && (
          <span className="inline-block mt-3 px-3 py-1 border border-[#E5E5E5] rounded-[4px] text-[10px] font-grotesk font-bold uppercase tracking-widest text-[#6B6B6B]">
            {player.role}
          </span>
        )}
        {player.description && (
          <p className="text-sm text-[#6B6B6B] mt-4 leading-relaxed">
            {player.description}
          </p>
        )}
        {player.achievements && player.achievements.length > 0 && (
          <ul className="mt-4 space-y-1">
            {player.achievements.map((ach, i) => (
              <li key={i} className="text-xs text-[#A855F7] flex items-center gap-2">
                <span className="w-1 h-1 bg-[#A855F7] rounded-full flex-shrink-0" />
                {ach}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function TeamsPage() {
  const [teams, setTeams] = useState<DisplayTeam[]>(fallbackTeams);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      const items = await teamService.getAll().catch(() => []);
      if (items && items.length > 0) {
        const mapped: DisplayTeam[] = items.map((t: FSTeam) => ({
          id: t.id,
          name: t.name,
          image: t.image,
          description: t.description,
          achievements: t.achievements ?? [],
          players: (t.players ?? []).map((p) => ({
            ...p,
            achievements: p.achievements ?? [],
            socialLinks: p.socialLinks ?? {},
            stats: p.stats ?? [],
            description: p.description ?? "",
          })),
        }));
        setTeams(mapped);
      } else {
        setTeams(fallbackTeams);
      }
    } catch {
      setTeams(fallbackTeams);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const toggleTeam = (id: string) =>
    setExpandedTeam((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-white">
      {/* Player modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="border-b border-[#E5E5E5]">
        <div className="void-container py-14">
          <p className="font-grotesk text-[10px] uppercase tracking-[0.25em] text-[#A855F7] mb-4">
            Compete at the highest level
          </p>
          <h1
            className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none"
            style={{
              fontSize: "clamp(44px, 8vw, 80px)",
              letterSpacing: "-0.02em",
            }}
          >
            THE ROSTER
          </h1>
          <p className="text-[#6B6B6B] text-base mt-4 max-w-lg">
            Meet the elite players representing Void Esports across four
            competitive titles.
          </p>
        </div>
      </div>

      {/* ── Team cards ──────────────────────────────────────── */}
      <div className="void-container py-10 space-y-4">
        {teams.map((team) => {
          const teamId = (team as { id?: string }).id ?? team.name;
          const expanded = expandedTeam === teamId;
          const gradient = getGradient(team.name);

          return (
            <div
              key={teamId}
              className="border border-[#E5E5E5] rounded-[4px] overflow-hidden"
            >
              {/* Team hero banner */}
              <div
                className="relative overflow-hidden cursor-pointer select-none"
                style={{ background: gradient, minHeight: "220px" }}
                onClick={() => toggleTeam(teamId)}
              >
                {/* Background image */}
                {team.image && (
                  <div className="absolute inset-0 opacity-20">
                    <SafeImage
                      src={team.image}
                      alt={team.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Content overlay */}
                <div className="relative z-10 p-8 md:p-10 flex items-end justify-between h-full min-h-[220px]">
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {team.achievements.slice(0, 2).map((ach, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-[2px] text-[10px] font-grotesk font-bold uppercase tracking-wider border border-white/20 text-white/70"
                        >
                          {ach}
                        </span>
                      ))}
                    </div>
                    <h2
                      className="font-grotesk font-black uppercase text-white leading-none"
                      style={{
                        fontSize: "clamp(28px, 4vw, 52px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {team.name}
                    </h2>
                    {team.description && (
                      <p className="text-white/60 text-sm mt-2 max-w-md line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    <p className="text-white/40 text-xs mt-3 font-grotesk uppercase tracking-wider">
                      {team.players.length} member
                      {team.players.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Expand / collapse chevron */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/50 transition-colors">
                      {expanded ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Expanded player list ─────────────────────── */}
              {expanded && (
                <div className="bg-[#F5F5F5] border-t border-[#E5E5E5]">
                  {team.players.length === 0 ? (
                    <p className="text-[#6B6B6B] text-sm p-8">
                      No players listed yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[#E5E5E5]">
                      {team.players.map((player, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPlayer(player)}
                          className="bg-white p-6 text-left hover:bg-[#F5F5F5] transition-colors group"
                        >
                          {/* Player avatar */}
                          {player.image && (
                            <div className="relative w-12 h-12 rounded-[4px] overflow-hidden mb-4 bg-[#F5F5F5]">
                              <Image
                                src={player.image}
                                alt={player.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <p className="font-grotesk font-black uppercase text-[#0A0A0A] text-base leading-tight group-hover:text-[#A855F7] transition-colors">
                            {player.name}
                          </p>
                          {player.game && (
                            <p className="text-[#6B6B6B] text-xs mt-0.5">
                              {player.game}
                            </p>
                          )}
                          {player.role && (
                            <span className="inline-block mt-2 text-[10px] font-grotesk font-bold uppercase tracking-widest text-[#A855F7]">
                              {player.role}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
