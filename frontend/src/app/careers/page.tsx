"use client";

import React from "react";
import { AnimatedHeroSection, AnimatedCard, StaggeredList, StaggeredItem, FadeInSection } from '@/components/FramerAnimations';

export default function CareersPage() {
  return (
    <>
      {/* SEO / Meta Tags */}
      <meta charSet="UTF-8" />
      <title>Careers | Void Esports</title>
      <meta name="description" content="Join Void Esports! We're looking for passionate individuals to help shape the future of our company." />
      <meta property="og:title" content="Careers | Void Esports" />
      <meta property="og:description" content="Join Void Esports! We're looking for passionate individuals to help shape the future of our company." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.voidesports.org/careers " />
      <meta property="og:image" content="https://www.voidesports.org/logo.png " />

      <main className="min-h-screen bg-black text-gray-100">
        {/* Ad Spot - Banner at top */}
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-black flex flex-col items-center justify-center min-h-[500px]">
          <AnimatedHeroSection>
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
                Build the Future With Us
              </h1>
              <FadeInSection>
                <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                  We&apos;re crafting something amazing — and we want you on board.
                  Check back soon for current openings across engineering, design, marketing, and more.
                </p>
              </FadeInSection>
            </div>
          </AnimatedHeroSection>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16 px-6 bg-[#0F0F0F]">
          <div className="max-w-3xl mx-auto">
            <AnimatedCard className="void-card text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Positions Coming Soon
              </h2>
              <p className="text-gray-400">
                We&apos;re currently finalizing our hiring roadmap. Stay tuned for new opportunities
                in recruitment, design, marketing, customer success, and more.
              </p>
            </AnimatedCard>
          </div>
        </section>

        {/* About Our Culture */}
        <section className="py-16 px-6 bg-black">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Why Join Us?
            </h2>
            <StaggeredList className="grid md:grid-cols-2 gap-8">
              {[{
                title: 'Innovation First',
                text: 'We encourage creativity and experimentation. Solve real-world problems with cutting-edge tools.'
              }, {
                title: 'Growth-Focused',
                text: 'We invest in your development. From mentorship to learning budgets, grow with us.'
              }, {
                title: 'Remote Friendly',
                text: 'Work from anywhere in the world. Flexible hours and inclusive culture.'
              }, {
                title: 'Impactful Work',
                text: 'Your work will make a difference — for users, for the planet, and for the future.'
              }].map((item) => (
                <StaggeredItem key={item.title}>
                  <AnimatedCard className="void-card">
                    <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                    <p className="text-gray-300">{item.text}</p>
                  </AnimatedCard>
                </StaggeredItem>
              ))}
            </StaggeredList>
          </div>
        </section>

        {/* Ad Spot - Banner before CTA */}
        <div className="py-8 px-6 bg-[#0F0F0F]">
          <div className="max-w-7xl mx-auto">
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16 px-6 bg-[#0F0F0F]">
          <div className="max-w-3xl mx-auto">
            <AnimatedCard className="void-card text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Stay in the Loop</h2>
              <p className="mb-6">
                Want to be among the first to know when jobs are posted? Reach out now!
              </p>
              <a
                href="https://www.voidesports.org/contact "
                className="inline-block bg-white text-black hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                Contact us on the contact page
              </a>
            </AnimatedCard>
          </div>
        </section>

        {/* Ad Spot - Banner at bottom */}
        <div className="py-8 px-6 bg-black">
          <div className="max-w-7xl mx-auto">
          </div>
        </div>

        {/* Footer Note */}
        <footer className="text-center text-sm text-gray-600 py-8">
          <p>© {new Date().getFullYear()} Void Esports, Inc. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
