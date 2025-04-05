"use client";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow">
      <Link href="/" className="text-xl font-bold text-teal-400">
        VetFusionAI
      </Link>
      <div className="flex gap-6">
        <Link href="/soap" className="hover:text-teal-300">
          SOAP Generator
        </Link>
        <Link href="/tracker" className="hover:text-teal-300">
          Tracker
        </Link>
        <Link href="/relief" className="hover:text-teal-300">
          Relief Vets
        </Link>
      </div>
    </nav>
  );
}
