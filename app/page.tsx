"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format, isBefore, addDays } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

interface TrackerEntry {
  id?: number;
  Name: string;
  Location: string | null;
  SOAP_Date: string | null;
  Recheck_Due: string | null;
  Case_Summary: string | null;
  Full_SOAP: string | null;
  Species?: string | null;
  Status?: string | null;
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
    const { data, error } = await supabase
      .from("master_tracker")
      .select("*")
      .order("SOAP_Date", { ascending: false });

    if (error) {
      console.error("🛑 Supabase fetch error:", error);
    } else {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (d: string | null) => {
    if (!d || isNaN(Date.parse(d))) return "—";
    return format(new Date(d), "MMM d, yyyy");
  };

  const getRecheckColor = (d: string | null) => {
    if (!d || isNaN(Date.parse(d))) return "text-gray-400";
    const date = new Date(d);
    if (isBefore(date, new Date())) return "text-red-600 dark:text-red-400";
    if (isBefore(date, addDays(new Date(), 7))) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
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

  const handleEdit = (entry: TrackerEntry) => {
    setEditEntry({ ...entry });
    setEditMode(true);
  };

  const getSpeciesIcon = (species?: string | null) => {
    if (!species) return "❓";
    const lower = species.toLowerCase();
    if (lower.includes("dog")) return "🐶";
    if (lower.includes("cat")) return "🐱";
    if (lower.includes("rabbit")) return "🐰";
    return "🐾";
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return null;
    const base = "inline-block px-2 py-0.5 rounded-full text-xs font-semibold";
    if (status.toLowerCase() === "critical") return <span className={`${base} bg-red-700 text-white`}>CRITICAL</span>;
    if (status.toLowerCase() === "stable") return <span className={`${base} bg-green-700 text-white`}>Stable</span>;
    if (status.toLowerCase() === "pending") return <span className={`${base} bg-yellow-600 text-white`}>Pending</span>;
    return <span className={`${base} bg-gray-600 text-white`}>{status}</span>;
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-gray-950 text-white overflow-y-auto">
      <Toaster position="top-center" />

      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap gap-4 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name..."
          className="flex-grow px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 shadow"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-300">Loading...</p>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
          {filteredNames.map((name, idx) => {
            const animalEntries = groupedEntries[name];
            const firstEntry = animalEntries[0];
            const isOpen = expanded[name];
            return (
              <div key={idx} className="bg-gray-800 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-2xl font-semibold text-teal-400">
                    <span>{getSpeciesIcon(firstEntry.Species)}</span>
                    <button
                      onClick={() => router.push(`/profile/${firstEntry.Name.toLowerCase()}`)}
                      className="hover:underline"
                    >
                      {firstEntry.Name}
                    </button>
                    {getStatusBadge(firstEntry.Status)}
                  </div>
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }))}
                    className="text-sm text-teal-400 hover:underline"
                  >
                    {isOpen ? "🔼 Hide all SOAPs" : "🔽 Show all SOAPs"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isOpen ? animalEntries : [firstEntry]).map((entry) => (
                    <div key={entry.id}>
                      <div
                        className="bg-gray-900 p-6 rounded-xl border border-gray-700 cursor-pointer hover:ring-2 hover:ring-teal-500"
                        onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                      >
                        <p className="text-sm text-gray-400" title="SOAP Date">📅 {formatDate(entry.SOAP_Date)}</p>
                        <p className="text-sm text-gray-100 font-medium mt-1">{entry.Case_Summary}</p>
                        {entry.Recheck_Due && (
                          <p className={`text-xs mt-1 ${getRecheckColor(entry.Recheck_Due)}`} title="Recheck Due">
                            🔁 Recheck Due: {formatDate(entry.Recheck_Due)}
                          </p>
                        )}
                      </div>
                      <AnimatePresence>
                        {selectedId === entry.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 bg-gray-900 p-4 rounded-xl border border-gray-600 text-sm text-gray-300 leading-relaxed space-y-1">
                              <h2 className="text-lg font-bold mb-2 text-white">🧾 SOAP Details</h2>
                              <pre className="whitespace-pre-wrap font-mono text-[14px] text-gray-200">
                                {entry.Full_SOAP || "No SOAP available."}
                              </pre>
                              <div className="mt-4 flex justify-between">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => router.push(`/profile/${entry.Name.toLowerCase()}`)}
                                  className="text-sm text-teal-400 hover:underline"
                                >
                                  🔍 View Profile
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
              <input
                className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editEntry.Location || ""}
                onChange={(e) => setEditEntry({ ...editEntry, Location: e.target.value })}
              />
            </label>
            <label className="block text-sm">📆 Recheck Due:
              <input
                type="date"
                className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editEntry.Recheck_Due || ""}
                onChange={(e) => setEditEntry({ ...editEntry, Recheck_Due: e.target.value })}
              />
            </label>
            <label className="block text-sm">🧠 Case Summary:
              <textarea
                rows={4}
                className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-600"
                value={editEntry.Case_Summary || ""}
                onChange={(e) => setEditEntry({ ...editEntry, Case_Summary: e.target.value })}
              />
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editEntry?.id) return;
                  const { error } = await supabase
                    .from("master_tracker")
                    .update({
                      Location: editEntry.Location,
                      Recheck_Due: editEntry.Recheck_Due,
                      Case_Summary: editEntry.Case_Summary,
                    })
                    .eq("id", editEntry.id);

                  if (error) {
                    toast.error("❌ Failed to save changes");
                  } else {
                    toast.success("✅ Changes saved");
                    setEditMode(false);
                    fetchData();
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
