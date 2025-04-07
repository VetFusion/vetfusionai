// ✅ Tracker Page: Sticky Search, Cleaned AI Summaries, Toggle SOAPs
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format, isBefore, addDays } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

if (typeof window !== "undefined") {
  document.documentElement.classList.add("dark");
}

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

export default function TrackerPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editEntry, setEditEntry] = useState<TrackerEntry | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    let fullData: TrackerEntry[] = [];
    let from = 0;
    const batchSize = 1000;
    let keepGoing = true;

    while (keepGoing) {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("*")
        .order("SOAP_Date", { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("🛑 Supabase fetch error:", error);
        break;
      }

      if (data) {
        fullData = fullData.concat(data);
        keepGoing = data.length === batchSize;
        from += batchSize;
      } else {
        keepGoing = false;
      }
    }

    setEntries(fullData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const extractSummary = (soap?: string | null): string => {
    if (!soap) return "";
    const assessment = soap.match(/🧠\s*\*\*Assessment\*\*:?[\s\r\n]*(.*?)(\n|\*\*|$)/is)?.[1];
    const raw = assessment || soap;
    return raw
      .replace(/(soap|note|plan|assessment|summary|subjective|objective|history|findings|\*\*|\n)+/gi, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/^[^a-zA-Z0-9]+/, "")
      .replace(/[^       .replace(/[^\x20-~      .replace(/[^\x20-\x7E]+/g, "")
      .trim()
      .slice(0, 140);
  };

  const formatDate = (d: string | null) => {
    if (!d || isNaN(Date.parse(d))) return "—";
    return format(new Date(d), "MMM d, yyyy");
  };

  const groupedEntries = entries.reduce((acc: Record<string, TrackerEntry[]>, entry) => {
    const key = entry.Name.toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const filteredNames = Object.keys(groupedEntries).filter((name) =>
    name.toLowerCase().startsWith(search.trim().toLowerCase())
  );

  const saveChanges = async () => {
    if (!editEntry?.id) return;
    const { error } = await supabase
      .from("master_tracker")
      .update({
        Location: editEntry.Location,
        Weight: editEntry.Weight,
        Recheck_Due: editEntry.Recheck_Due,
        Case_Summary: editEntry.Case_Summary,
      })
      .eq("id", editEntry.id);

    if (error) {
      toast.error("❌ Failed to save changes");
      console.error(error);
    } else {
      toast.success("✅ Changes saved");
      setEditMode(false);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-y-auto">
      <Toaster position="top-center" />

      <div className="sticky top-0 z-50 bg-gray-950 py-4 px-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name..."
            className="w-full px-6 py-3 text-lg rounded-xl border border-gray-600 bg-gray-800 text-white shadow"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-300 mt-12">Loading...</p>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto pb-24 pt-6">
          {filteredNames.map((name, idx) => {
            const entries = groupedEntries[name];
            const firstEntry = entries[0];
            const isOpen = expanded[name];
            return (
              <div key={idx} className="bg-gray-800 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <button
                    onClick={() => router.push(`/profile/${firstEntry.Name.toLowerCase()}`)}
                    className="text-2xl font-semibold text-teal-400 hover:underline"
                  >
                    {firstEntry.Name}
                  </button>
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))}
                    className="text-sm text-teal-400 hover:underline"
                  >
                    {isOpen ? "🔼 Hide all SOAPs" : "🔽 Show all SOAPs"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isOpen ? entries : [firstEntry]).map((entry, i) => (
                    <div key={i}>
                      <div
                        className="bg-gray-900 p-4 rounded-xl border border-gray-700 cursor-pointer hover:ring-2 hover:ring-teal-500"
                        onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                      >
                        <p className="text-sm text-gray-200 mt-1 italic line-clamp-2">
                          {extractSummary(entry.Full_SOAP)}
                        </p>
                      </div>
                      {selectedId === entry.id && (
                        <div className="mt-4 bg-gray-900 p-5 rounded-xl border border-gray-700 space-y-4">
                          <h2 className="text-lg font-semibold text-white">📋 Full SOAP for {entry.Name}</h2>
                          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                            {(entry.Full_SOAP ?? '')
                              .replace(/🩺/g, "\n\n🩺")
                              .replace(/📚/g, "\n\n📚")
                              .replace(/🔍/g, "\n\n🔍")
                              .replace(/🧠/g, "\n\n🧠")
                              .replace(/📝/g, "\n\n📝")}
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditEntry(entry)}
                              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setSelectedId(null)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            >
                              ✖️ Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editMode && editEntry && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">✏️ Edit Entry – {editEntry.Name}</h2>
            <label className="block text-sm">📍 Location:
              <input className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" value={editEntry.Location || ''} onChange={(e) => setEditEntry({ ...editEntry, Location: e.target.value })} />
            </label>
            <label className="block text-sm">⚖️ Weight:
              <input className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" value={editEntry.Weight || ''} onChange={(e) => setEditEntry({ ...editEntry, Weight: e.target.value })} />
            </label>
            <label className="block text-sm">📆 Recheck Due:
              <input type="date" className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" value={editEntry.Recheck_Due || ''} onChange={(e) => setEditEntry({ ...editEntry, Recheck_Due: e.target.value })} />
            </label>
            <label className="block text-sm">🧠 Case Summary:
              <textarea rows={4} className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600" value={editEntry.Case_Summary || ''} onChange={(e) => setEditEntry({ ...editEntry, Case_Summary: e.target.value })} />
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditMode(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={saveChanges} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
