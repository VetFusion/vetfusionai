"use client";

import SOAPGenerator from "../components/SOAPGenerator";
import DarkModeToggle from "../components/DarkModeToggle";
import ClientOnly from "../components/ClientOnly";

export default function Home() {
  return (
    <main className="min-h-screen p-10 bg-white text-black dark:bg-gray-900 dark:text-white transition-all duration-300">
      <ClientOnly>
        <DarkModeToggle />
      </ClientOnly>
      <SOAPGenerator />
    </main>
  );
}

