"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaTwitter,
  FaDiscord,
  FaTwitch,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";
import { socialService, type SocialLink } from "@/lib/socialService";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: FaTwitter,
  discord: FaDiscord,
  twitch: FaTwitch,
  youtube: FaYoutube,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
};

const orgLinks = [
  { name: "Home", href: "/" },
  { name: "Roster", href: "/teams" },
  { name: "Shop", href: "/shop" },
  { name: "News", href: "/news" },
  { name: "About", href: "/about" },
];

const supportLinks = [
  { name: "Contact", href: "/contact" },
  { name: "Track Order", href: "/track-order" },
  { name: "Ambassadors", href: "/ambassadors" },
  { name: "Careers", href: "/careers" },
];

const DEFAULT_SOCIALS: SocialLink[] = [
  { name: "Twitch", url: "https://www.twitch.tv/voidesports2x", icon: "twitch", order: 1, createdAt: {} as never },
  { name: "Twitter", url: "https://x.com/VoidEsports2x", icon: "twitter", order: 2, createdAt: {} as never },
  { name: "Discord", url: "https://discord.gg/ftxyf32wJN", icon: "discord", order: 3, createdAt: {} as never },
];

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const links = await socialService.getAll();
        if (!mounted) return;
        setSocialLinks(links.length > 0 ? links : DEFAULT_SOCIALS);
      } catch {
        if (mounted) setSocialLinks(DEFAULT_SOCIALS);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 pt-16 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="font-grotesk font-black text-xl tracking-widest uppercase text-white mb-4">
              VOID ESPORTS
            </div>
            <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-xs">
              Professional esports organization pushing the boundaries of
              competitive gaming across Fortnite, Rocket League, Rainbow Six, and
              Apex Legends.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-5 mt-6">
              {socialLinks.map((social) => {
                const iconKey = social.icon?.toLowerCase() ?? "";
                const IconComponent = iconMap[iconKey] ?? FaTwitter;
                let url = social.url;
                if (iconKey === "twitter") url = "https://x.com/VoidEsports2x";
                else if (iconKey === "twitch") url = "https://www.twitch.tv/voidesports2x";
                else if (iconKey === "discord") url = "https://discord.gg/ftxyf32wJN";
                return (
                  <Link
                    key={social.id ?? social.name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="text-[#6B6B6B] hover:text-[#A855F7] transition-colors duration-200"
                  >
                    <IconComponent className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Org links */}
          <div>
            <h4 className="font-grotesk font-bold text-xs uppercase tracking-[0.12em] text-[#6B6B6B] mb-5">
              Organization
            </h4>
            <ul className="space-y-3">
              {orgLinks.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-[#9B9B9B] hover:text-white transition-colors duration-150"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-grotesk font-bold text-xs uppercase tracking-[0.12em] text-[#6B6B6B] mb-5">
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-[#9B9B9B] hover:text-white transition-colors duration-150"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8">
          <p className="text-xs text-[#555555]">
            © 2026 Void Esports. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
