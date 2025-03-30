"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    setYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-4">
      {/* Fancy Animated Background Paw Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute animate-[pulse_12s_ease-in-out_infinite] top-[20%] left-[10%] w-12 h-12 text-4xl opacity-10">🐾</div>
        <div className="absolute animate-[pulse_15s_ease-in-out_infinite] top-[35%] right-[15%] w-14 h-14 text-4xl opacity-10">🐾</div>
        <div className="absolute animate-[pulse_10s_ease-in-out_infinite] bottom-[10%] left-[25%] w-16 h-16 text-4xl opacity-10">🐾</div>
        <div className="absolute animate-[pulse_18s_ease-in-out_infinite] top-[60%] right-[5%] w-16 h-16 text-4xl opacity-10">🐾</div>
        <div className="absolute animate-[pulse_20s_ease-in-out_infinite] bottom-[5%] right-[20%] w-16 h-16 text-4xl opacity-10">🐾</div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded transition"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Logo */}
      {mounted && (
        <div className="mb-6 z-10 animate-fade-in">
          <Image
            src="/logo-enhanced.png"
            alt="VetFusionAI Logo"
            width={180}
            height={180}
            className="rounded-xl shadow-2xl transition-transform duration-700 hover:scale-110 border-4 border-white dark:border-gray-800"
          />
        </div>
      )}

      <h1 className="text-6xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 text-center z-10 tracking-tight">
        🐾 VetFusionAI
      </h1>
      <p className="text-2xl font-medium mb-12 text-gray-700 dark:text-gray-300 text-center max-w-2xl z-10">
        Building a living, intelligent medical memory for every animal, helping you think smarter, act faster, and never miss a beat.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        <Link href="/soap">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">📋 SOAP Generator</h2>
            <p className="text-gray-600 dark:text-gray-300">Generate detailed, accurate SOAP notes powered by AI.</p>
          </div>
        </Link>

        <Link href="/tracker">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">🐾 Animal Tracker</h2>
            <p className="text-gray-600 dark:text-gray-300">Monitor, update, and organize animal cases efficiently.</p>
          </div>
        </Link>

        <Link href="/dashboard">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">🛠️ Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-300">Access insights and manage your clinic with ease.</p>
          </div>
        </Link>
      </div>

      <footer className="mt-12 text-gray-500 dark:text-gray-400 text-sm z-10">
        Built for veterinarians, by veterinarians © {year ?? "..."} VetFusionAI
      </footer>
    </div>
  );
}
