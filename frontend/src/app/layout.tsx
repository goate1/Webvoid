import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdvancedPageTransition from "@/components/AdvancedPageTransition";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { SupportProvider } from "@/contexts/SupportContext";
import CustomerSupportButton from "@/components/CustomerSupportButton";
import SecurityInit from "@/components/SecurityInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Void Esports",
  description: "Professional Esports Organization",
  metadataBase: new URL("https://voidesports.net"),
  icons: {
    icon: "/logos/new-logo.png",
    apple: [{ url: "/logos/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Void Esports",
    description: "Professional Esports Organization",
    url: "https://voidesports.net",
    siteName: "Void Esports",
    images: [{ url: "/void-banner.jpg", width: 1200, height: 630, alt: "Void Esports" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Void Esports",
    description: "Professional Esports Organization",
    images: ["/void-banner.jpg"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}
        suppressHydrationWarning
      >
        <DebugProvider>
          <OrderProvider>
            <CartProvider>
              <ReviewProvider>
                <SupportProvider>
                  <GlobalErrorBoundary>
                    <SecurityInit>
                      <AdvancedPageTransition>
                        <ScrollToTop />
                        <Navbar />
                        <main className="min-h-screen bg-white">{children}</main>
                        <Footer />
                        <CustomerSupportButton />
                      </AdvancedPageTransition>
                    </SecurityInit>
                  </GlobalErrorBoundary>
                </SupportProvider>
              </ReviewProvider>
            </CartProvider>
          </OrderProvider>
        </DebugProvider>
      </body>
    </html>
  );
}
