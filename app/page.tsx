// ✅ Homepage with Animated Testimonials Carousel
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Dr. Rivera",
    title: "Emergency Veterinarian",
    quote:
      "VetFusionAI has revolutionized the way I document and communicate cases during overnight shifts. Total game changer.",
  },
  {
    name: "Dr. Tanaka",
    title: "Relief Veterinarian",
    quote:
      "Fast, intuitive, and accurate. VetFusion keeps my records tight and my sanity intact even on marathon ER days.",
  },
  {
    name: "Dr. Mendez",
    title: "Criticalist, Teaching Hospital",
    quote:
      "Having a medical scribe that understands internal medicine is priceless. VetFusionAI delivers.",
  },
  {
    name: "Dr. Liu",
    title: "Shelter Director, Rescue One",
    quote:
      "Documenting hundreds of cases used to be chaos. VetFusion brought structure, speed, and sanity to our workflow.",
  },
  {
    name: "Dr. Graves",
    title: "Mobile Vet, Rural Outreach",
    quote:
      "No Wi-Fi? No problem. VetFusion drafts my SOAPs while I’m in the truck, syncing later. This is the future.",
  },
  {
    name: "Dr. Feldman",
    title: "Veterinary Internist",
    quote:
      "It keeps my differentials sharp and my notes readable. AI meets medicine the right way here.",
  },
];

const TestimonialCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const current = testimonials[index];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5 }}
        className="text-center px-4"
      >
        <blockquote className="text-lg italic text-gray-300 mb-3">“{current.quote}”</blockquote>
        <p className="text-teal-400 font-semibold">{current.name}</p>
        <p className="text-sm text-gray-400">{current.title}</p>
        <div className="mt-2 text-yellow-400">⭐⭐⭐⭐⭐</div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function HomePage() {
  const [year, setYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setYear(new Date().getFullYear());
    setMounted(true);
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
      {/* HERO SECTION */}
      <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-extrabold text-teal-400 drop-shadow mb-4">VetFusionAI</h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-8">
          AI SOAPs for fast-paced medicine. Built for ER shifts, critical rechecks, and never missing a detail.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl">
          {["/soap", "/tracker", "/relief", "/rescue"].map((path, i) => (
            <Link key={path} href={path}>
              <button className="w-full bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 hover:scale-105">
                {[
                  "📝 SOAP Generator",
                  "📊 Tracker",
                  "🧳 Relief Mode",
                  "🐾 Rescue View",
                ][i]}
              </button>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-teal-300">
          🩺 Real-time clarity for critical patients. Trusted by ER vets, shift docs, and mobile medics.
        </p>
      </div>

      {/* TESTIMONIALS */}
      <div className="relative z-10 w-full max-w-3xl px-4 pt-0 pb-20 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">💬 What Vets Are Saying</h2>
        <div className="bg-gray-800 rounded-xl p-6 shadow-md text-gray-200">
          {mounted && <TestimonialCarousel />}
        </div>
      </div>

      {/* EMAIL SIGNUP */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">📬 Stay in the Loop</h3>
        <p className="text-gray-400 mb-6">Get updates as we roll out new features — no spam, ever.</p>
        <form
          onSubmit={handleEmailSubmit}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full sm:max-w-xs flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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