"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode") === "true";
    setEnabled(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem("darkMode", newValue);
    document.documentElement.classList.toggle("dark", newValue);
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 p-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-md shadow-md hover:scale-105 transition"
    >
      {enabled ? "🌞 Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
