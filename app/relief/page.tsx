"use client";

import Link from "next/link";
import NavBar from "@/components/NavBar";

export default function ReliefLandingPage() {
  return (
    <div className="dark bg-gray-950 text-white min-h-screen">
      <NavBar />
      <main className="px-6 py-20 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-teal-400 mb-4 text-center">
          Relief-Ready. Rescue-Tested. AI-Backed.
        </h1>
        <p className="text-lg text-gray-300 text-center mb-12">
          Your SOAPs, summaries, and shift reports — powered by AI and designed to follow you across every case, clinic, and critical moment.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">🧳 For Relief Vets</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>All your SOAPs. All your summaries. All in one place.</li>
              <li>Track patients across clinics</li>
              <li>Export daily reports in one click</li>
              <li>Summarize your day or your shift instantly</li>
              <li>Your own portable clinical memory — built to travel</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">🐾 For Rescues & Sanctuaries</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Chronically under-documented? Not anymore.</li>
              <li>Track SOAPs over time — even across years</li>
              <li>Quick summaries of complex, ongoing cases</li>
              <li>Timeline view for every animal</li>
              <li>Continuity through staff changes or relief help</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 shadow-xl mb-20">
          <h2 className="text-2xl font-bold mb-4">✨ Why VetFusionAI?</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-200">
            <li>✅ AI-powered SOAP & case summaries</li>
            <li>✅ Timeline view per animal</li>
            <li>✅ Recheck reminders & continuity tools</li>
            <li>✅ Multi-hospital tagging (coming soon)</li>
            <li>✅ PDF export for shift reports</li>
            <li>✅ EMR upload/import support</li>
            <li>✅ Works alongside Avimark, Cornerstone, and more</li>
          </ul>
        </div>

        <div className="text-center mb-12">
          <Link
            href="/soap"
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
          >
            🔐 Start for Free
          </Link>
          <p className="mt-4 text-gray-500 text-sm">
            You’ve done the work. Now build the record that remembers it.
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-teal-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
