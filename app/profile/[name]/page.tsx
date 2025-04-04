"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format, isBefore, addDays } from "date-fns";
import toast from "react-hot-toast";

interface TrackerEntry {
  id?: number;
  Name: string;
  Location: string | null;
  SOAP_Date: string | null;
  Recheck_Due: string | null;
  Case_Summary: string | null;
  Full_SOAP: string | null;
  Weight?: string | null;
}

export default function AnimalProfilePage() {
  const { name } = useParams();
  const router = useRouter();
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("*")
        .ilike("Name", name.toString())
        .order("SOAP_Date", { ascending: false });

      if (error) {
        console.error("🐾 Supabase fetch error:", error);
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };
    if (name) fetchData();
  }, [name]);

  const getRecheckColor = (d: string | null) => {
    if (!d || isNaN(Date.parse(d))) return "text-gray-400";
    const date = new Date(d);
    if (isBefore(date, new Date())) return "text-red-500";
    if (isBefore(date, addDays(new Date(), 3))) return "text-yellow-500";
    return "text-green-500";
  };

  const summarizeCase = async () => {
    setSummarizing(true);
    try {
      const fullSOAPs = entries.map(e => e.Full_SOAP).join("\n\n---\n\n");
      const response = await fetch("/api/summarize-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, soapText: fullSOAPs }),
      });

      const data = await response.json();
      setSummary(data.summary || "No summary generated.");
    } catch (err) {
      toast.error("Failed to summarize case.");
      console.error(err);
    }
    setSummarizing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast.success("📋 Summary copied to clipboard");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-950 text-white transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🐾 {name}</h1>
          <button
            onClick={() => router.push("/tracker")}
            className="text-teal-400 hover:underline"
          >
            ← Back to Tracker
          </button>
        </div>

        {loading ? (
          <p className="text-gray-300">Loading SOAPs...</p>
        ) : (
          <>
            <div className="mb-6">
              <button
                disabled={summarizing}
                onClick={summarizeCase}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
              >
                {summarizing ? "🧠 Summarizing..." : "🧠 Summarize Case"}
              </button>

              {summarizing && (
                <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300">
                  🧠 Generating summary... please wait.
                </div>
              )}

              {summary && (
                <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold mb-2">📋 Case Summary</h2>
                    <button
                      onClick={copyToClipboard}
                      className="text-sm text-teal-400 hover:underline ml-4"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-gray-100">{summary}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {entries.map((entry, idx) => (
                <div key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <p className="text-sm text-gray-400">📅 {entry.SOAP_Date}</p>
                  <p className="text-sm text-gray-200">📍 {entry.Location} | ⚖️ {entry.Weight}</p>
                  {entry.Recheck_Due && (
                    <p className={`text-xs mt-1 ${getRecheckColor(entry.Recheck_Due)}`}>
                      🔁 Recheck Due: {format(new Date(entry.Recheck_Due), "MMM d, yyyy")}
                    </p>
                  )}
                  <pre className="whitespace-pre-wrap text-sm text-gray-100 mt-3">{entry.Full_SOAP}</pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
