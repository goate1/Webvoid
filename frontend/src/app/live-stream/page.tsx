'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatedHeroSection, StaggeredList, StaggeredItem, AnimatedCard } from '@/components/FramerAnimations';

interface Streamer {
  name: string;
  game: string;
  image: string;
  description: string;
  channelLink: string;
}

const streamers: Streamer[] = [
  {
    name: 'Void Frankenstein',
    game: 'Fortnite',
    image: '/teams/players/frank.png',
    description: 'Professional fortnite player and content creator',
    channelLink: 'https://www.twitch.tv/voidfrankenstein',
  },
  {
    name: 'Void Esports 2x',
    game: 'Official',
    image: '/logos/new-logo.png',
    description: 'Official Void Esports stream channel',
    channelLink: 'https://www.twitch.tv/voidesports2x',
  },
  // Add more streamers as needed
];

export default function LiveStreamPage() {
  const [isLive, setIsLive] = useState(false);
  
  // This would typically check if any streamers are currently live
  // For now, we'll just set it to false to match the screenshot
  useEffect(() => {
    setIsLive(false);
  }, []);

  return (
    <div className="pt-20 min-h-screen bg-[#0F0F0F]">
      <div className="void-container py-12">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        <AnimatedHeroSection>
          <h1 className="text-4xl font-bold mb-4 gradient-text text-center">Live Streams</h1>
          <p className="text-xl text-center text-gray-300 mb-12">Watch our players compete live on Twitch</p>
        </AnimatedHeroSection>
        
        {/* Live Stream Embed Section */}
        <div className="mb-16 bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg">
          {isLive ? (
            <div className="aspect-video w-full">
              {/* This would be replaced with an actual Twitch embed when someone is live */}
              <iframe 
                src="https://player.twitch.tv/?channel=voidesports2x&parent=localhost" 
                height="100%" 
                width="100%" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : (
            <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                  <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No Live Streams</h2>
              <p className="text-gray-400">None of our streamers are currently live. Check back later or follow them on Twitch!</p>
            </div>
          )}
        </div>
        
        {/* Ad Spot - Banner before streamers */}
        <div className="mb-8">
        </div>

        {/* Our Streamers Section */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-white">Our Streamers</h2>
          
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {streamers.map((streamer, index) => (
              <StaggeredItem key={streamer.name}>
                <AnimatedCard delay={index * 0.1} className="bg-[#1A1A1A] rounded-lg overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image 
                          src={streamer.image} 
                          alt={streamer.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#a6a6a6] transition-colors duration-300">
                          {streamer.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-[#FFFFFF]/20 rounded-full text-[#FFFFFF] text-xs">
                            {streamer.game}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
                      {streamer.description}
                    </p>
                    
                    <a
                      href={streamer.channelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="void-button w-full text-center"
                    >
                      Void Channel
                    </a>
                  </div>
                </AnimatedCard>
              </StaggeredItem>
            ))}
          </StaggeredList>
        </div>

        {/* Ad Spot - Banner at bottom */}
        <div className="mt-12">
        </div>
      </div>
    </div>
  );
}