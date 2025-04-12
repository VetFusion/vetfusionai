'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Page() {
  const cards = [
    {
      title: '✨ Generate SOAP',
      href: '/soap',
      description: 'AI-powered SOAP creation with real clinical reasoning and history integration.',
    },
    {
      title: '📋 Manual SOAP Entry',
      href: '/soap',
      description: 'Paste structured SOAPs for past patients or field notes. Perfect for relief vets.',
    },
    {
      title: '📥 Bulk Import',
      href: '/import',
      description: 'Upload .docx SOAP files. AI parses and preps them for review + submission.',
    },
    {
      title: '📊 Tracker Dashboard',
      href: '/tracker',
      description: 'View saved SOAPs, upcoming rechecks, and patient continuity data.',
    },
    {
      title: '🧬 Patient Timeline (Coming Soon)',
      href: '#',
      description: 'Visualize chronic case progression and treatment efficacy over time.',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-950 px-6 py-16">
      {/* 🧠 HERO SECTION */}
      <section className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-4">
          ✨ Start Saving Lives with VetFusionAI
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Built for veterinarians, rescue groups, and relief professionals.
        </p>
        <Link
          href="/soap"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow transition"
        >
          🚀 Launch SOAP Generator
        </Link>
      </section>

      {/* 📦 FEATURE CARD GRID */}
      <div className="max-w-5xl mx-auto text-center">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/30 dark:bg-gray-800/40 p-6 rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.02] transition-all"
            >
              <Link href={card.href}>
                <div className="cursor-pointer">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{card.title}</h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 text-sm text-gray-500 dark:text-gray-500">
          Powered by OpenAI, Supabase, and your clinical wisdom.
        </p>
      </div>
    </main>
  );
}
