"use client";

import { useEffect, useMemo, useState } from 'react';
import PlacementGrid from '@/components/PlacementGrid';
import { ParallaxText, AnimatedCard, ScrollProgress, FadeInSection } from '@/components/FramerAnimations';
import { placementService } from '@/lib/placementService';

interface Placement {
  game: string;
  tournament: string;
  team: string;
  position: string;
  players: string[];
  prize?: string;
  logo: string;
}

export default function Placements() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('All');

  const loadPlacements = async () => {
    try {
      setLoading(true);
      const items = await placementService.getAll();
      // Convert Firebase data to the format expected by the PlacementGrid
      const formattedPlacements = items.map(item => ({
        game: item.game,
        tournament: item.tournament,
        team: item.team,
        position: item.position,
        players: item.players,
        prize: item.prize,
        logo: item.logo
      }));
      setPlacements(formattedPlacements);
    } catch (e) {
      console.error('Error loading placements:', e);
      // Fallback to hardcoded data if Firebase fails
      setPlacements([
        {
          game: "Fortnite",
          tournament: "FNCS Grand Finals",
          team: "Void Fortnite",
          position: "24th Place",
          players: ["Void Blu, Powerxfn, 2AM Zandaa"],
          prize: "$850",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "FNCS Grand Finals",
          team: "Void Fortnite",
          position: "33rd Place",
          players: ["Void Drvzy, EXE Liam, Maddenv_"],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "Ranked Cup",
          team: "Void Fortnite",
          position: "10th Place",
          players: ["Void Dixuez"],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "FNCS Group 3",
          team: "Void Fortnite",
          position: "7th Place",
          players: ["Void Blu, EXE Zanda, PowerFN"],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "FNCS Group 3",
          team: "Void Fortnite",
          position: "10th Place",
          players: ["Void Drvzy, Maddenv_, Liam"],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "Platinum & Diamond Ranked Cup (Solos)",
          team: "Void Fortnite",
          position: "11th Place",
          players: ["Void Cronus"],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
        {
          game: "Fortnite",
          tournament: "OG Cup Builds",
          team: "Void Fortnite",
          position: "12-15th Place",
          players: ["Void Frankenstein ", "Void Bob ", "Void Pistol ", "Void Iced "],
          prize: "$0",
          logo: "/logos/fortnite.jpg"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlacements();
  }, []);

  const games = useMemo(() => {
    const unique = Array.from(new Set(placements.map(p => p.game.trim())));
    return ['All', ...unique];
  }, [placements]);

  const filteredPlacements = useMemo(() => {
    if (selectedGame === 'All') return placements;
    return placements.filter(p => p.game.trim() === selectedGame);
  }, [selectedGame, placements]);

  // Removed fade/observer logic to ensure the container doesn't disappear

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFFFFF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading placements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 sm:pt-24 pb-16 sm:pb-20">
      <ScrollProgress />
      <div className="void-container">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <ParallaxText speed={0.2}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              Recent Placements
            </h1>
          </ParallaxText>
          <FadeInSection delay={0.1}>
            <p className="text-gray-400 text-base sm:text-lg px-4">
              Our teams&apos; latest achievements across various esports titles
            </p>
          </FadeInSection>
        </div>
        
        <AnimatedCard className="flex flex-col items-center mb-8 sm:mb-10 gap-3 bg-transparent border-0 shadow-none">
          <span className="text-xs sm:text-sm font-medium text-gray-400">Filter by game:</span>
          <div className="flex flex-wrap gap-1 sm:gap-2 bg-[#1A1A1A] rounded-full p-1 sm:p-1.5 border border-[#2A2A2A] max-w-full overflow-x-auto">
            {games.map(game => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  selectedGame === game
                    ? 'bg-white text-black'
                    : 'bg-transparent text-white hover:bg-white/10'
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </AnimatedCard>

        {/* Ad Spot - Banner before placements */}
        <div className="mb-8">
        </div>

        <div>
          <PlacementGrid placements={filteredPlacements} itemsPerPage={6} />
        </div>

        {/* Ad Spot - Banner at bottom */}
        <div className="mt-12">
        </div>
      </div>
    </div>
  );
}