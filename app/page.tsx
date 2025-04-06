"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

const cases = [
  {
    species: "🐶",
    patient: "6 y/o neutered male mixed breed, presented for collapse and pale gums.",
    findings: "Weak pulses, CRT > 3s, PCV 12%. FAST scan positive for free fluid.",
    summary: "Hypovolemic shock secondary to hemoabdomen (likely splenic rupture). IV fluids started, STAT CBC/Chem, emergent ultrasound pending."
  },
  {
    species: "🐱",
    patient: "12 y/o spayed female DSH, Hx of vomiting + weight loss.",
    findings: "BCS 3/9, T4 elevated, palpable thyroid nodule.",
    summary: "Suspected hyperthyroidism. Recommend methimazole trial and baseline labs."
  },
  {
    species: "🐰",
    patient: "3 y/o rabbit with acute anorexia and lethargy.",
    findings: "Tympanic abdomen, bruxism, HR 280 bpm.",
    summary: "Stasis suspected. Critical care feeding started, Buprenorphine and SQ fluids administered."
  },
];

function RotatingCase() {
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % cases.length);
        setFadeIn(true);
      }, 300);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const current = cases[index];

  return (
    <div className={`w-full transition-opacity duration-300 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}>
      <p className="mb-2">{current.species} <strong>Patient:</strong> {current.patient}</p>
      <p className="mb-2">🩺 <strong>Findings:</strong> {current.findings}</p>
      <p className="mb-2">💡 <strong>SOAP Summary:</strong> {current.summary}</p>
      <p className="text-teal-400 mt-4">🧠 Generated by VetFusionAI in under 10 seconds.</p>
    </div>
  );
}

export default function HomePage() {
  const [year, setYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setYear(new Date().getFullYear());
    setMounted(true);
    document.documentElement.classList.add("dark");
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const { error } = await supabase.from("email_signups").insert([{ email }]);
    if (error) {
      toast.error("Something went wrong. Email not saved.");
    } else {
      toast.success("You're on the list!");
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex flex-col items-center justify-start relative overflow-hidden">
      {/* Starry Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute animate-[pulse_12s_ease-in-out_infinite] top-[20%] left-[10%] w-12 h-12 text-4xl opacity-10">🌟</div>
        <div className="absolute animate-[pulse_15s_ease-in-out_infinite] top-[35%] right-[15%] w-14 h-14 text-4xl opacity-10">🌠</div>
        <div className="absolute animate-[pulse_10s_ease-in-out_infinite] bottom-[10%] left-[25%] w-16 h-16 text-4xl opacity-10">✨</div>
        <div className="absolute animate-[pulse_18s_ease-in-out_infinite] top-[60%] right-[5%] w-16 h-16 text-4xl opacity-10">💫</div>
        <div className="absolute animate-[pulse_20s_ease-in-out_infinite] bottom-[5%] right-[20%] w-16 h-16 text-4xl opacity-10">🌌</div>
      </div>

      {/* HERO SECTION */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 py-16">
        <Image
          src="/data/vetfusion-logo.png"
          alt="VetFusionAI Logo"
          width={240}
          height={240}
          unoptimized
          priority
          className="object-contain rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800 mb-8"
        />

        <h1 className="text-5xl md:text-7xl font-extrabold text-teal-400 drop-shadow mb-4 animate-fade-in-up">
          VetFusionAI
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl animate-fade-in-up delay-100 mb-10">
          AI SOAPs for fast-paced medicine. Built for ER shifts, critical rechecks, and never missing a detail.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl px-4 animate-fade-in-up delay-200">
          <Link href="/soap">
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 hover:scale-105">
              📝 SOAP Generator
            </button>
          </Link>
          <Link href="/tracker">
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 hover:scale-105">
              📊 Tracker
            </button>
          </Link>
          <Link href="/relief">
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 hover:scale-105">
              🧳 Relief Mode
            </button>
          </Link>
          <Link href="/rescue">
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 hover:scale-105">
              🐾 Rescue View
            </button>
          </Link>
        </div>

        <p className="mt-12 text-teal-300 text-sm animate-fade-in-up delay-300">
          🩺 Real-time clarity for critical patients. Trusted by ER vets, shift docs, and mobile medics.
        </p>
      </div>

      {/* MINI CASE SNAPSHOT */}
      <div className="relative z-10 w-full max-w-4xl px-4 pb-20 text-center animate-fade-in-up delay-400">
        <h2 className="text-2xl font-semibold text-white mb-4">⚡ Mini Case Snapshot</h2>
        <div className="bg-gray-800 rounded-xl p-6 shadow-md text-left text-sm text-gray-200 min-h-[200px] overflow-hidden relative">
          {mounted && <RotatingCase />}
        </div>
      </div>

      {/* EMAIL SIGNUP */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">📬 Stay in the Loop</h3>
        <p className="text-gray-400 mb-6">Get updates as we roll out new features — no spam, ever.</p>
        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full sm:w-auto flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2 rounded-lg shadow"
          >
            Notify Me
          </button>
        </form>
      </div>

      {/* FOOTER */}
      {mounted && (
        <footer className="bg-gray-900 text-gray-400 text-center text-sm py-6 w-full z-10">
          Built for emergency, relief, and real-world veterinary medicine © {year} VetFusionAI
        </footer>
      )}
    </div>
  );
}