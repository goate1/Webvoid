"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import CartIcon from "./CartIcon";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Roster", href: "/teams" },
  { name: "Shop", href: "/shop" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Hide navbar during checkout
  const isCheckoutActive = pathname?.includes("/checkout");
  if (isCheckoutActive) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-[#E5E5E5] z-[100] h-16">
      <nav
        className="max-w-[1280px] mx-auto h-full flex items-center justify-between px-6 md:px-12"
        ref={menuRef}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-grotesk font-black text-[#0A0A0A] text-lg tracking-widest uppercase hover:text-[#A855F7] transition-colors duration-200 flex-shrink-0"
        >
          VOID ESPORTS
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-sm uppercase tracking-[0.05em] font-medium pb-0.5 transition-colors duration-200 ${
                  active ? "text-[#0A0A0A]" : "text-[#6B6B6B] hover:text-[#0A0A0A]"
                }`}
              >
                {item.name}
                {active && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#A855F7]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CartIcon />
          <Link
            href="/shop"
            className="hidden lg:inline-flex items-center px-4 py-2 bg-[#0A0A0A] text-white text-sm font-semibold rounded-[4px] hover:bg-[#A855F7] transition-colors duration-200 uppercase tracking-[0.05em]"
          >
            Shop Now
          </Link>
          {/* Hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E5E5E5] animate-slideDown shadow-sm">
          <div className="max-w-[1280px] mx-auto px-6 py-5 flex flex-col gap-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 text-sm uppercase tracking-[0.05em] font-medium border-b border-[#F5F5F5] last:border-0 transition-colors ${
                    active ? "text-[#A855F7]" : "text-[#0A0A0A]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex items-center justify-center py-3 bg-[#0A0A0A] text-white text-sm font-semibold rounded-[4px] hover:bg-[#A855F7] transition-colors uppercase tracking-[0.05em]"
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
