// ✅ Relief Page Update with Animation, Testimonial, CTA
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ReliefPage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold mb-4 text-teal-400 animate-fade-in">🧳 Relief Mode</h1>
      <p className="text-xl text-gray-300 max-w-2xl mb-8 animate-fade-in delay-100">
        Fast, focused SOAP generation for relief veterinarians. Hit the ground running with instant case context and smart summaries.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full mb-10 animate-fade-in delay-200">
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">🔍 Instant Context</h3>
          <p className="text-gray-300 text-sm">Access SOAP timelines and summaries the moment you enter a patient name.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">⚡ Generate on Shift</h3>
          <p className="text-gray-300 text-sm">Produce detailed SOAPs in seconds—perfect for fast-paced environments.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">📋 Leave Nothing Behind</h3>
          <p className="text-gray-300 text-sm">Ensure accurate handoffs with AI-generated summaries and structured rechecks.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">📱 Mobile Friendly</h3>
          <p className="text-gray-300 text-sm">Access and contribute from any device—no downloads or installs needed.</p>
        </div>
      </div>

      <blockquote className="max-w-3xl italic text-gray-400 mb-10 animate-fade-in delay-300">
        “Having an AI medical scribe that understands internal medicine? Total game-changer for a relief doc bouncing between clinics.”<br />
        <span className="block text-sm mt-2 text-gray-500">– Dr. Morgan, Relief Veterinarian</span>
      </blockquote>

      <Link href="/soap">
        <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-full shadow animate-fade-in delay-400">
          🚀 Launch SOAP Generator
        </button>
      </Link>
    </div>
  );
}
