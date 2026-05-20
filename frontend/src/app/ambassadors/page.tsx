'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import PlayerCard from '@/components/PlayerCard';
import { ambassadorService, type Ambassador } from '@/lib/ambassadorService';

export default function AmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        const data = await ambassadorService.getAll();
        setAmbassadors(data);
      } catch (error) {
        console.error('Error fetching ambassadors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbassadors();
  }, []);

  return (
    <div className="pt-20 min-h-screen bg-[#1a0a2e] relative">
      {/* SEO / Meta Tags */}
      <title>Void Outreach Program | Void Esports</title>
      <meta name="description" content="Join the Void Outreach Program and become an official brand ambassador! Help Void grow in every game you play." />

      <div className="void-container py-8 sm:py-12">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        {/* Hero Section */}
        <AnimatedSection animationType="fadeIn" delay={100}>
          <div className="text-center mb-16 sm:mb-24 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text relative z-10">
              Void Outreach Program
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed relative z-10">
              Become an official brand ambassador and help Void grow in every game you play.
              Join the movement today!
            </p>
            <div className="mt-8 relative z-10">
              <Link
                href="/contact"
                className="inline-block bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* What is it & Why sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <AnimatedSection animationType="slideRight" delay={200}>
            <div className="void-card h-full">
              <h2 className="text-2xl font-bold mb-4 gradient-text">What is it?</h2>
              <p className="text-gray-300 leading-relaxed">
                The Void Outreach Program is simple. Make a team or group in any game you play.
                Reach out to us showing you have made it, and you can become an official brand ambassador
                for that game. You'll be featured on our website and help us maintain an active presence
                in your favorite games.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection animationType="slideLeft" delay={300}>
            <div className="void-card h-full">
              <h2 className="text-2xl font-bold mb-4 gradient-text">Why join?</h2>
              <p className="text-gray-300 leading-relaxed">
                We want to grow beyond Fortnite! We are looking to establish a presence in games like
                Siege, CSGO, Warzone, Clash Royale, Brawl Stars, and more. As an ambassador, you are
                the key to this expansion.
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <AnimatedSection animationType="fadeIn" delay={200}>
            <h2 className="text-3xl font-bold text-center mb-10 gradient-text">Program Benefits</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection animationType="slideUp" delay={300}>
              <div className="void-card group hover:border-purple-500/50 transition-colors duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-900/20 rounded-lg text-purple-400 group-hover:text-purple-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-200 transition-colors">Board of Directors</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      If your game becomes successful for Void, you could be automatically appointed to the
                      Board of Directors. This opens opportunities to earn from Void and influence our
                      investment in your favorite games.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animationType="slideUp" delay={400}>
              <div className="void-card group hover:border-purple-500/50 transition-colors duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-900/20 rounded-lg text-purple-400 group-hover:text-purple-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-200 transition-colors">Content Promotion</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      Create content for your game and we can help promote it across our brand channels.
                      Grow your personal brand alongside Void!
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Ad Spot - Banner before ambassadors */}
        <div className="mb-12">
        </div>

        {/* Current Ambassadors Section */}
        <div className="mb-20">
          <AnimatedSection animationType="fadeIn" delay={200}>
            <h2 className="text-3xl font-bold text-center mb-10 gradient-text">Our Brand Ambassadors</h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
            {loading ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                Loading ambassadors...
              </div>
            ) : ambassadors.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                No ambassadors found yet. Be the first to join!
              </div>
            ) : (
              ambassadors.map((ambassador, idx) => (
                <AnimatedSection key={ambassador.id || idx} animationType="slideUp" delay={300 + (idx * 100)}>
                  <PlayerCard
                    name={ambassador.name}
                    role={ambassador.role}
                    image={ambassador.image}
                    game={ambassador.game}
                    achievements={ambassador.achievements}
                    socialLinks={ambassador.socialLinks}
                  />
                </AnimatedSection>
              ))
            )}
          </div>
        </div>

        {/* Ad Spot - Banner before CTA */}
        <div className="mb-12">
        </div>

        {/* Final CTA */}
        <AnimatedSection animationType="scale" delay={200}>
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-8 md:p-12 text-center border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,transparent)]" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to represent Void?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join our team of ambassadors and help us build the future of esports gaming communities.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-white text-black hover:bg-gray-200 font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                Contact Us to Join
              </Link>
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
