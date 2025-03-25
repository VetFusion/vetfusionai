"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white py-10 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-4xl text-center space-y-10 animate-fade-in">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl animate-bounce">🐾</div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-blue-600 bg-clip-text text-transparent">VetFusionAI</h1>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300 max-w-2xl animate-fade-in-slow">
            AI-powered SOAP notes, patient tracking, and dashboards — built for veterinarians, by veterinarians.
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white/40 dark:bg-gray-800/50 shadow-xl rounded-xl backdrop-blur-xl p-6 sm:p-8 space-y-6 border border-white/20 dark:border-gray-700 animate-fade-in">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">✨ What would you like to do?</h2>
            <div className="grid gap-4">
              <a
                href="/soap"
                className="block w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                ✍️ Generate a New SOAP Note — Fast, Clear, AI-Enhanced
              </a>
              <a
                href="/tracker"
                className="block w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                📋 View, Edit & Save the Full Patient Tracker
              </a>
              <a
                href="/dashboard"
                className="block w-full px-6 py-4 bg-gradient-to-r from-gray-700 to-black text-white text-lg font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                📊 Real-Time Dashboard of Patient Activity
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              fetch("/data/master-tracker.json")
                .then((res) => res.json())
                .then((data) => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "vetfusionai_updated_tracker.json";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
            }}
            className="inline-block mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-full shadow transition duration-200"
          >
            💾 Save All Tracker Changes
          </button>
        </div>

        <footer className="mt-12 text-xs text-gray-500 dark:text-gray-400">
          Version 1.0 • Last updated {new Date().toLocaleDateString()}<br />
          <span className="italic">Crafted with 💚 by Delta Rescue</span>
        </footer>
      </div>
    </main>
  );
}
