// ✅ Enhanced layout.js with polished sticky nav buttons, AI tagline, and placeholders
import "../public/output.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Link from "next/link";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  title: "VetFusionAI",
  description: "AI SOAPs for critical care, fieldwork, and everyday medicine",
  metadataBase: new URL("https://vetfusionai.com"),
  openGraph: {
    title: "VetFusionAI - AI SOAP Generator for Vets",
    description:
      "Powerful AI-generated SOAP notes tailored to your patients. Built for ER, relief, and rescue.",
    url: "https://vetfusionai.com",
    siteName: "VetFusionAI",
    images: [
      {
        url: "https://vetfusionai.com/logo.webp",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VetFusionAI - Smart SOAPs for Real-World Veterinary Care",
    description:
      "Field-tested AI SOAPs. Real-time case tracking. Relief-ready tools.",
    images: ["https://vetfusionai.com/logo.webp"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Analytics Tag */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MP6LCYK3XB"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MP6LCYK3XB');
            `,
          }}
        />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="font-sans antialiased bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300">
        <Toaster position="top-center" />

        {/* Sticky Top Nav */}
        <header className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800 shadow-md py-3 px-4 sm:px-6 flex flex-wrap justify-between items-center gap-4">
          <Link href="/" className="text-2xl font-extrabold text-teal-400 tracking-tight hover:text-white transition duration-300">
            VetFusion<span className="text-white">AI</span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-2 sm:gap-3 text-sm font-medium">
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
        </header>

        <main className="min-h-[calc(100vh-80px)]">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-950 text-gray-500 text-center text-sm py-4 border-t border-gray-800">
          Field-tested AI SOAPs. Fast, clear, and built for practice. © {new Date().getFullYear()} VetFusionAI
        </footer>
      </body>
    </html>
  );
}
