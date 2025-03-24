import "../public/output.css";
import { Geist, Geist_Mono } from "next/font/google";

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
  description: "AI-Powered Veterinary SOAP Notes - Built for Veterinarians, by Veterinarians",
  metadataBase: new URL("https://vetfusionai.com"),
  openGraph: {
    title: "VetFusionAI - AI-Powered Veterinary SOAP Notes",
    description:
      "Efficiently create detailed veterinary SOAP notes using advanced AI. Built for veterinarians, by veterinarians.",
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
    title: "VetFusionAI - AI Veterinary SOAP Notes",
    description: "Create accurate veterinary SOAP notes in seconds with VetFusionAI.",
    images: ["https://vetfusionai.com/logo.webp"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300">
        {children}
      </body>
    </html>
  );
}
