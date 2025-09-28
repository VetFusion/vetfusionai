// app/layout.js
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import React from "react";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// Optional: Vercel Snippet, guarded by env (JS-safe: no type annotations)
let SnippetComp = null;
try {
  // optional import; won't crash if package isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  SnippetComp = require("@vercel/snippet").Snippet;
} catch {
  SnippetComp = null;
}

export const metadata = {
  title: "VetFusionAI",
  description: "AI SOAPs for critical care, fieldwork, and everyday medicine",
  metadataBase: new URL("https://vetfusionai.com"),
  openGraph: {
    title: "VetFusionAI - AI SOAP Generator for Vets",
    description: "Powerful AI-generated SOAP notes tailored to your patients. Built for ER, relief, and rescue.",
    url: "https://vetfusionai.com",
    siteName: "VetFusionAI",
    images: [{ url: "https://vetfusionai.com/logo.webp", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VetFusionAI - Smart SOAPs for Real-World Veterinary Care",
    description: "Field-tested AI SOAPs. Real-time case tracking. Relief-ready tools.",
    images: ["https://vetfusionai.com/logo.webp"],
  },
};

export default function RootLayout({ children }) {
  const snippetId = process.env.NEXT_PUBLIC_VERCEL_SNIPPET_ID;
  const showSnippet = !!snippetId && process.env.NODE_ENV === "production" && !!SnippetComp;

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Fonts preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400&display=swap"
          rel="stylesheet"
        />
        {/* Google Analytics only in production */}
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-MP6LCYK3XB"
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-MP6LCYK3XB');
              `}
            </Script>
          </>
        )}
      </head>

      <body className="font-sans antialiased bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300">
        <Toaster position="top-center" />

        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 shadow-md py-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <Link href="/" className="text-2xl font-extrabold text-teal-400 tracking-tight hover:text-white transition">
              VetFusion<span className="text-white">AI</span>
            </Link>
            <nav className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 text-sm font-medium">
              <Link href="/soap" className="bg-gray-800 hover:bg-teal-600 px-4 py-2 rounded-md text-white transition-all shadow-sm">
                📝 SOAPs
              </Link>
              <Link href="/tracker" className="bg-gray-800 hover:bg-teal-600 px-4 py-2 rounded-md text-white transition-all shadow-sm">
                📊 Tracker
              </Link>
              <Link href="/relief" className="bg-gray-800 hover:bg-teal-600 px-4 py-2 rounded-md text-white transition-all shadow-sm">
                🧳 Relief
              </Link>
              <Link href="/rescue" className="bg-gray-800 hover:bg-teal-600 px-4 py-2 rounded-md text-white transition-all shadow-sm">
                🐾 Rescue
              </Link>
              <Link href="#login" className="bg-gray-800 hover:bg-teal-600 px-4 py-2 rounded-md text-white transition-all shadow-sm">
                🔐 Login
              </Link>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-80px)]">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-950 text-gray-500 text-center text-sm py-4 border-t border-gray-800">
          Field-tested AI SOAPs. Fast, clear, and built for practice. © {new Date().getFullYear()} VetFusionAI
        </footer>

        {/* Optional Vercel Snippet (only if you set NEXT_PUBLIC_VERCEL_SNIPPET_ID) */}
        {showSnippet ? <SnippetComp id={snippetId} /> : null}
      </body>
    </html>
  );
}
