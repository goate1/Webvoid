"use client";

import { useEffect, useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { scheduleService, type Match, type Event } from '@/lib/scheduleService';

const fallbackMatches = [
  {
    game: 'TBD',
    event: 'TBD',
    opponent: 'TBD',
    date: 'TBD',
    time: 'TBD',
    streamLink: 'https://www.twitch.tv/voidfrankenstein',
  },
];

const fallbackEvents = [
  {
    name: 'Void Summer Showdown',
    game: 'Fortnite',
    date: 'TBD',
    type: 'Online Tournament',
    prizePool: 'TBD (USD)',
    registrationLink: 'https://discord.gg/voidesports2x',
  },
];

export default function SchedulePage() {
  const [upcomingMatches, setUpcomingMatches] = useState(fallbackMatches);
  const [upcomingEvents, setUpcomingEvents] = useState(fallbackEvents);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [matches, events] = await Promise.all([
          scheduleService.getAllMatches(),
          scheduleService.getAllEvents()
        ]);
        if (!mounted) return;
        if (matches && matches.length > 0) {
          setUpcomingMatches(matches.map(m => ({
            game: m.game,
            event: m.event,
            opponent: m.opponent,
            date: m.date,
            time: m.time,
            streamLink: m.streamLink
          })));
        } else {
          setUpcomingMatches(fallbackMatches);
        }
        if (events && events.length > 0) {
          setUpcomingEvents(events.map(e => ({
            name: e.name,
            game: e.game,
            date: e.date,
            type: e.type,
            prizePool: e.prizePool,
            registrationLink: e.registrationLink
          })));
        } else {
          setUpcomingEvents(fallbackEvents);
        }
      } catch {
        setUpcomingMatches(fallbackMatches);
        setUpcomingEvents(fallbackEvents);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="pt-20 min-h-screen bg-[#0F0F0F]">
      <div className="void-container py-8 sm:py-12">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        <AnimatedSection animationType="fadeIn" delay={100}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 gradient-text text-center">Schedule</h1>
        </AnimatedSection>
        
        {/* Upcoming Matches */}
        <AnimatedSection animationType="slideUp" delay={150}>
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Upcoming Matches</h2>
          <div className="grid gap-3 sm:gap-4">
            {upcomingMatches.map((match, idx) => (
              <AnimatedSection key={`${match.game}-${match.date}`} animationType="fadeIn" delay={idx * 100}>
              <div className="void-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#FFFFFF]/20 rounded-full text-[#FFFFFF] text-xs sm:text-sm">
                        {match.game}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400">{match.event}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      Void vs {match.opponent}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-sm sm:text-base text-gray-400">
                      <div>{match.date}</div>
                      <div>{match.time}</div>
                    </div>
                      <a
                        href={match.streamLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="void-button min-h-[44px] text-sm sm:text-base w-full sm:w-auto text-center"
                      >
                        Watch Stream
                      </a>
                  </div>
                </div>
              </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
        </AnimatedSection>
        
        {/* Ad Spot - Banner between sections */}
        <div className="my-8">
        </div>

        {/* Upcoming Events */}
        <AnimatedSection animationType="slideUp" delay={250}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Upcoming Events</h2>
          <div className="grid gap-3 sm:gap-4">
            {upcomingEvents.map((event, idx) => (
              <AnimatedSection key={event.name} animationType="fadeIn" delay={idx * 100}>
              <div className="void-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#FFFFFF]/20 rounded-full text-[#FFFFFF] text-xs sm:text-sm">
                        {event.game}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400">{event.type}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white mb-1">
                      {event.name}
                    </div>
                    {event.prizePool && (
                      <div className="text-sm sm:text-base text-[#a2a2a2]">Prize Pool: {event.prizePool}</div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-sm sm:text-base text-gray-400">
                      <div>{event.date}</div>
                    </div>
                    <a
                      href={event.registrationLink}
                      className="void-button min-h-[44px] text-sm sm:text-base w-full sm:w-auto text-center"
                    >
                      Register Now
                    </a>
                  </div>
                </div>
              </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
        </AnimatedSection>

        {/* Ad Spot - Banner at bottom */}
        <div className="mt-12">
        </div>
      </div>
    </div>
  );
} 