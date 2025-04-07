// ✅ Profile Page: Animal Dashboard with SOAP Timeline and Summary
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function AnimalProfilePage() {
  const { name } = useParams();
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("*")
        .ilike("Name", name.toString())
        .order("SOAP_Date", { ascending: false });

      if (error) {
        console.error("❌ Supabase error:", error);
      } else {
        setEntries(data);
      }
      setLoading(false);
    };

    if (name) fetchData();
  }, [name]);

  const summarizeCase = async () => {
    setSummarizing(true);
    try {
      const soapText = entries.map((e) => e.Full_SOAP).join("\n\n---\n\n");
      const response = await fetch("/api/summarize-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, soapText }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        toast.error("Failed to generate summary.");
      }
    } catch (err) {
      toast.error("Summary error");
    }
    setSummarizing(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-950 text-white">
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

        <button
          disabled={summarizing}
          onClick={summarizeCase}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
        >
          {summarizing ? "🧠 Summarizing..." : "🧠 Summarize Case"}
        </button>

        {summary && (
          <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
            <h2 className="text-xl font-bold mb-2">📋 Case Summary</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-100">{summary}</p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="bg-gray-900 p-4 rounded-xl border border-gray-700"
            >
              <p className="text-sm text-gray-400">📅 {entry.SOAP_Date}</p>
              <p className="text-sm text-gray-200">📍 {entry.Location} | ⚖️ {entry.Weight}</p>
              {entry.Recheck_Due && (
                <p className="text-xs mt-1 text-yellow-400">
                  🔁 Recheck Due: {entry.Recheck_Due}
                </p>
              )}
              <pre className="whitespace-pre-wrap text-sm text-gray-100 mt-3">{entry.Full_SOAP}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
