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
      "Building a living, intelligent medical memory for every animal, helping you think smarter, act faster, and never miss a beat.",
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
    description:
      "Building a living, intelligent medical memory for every animal, helping you think smarter, act faster, and never miss a beat.",
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
        {children}
      </body>
    </html>
  );
}
