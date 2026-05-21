import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Partners | VOID Esports",
  description: "Official partners of VOID Esports.",
};

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-24 pb-20">
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center mb-16">
        <p className="text-[#A855F7] text-xs uppercase tracking-[0.2em] font-semibold mb-3">
          Official Partners
        </p>
        <h1 className="font-grotesk font-black text-white text-4xl md:text-5xl uppercase tracking-tight">
          Our Partners
        </h1>
        <p className="text-[#6B6B6B] mt-4 text-sm max-w-md mx-auto">
          Brands that believe in what we build. Partners that support the grind.
        </p>
      </div>

      {/* TTweaks Partner Card */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="relative rounded-2xl overflow-hidden border border-[#1F1F1F] bg-[#111111]">

          {/* Announcement Banner */}
          <div className="bg-[#FF6200]/10 border-b border-[#FF6200]/20 px-6 md:px-10 py-3 flex items-center gap-3">
            <span className="text-[#FF6200] text-xs font-bold uppercase tracking-widest animate-pulse">
              🚨 New Partnership
            </span>
            <span className="text-[#6B6B6B] text-xs">TTweaks × VOID Esports — Official</span>
          </div>

          <div className="px-6 md:px-10 pt-10 pb-12 grid md:grid-cols-2 gap-10 items-center">
            {/* Left: Info */}
            <div>
              {/* Logo */}
              <div className="mb-6">
                <Image
                  src="/partners/ttweaks-logo.webp"
                  alt="TTweaks logo"
                  width={280}
                  height={90}
                  className="object-contain"
                  style={{ filter: "drop-shadow(0 0 20px rgba(255,98,0,0.3))" }}
                />
              </div>

              <p className="text-[#A0A0A0] text-sm leading-relaxed mb-6">
                TTweaks / Tilted Tweaks is officially partnered with VOID Esports.
                Premium PC optimization built for competitive players, creators, and
                grinders who want to get the most out of their setup.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8">
                {[
                  "💻 Premium PC Optimization",
                  "⚡ Built for competitive gamers",
                  "🎮 Designed to make your setup feel smoother",
                  "🌍 Spotted on VOID jerseys at LAN in Germany",
                ].map((item) => (
                  <li key={item} className="text-[#C0C0C0] text-sm flex items-start gap-2">
                    {item}
                  </li>
                ))}
              </ul>

              {/* Discount code */}
              <div className="inline-flex items-center gap-3 bg-[#FF6200]/10 border border-[#FF6200]/30 rounded-lg px-5 py-3 mb-8">
                <span className="text-[#A0A0A0] text-xs uppercase tracking-widest">Use code</span>
                <span className="text-[#FF6200] font-black text-lg tracking-widest">VOID</span>
                <span className="text-[#A0A0A0] text-xs">for</span>
                <span className="text-white font-black text-sm">10% off</span>
                <span className="text-[#444] text-xs">at checkout</span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://tweaks.shop/?via=void"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-[#FF6200] text-black text-sm font-bold rounded-[4px] hover:bg-[#FF7A2A] transition-colors uppercase tracking-wider"
                >
                  Visit tweaks.shop ↗
                </Link>
                <Link
                  href="https://discord.gg/ttweaks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 border border-[#333] text-[#A0A0A0] text-sm font-semibold rounded-[4px] hover:border-[#FF6200] hover:text-[#FF6200] transition-colors uppercase tracking-wider"
                >
                  Join Discord
                </Link>
              </div>
            </div>

            {/* Right: Animated GIF */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-full rounded-xl overflow-hidden border border-[#1F1F1F]">
                <Image
                  src="/partners/ttweaks-glitch.gif"
                  alt="TTweaks animated"
                  width={600}
                  height={200}
                  className="w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="w-full rounded-xl overflow-hidden border border-[#1F1F1F]">
                <Image
                  src="/partners/tweaks-shop-glitch.gif"
                  alt="tweaks.shop animated"
                  width={600}
                  height={200}
                  className="w-full object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6200] to-transparent opacity-40" />
        </div>
      </div>

      {/* Become a partner CTA */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 mt-16 text-center">
        <p className="text-[#444] text-xs uppercase tracking-widest mb-2">Work with us</p>
        <h2 className="text-white font-grotesk font-black text-2xl uppercase mb-4">
          Interested in Partnering?
        </h2>
        <p className="text-[#6B6B6B] text-sm mb-6 max-w-sm mx-auto">
          We work with brands that align with competitive gaming and esports culture.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center px-6 py-3 bg-[#A855F7] text-white text-sm font-bold rounded-[4px] hover:bg-[#9333EA] transition-colors uppercase tracking-wider"
        >
          Get in Touch
        </Link>
      </div>
    </main>
  );
}
