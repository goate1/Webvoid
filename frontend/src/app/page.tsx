"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { newsService, type NewsArticle } from "@/lib/newsService";
import { youtubeService, type YouTubeVideo } from "@/lib/youtubeService";
import { productService, type Product } from "@/lib/productService";

type DisplayArticle = {
  id?: string;
  title: string;
  date: string;
  image: string;
  description: string;
};

const TICKER_TEXT =
  "FORTNITE • ROCKET LEAGUE • RAINBOW SIX • APEX LEGENDS • ";

export default function Home() {
  const [latestNews, setLatestNews] = useState<DisplayArticle[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [storeItems, setStoreItems] = useState<Product[]>([]);

  // ── Data fetching (unchanged logic) ──────────────────────────
  useEffect(() => {
    let mounted = true;

    // News
    (async () => {
      try {
        const articles = await newsService.getAll();
        if (!mounted) return;
        if (articles && articles.length > 0) {
          const latest5 = articles.slice(0, 5).map((article: NewsArticle) => ({
            id: article.id,
            title: article.title,
            date:
              (article.date as unknown as { toDate?: () => Date })?.toDate
                ? (article.date as unknown as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
                : String(article.date ?? ""),
            image: article.image,
            description: article.description,
          }));
          setLatestNews(latest5);
        } else {
          setLatestNews(FALLBACK_NEWS);
        }
      } catch {
        setLatestNews(FALLBACK_NEWS);
      }
    })();

    // YouTube — filter for long-form (4+ min)
    (async () => {
      try {
        const allVideos = await youtubeService.getLatestVideos(50);
        if (!mounted) return;
        let filtered = allVideos.filter((v) => {
          const parts = v.duration.split(":");
          let secs = 0;
          if (parts.length === 3)
            secs =
              (parseInt(parts[0], 10) || 0) * 3600 +
              (parseInt(parts[1], 10) || 0) * 60 +
              (parseInt(parts[2], 10) || 0);
          else if (parts.length === 2)
            secs =
              (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
          return secs >= 240;
        });
        if (filtered.length === 0) filtered = allVideos.slice(0, 5);
        else filtered = filtered.slice(0, 5);
        setYoutubeVideos(filtered);
      } catch {
        // silently ignore
      }
    })();

    // Products (home-page flagged only)
    (async () => {
      try {
        const all = await productService.getAll();
        if (!mounted) return;
        setStoreItems(all.filter((p) => p.displayOnHomePage).slice(0, 5));
      } catch {
        setStoreItems([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── 1. HERO ───────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: "80vh" }}
      >
        {/* Banner background */}
        <Image
          src="/void-banner.jpg"
          alt="VOID Esports banner"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 px-6 max-w-4xl mx-auto">
          <p className="hero-title font-grotesk text-xs uppercase tracking-[0.25em] text-[#A855F7] mb-8">
            Professional Esports Organization
          </p>
          <h1
            className="hero-subtitle font-grotesk font-black uppercase text-white leading-none"
            style={{
              fontSize: "clamp(52px, 11vw, 112px)",
              letterSpacing: "-0.02em",
            }}
          >
            VOID
            <br />
            ESPORTS
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              href="/teams"
              className="void-button"
            >
              MEET THE TEAMS
            </Link>
            <Link
              href="/shop"
              className="void-button-ghost"
            >
              SHOP MERCH
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] text-[#555] uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#555] to-transparent" />
        </div>
      </section>

      {/* ── 2. MARQUEE TICKER ─────────────────────────────────── */}
      <div className="bg-[#0A0A0A] border-y border-white/5 overflow-hidden py-4">
        <div className="marquee-track">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="font-grotesk text-white text-sm uppercase tracking-[0.12em] px-6 flex-shrink-0 select-none"
            >
              {TICKER_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. LATEST NEWS ────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="void-container">
          <div className="flex items-end justify-between mb-12">
            <h2
              className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none"
              style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.02em" }}
            >
              LATEST NEWS
            </h2>
            <Link
              href="/news"
              className="hidden sm:block text-xs uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors border-b border-[#6B6B6B] hover:border-[#0A0A0A] pb-0.5"
            >
              All News →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(latestNews.length > 0 ? latestNews.slice(0, 3) : FALLBACK_NEWS).map(
              (article, i) => (
                <Link
                  key={i}
                  href={article.id ? `/news?id=${article.id}` : "/news"}
                  className="void-card group block overflow-hidden"
                >
                  {/* Image area */}
                  <div className="relative h-44 overflow-hidden bg-[#F5F5F5]">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            "linear-gradient(135deg,#1a1a1a 0%,#0A0A0A 100%)",
                        }}
                      />
                    )}
                  </div>
                  {/* Body */}
                  <div className="p-5">
                    <span className="text-[10px] font-grotesk font-bold uppercase tracking-[0.15em] text-[#A855F7]">
                      VOID ESPORTS
                    </span>
                    <h3 className="font-grotesk font-bold text-[#0A0A0A] mt-2 mb-3 text-base leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#6B6B6B]">{article.date}</p>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── 4. YOUTUBE VIDEOS (if available) ──────────────────── */}
      {youtubeVideos.length > 0 && (
        <section className="bg-[#F5F5F5] py-20 md:py-24">
          <div className="void-container">
            <h2
              className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none mb-12"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em" }}
            >
              LATEST VIDEOS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {youtubeVideos.map((video, i) => (
                <button
                  key={`${video.id}-${i}`}
                  type="button"
                  className="void-card group text-left overflow-hidden"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${video.videoId}`,
                      "_blank"
                    )
                  }
                >
                  <div className="relative aspect-video overflow-hidden bg-[#E5E5E5]">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover"
                      sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,20vw"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-grotesk font-semibold text-[#0A0A0A] text-sm leading-snug line-clamp-2 group-hover:text-[#A855F7] transition-colors">
                      {video.title}
                    </p>
                    <p className="text-[11px] text-[#6B6B6B] mt-1.5">{video.views} views</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. FEATURED STORE ITEMS ───────────────────────────── */}
      {storeItems.length > 0 && (
        <section className="bg-white py-20 md:py-24 border-t border-[#E5E5E5]">
          <div className="void-container">
            <div className="flex items-end justify-between mb-12">
              <h2
                className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em" }}
              >
                FEATURED MERCH
              </h2>
              <Link
                href="/shop"
                className="hidden sm:block text-xs uppercase tracking-[0.1em] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors border-b border-[#6B6B6B] hover:border-[#0A0A0A] pb-0.5"
              >
                Visit Store →
              </Link>
            </div>
            <div
              className={`grid gap-5 ${
                storeItems.length === 1
                  ? "grid-cols-1 max-w-sm"
                  : storeItems.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {storeItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="void-card group overflow-hidden block"
                >
                  <div className="relative h-56 bg-[#F5F5F5] overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E5E5E5] to-[#D4D4D4]" />
                    )}
                    {item.onSale && (
                      <span className="absolute top-3 left-3 bg-[#A855F7] text-white text-[10px] font-grotesk font-bold uppercase tracking-wider px-2 py-1 rounded-[2px]">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-grotesk font-bold text-[#0A0A0A] text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[#A855F7] font-grotesk font-bold text-base">
                        ${(item.salePrice ?? item.price).toFixed(2)}
                      </span>
                      {item.onSale && item.salePrice != null && (
                        <span className="text-[#6B6B6B] text-sm line-through">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. MEET THE TEAMS ─────────────────────────────────── */}
      <section
        className="relative py-28 md:py-40 text-center overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg,#0A0A0A 0%,#111111 60%,rgba(168,85,247,0.06) 100%)",
        }}
      >
        <div className="void-container relative z-10">
          <p className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-[#A855F7] mb-5">
            Compete at the highest level
          </p>
          <h2
            className="font-grotesk font-black uppercase text-white leading-none mb-10"
            style={{
              fontSize: "clamp(44px, 8vw, 88px)",
              letterSpacing: "-0.02em",
            }}
          >
            THE ROSTER
          </h2>
          <Link
            href="/teams"
            className="void-button-ghost"
          >
            MEET THE TEAMS
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Fallback news ─────────────────────────────────────────────
const FALLBACK_NEWS: DisplayArticle[] = [
  {
    title: "VOID'S BIGGEST ANNOUNCEMENT",
    date: "2025-11-04",
    image: "/news/VOID-2-FINAL.png",
    description:
      "Void is excited to announce the signing of VerT, Takii, and Sails to our competitive roster.",
  },
  {
    title: "Void Announces 1v1 Map Challenge Giveaway",
    date: "2025-08-18",
    image: "/news/1v1_map_void.png",
    description:
      "Spend at least 30 minutes in our 1v1 map and enter our giveaway.",
  },
  {
    title: "Void Earns in FNCS Grand Finals",
    date: "2025-08-03",
    image: "/news/FNCS.png",
    description:
      "Void Blu earned over $2500 in FNCS Grands. We are very proud.",
  },
];
