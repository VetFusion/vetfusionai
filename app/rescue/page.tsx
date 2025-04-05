"use client";

import Link from "next/link";
import NavBar from "@/components/NavBar";

export default function RescueLandingPage() {
  return (
    <div className="dark bg-gray-950 text-white min-h-screen">
      <NavBar />
      <main className="px-6 py-20 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-teal-400 mb-4 text-center">
          Built for the Animals Who Stay
        </h1>
        <p className="text-lg text-gray-300 text-center mb-12">
          VetFusionAI was designed for sanctuaries, shelters, and rescues where animals live long lives, with complex medical stories.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">🏥 Rescue-Specific Benefits</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Track cases over months or years</li>
              <li>Auto-summarized timelines for chronic conditions</li>
              <li>Built-in recheck reminders and SOAP continuity</li>
              <li>Every SOAP stored, searchable, and readable</li>
              <li>Survives handoffs between relief and staff</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">💡 Real Value for Rescue Teams</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Instantly catch up on any case</li>
              <li>Track treatment responses over time</li>
              <li>Minimize paperwork and missed notes</li>
              <li>Bring structure to scattered history</li>
              <li>Accessible by your whole team, securely</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 shadow-xl mb-20">
          <h2 className="text-2xl font-bold mb-4">✨ Why Rescues Love VetFusionAI</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-gray-200">
            <li>✅ Timeline view for each animal</li>
            <li>✅ Auto-summarized SOAP history</li>
            <li>✅ Recheck tracker and reminders</li>
            <li>✅ One system, multiple caregivers</li>
            <li>✅ Works with your existing flow</li>
            <li>✅ AI-powered clarity in chronic cases</li>
          </ul>
        </div>

        <div className="text-center mb-12">
          <Link
            href="/soap"
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
          >
            🐾 Start Documenting Smarter
          </Link>
          <p className="mt-4 text-gray-500 text-sm">
            Build a case history that lasts as long as the animal does.
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
