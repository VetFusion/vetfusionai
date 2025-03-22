import "../public/output.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "VetFusionAI",
  description: "AI-Powered SOAP Notes for Vets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
