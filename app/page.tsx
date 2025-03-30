"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  // Set dark mode to true by default
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded transition"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
        🐾 VetFusionAI
      </h1>
      <p className="text-xl font-medium mb-12 text-gray-700 dark:text-gray-300 text-center max-w-2xl">
        Building a living, intelligent medical memory for every animal, helping you think smarter, act faster, and never miss a beat.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link href="/soap">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-lg rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">📋 SOAP Generator</h2>
            <p className="text-gray-600 dark:text-gray-300">Generate detailed, accurate SOAP notes powered by AI.</p>
          </div>
        </Link>

        <Link href="/tracker">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-lg rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">🐾 Animal Tracker</h2>
            <p className="text-gray-600 dark:text-gray-300">Monitor, update, and organize animal cases efficiently.</p>
          </div>
        </Link>

        <Link href="/dashboard">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg shadow-lg rounded-xl p-6 hover:scale-105 transition transform duration-300">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">🛠️ Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-300">Access insights and manage your clinic with ease.</p>
          </div>
        </Link>
      </div>

      <footer className="mt-12 text-gray-500 dark:text-gray-400 text-sm">
        Built for veterinarians, by veterinarians © {new Date().getFullYear()} VetFusionAI
      </footer>
    </div>
  );
}