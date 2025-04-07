// ✅ Rescue Page Update with Animation, Testimonial, CTA and File Upload Integration
"use client";

import Link from "next/link";
import { useEffect } from "react";
import FileUploader from "@/components/FileUploader";

export default function RescuePage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold mb-4 text-teal-400 animate-fade-in">🐾 Rescue View</h1>
      <p className="text-xl text-gray-300 max-w-2xl mb-8 animate-fade-in delay-100">
        Designed for sanctuaries and rescues: streamline care, reduce documentation fatigue, and centralize records for every animal.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full mb-10 animate-fade-in delay-200">
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">📁 Lifetime Histories</h3>
          <p className="text-gray-300 text-sm">Track chronic cases over years with searchable, structured SOAPs and summaries.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">📅 Recheck Logic</h3>
          <p className="text-gray-300 text-sm">Never miss a follow-up with AI-predicted recheck timelines and alerts.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">📷 Unified Records</h3>
          <p className="text-gray-300 text-sm">Attach diagnostics, labs, and photos into one central SOAP system.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">👩‍⚕️ Multi-User Access</h3>
          <p className="text-gray-300 text-sm">Staff and volunteers can securely access and update notes as needed.</p>
        </div>
      </div>

      <blockquote className="max-w-3xl italic text-gray-400 mb-10 animate-fade-in delay-300">
        “Finally, a SOAP system that works for rescue medicine. VetFusionAI keeps us focused on care—not paperwork.”<br />
        <span className="block text-sm mt-2 text-gray-500">– Dr. Torres, Medical Director at No-Kill Shelter</span>
      </blockquote>

      <div className="w-full max-w-xl mb-10">
        <FileUploader animalNamePlaceholder="Enter animal name" />
      </div>

      <Link href="/soap">
        <button className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3 rounded-full shadow animate-fade-in delay-400">
          🐕 Start SOAP Note
        </button>
      </Link>
    </div>
  );
}
