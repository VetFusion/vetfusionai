// New version of /app/tracker/page.tsx
"use client";

import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";

// ✅ Add TypeScript types to remove red squiggles

type TrackerEntry = {
  Name: string;
  Location: string;
  SOAP_Date: string;
  Recheck_Due?: string;
  Case_Summary?: string;
  Full_SOAP?: string;
};

export default function TrackerPage() {
  const [soapEntries, setSoapEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrackerEntry | null>(null);

  useEffect(() => {
    const fetchTrackerData = async () => {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("Name, Location, SOAP_Date, Recheck_Due, Case_Summary, Full_SOAP")
        .order("SOAP_Date", { ascending: false })
        .limit(50);

      if (error) {
        console.error("🛑 Error fetching tracker data:", error);
      } else {
        setSoapEntries(data as TrackerEntry[]);
      }

      setLoading(false);
    };

    fetchTrackerData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 py-12 px-6">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white">📚 Master Tracker</h1>

      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-300">Loading tracker data...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {soapEntries.map((entry, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 cursor-pointer hover:ring-2 hover:ring-teal-400 transition"
              onClick={() => setSelected(entry)}
            >
              <h2 className="text-xl font-semibold mb-1">{entry.Name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{entry.Location}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📅 {format(new Date(entry.SOAP_Date), "MMM d, yyyy")}
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {entry.Case_Summary}
              </p>
              {entry.Recheck_Due && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  🔁 Recheck Due: {entry.Recheck_Due}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {selected.Name} – Full SOAP
            </h2>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {selected.Full_SOAP}
            </pre>

            <div className="mt-6 text-center">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                onClick={() => setSelected(null)}
              >
                ✖️ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
