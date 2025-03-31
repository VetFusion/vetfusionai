// /app/tracker/page.tsx — Adds collapsible dropdown per animal + working modals
"use client";

import React, { useEffect, useState } from "react";
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
}

export default function TrackerPage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TrackerEntry | null>(null);
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
      .select("*", { count: "exact" })
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

  console.log("🐾 Supabase Data Fetched:", fullData);
  console.log("🔍 All Names:", fullData.map(e => e.Name?.toLowerCase()));
  setEntries(fullData);
  setLoading(false);
};

  useEffect(() => {
    fetchData();
  }, []);

  // 🧹 Auto-cleaner: Log rows with missing SOAP_Date or Name
  useEffect(() => {
    const broken = entries.filter(e => !e.SOAP_Date || !e.Name?.trim());
    if (broken.length) {
      console.warn("🧹 Found broken tracker entries:", broken);
    }
  }, [entries]);

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
    // if (!entry.SOAP_Date) return acc;
    const key = entry.Name.toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const filteredNames = Object.keys(groupedEntries).filter((name) =>
    name.includes(search.toLowerCase()));

  const handleEdit = (entry: TrackerEntry) => {
    setEditEntry(entry);
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    let result;
    if (editEntry.id) {
      result = await supabase
        .from("master_tracker")
        .update({
          SOAP_Date: editEntry.SOAP_Date,
          Recheck_Due: editEntry.Recheck_Due,
          Case_Summary: editEntry.Case_Summary,
          Name: editEntry.Name,
          Location: editEntry.Location,
          Full_SOAP: editEntry.Full_SOAP,
        })
        .eq("id", editEntry.id);
    } else {
      result = await supabase
        .from("master_tracker")
        .insert({
          SOAP_Date: editEntry.SOAP_Date,
          Recheck_Due: editEntry.Recheck_Due,
          Case_Summary: editEntry.Case_Summary,
          Name: editEntry.Name,
          Location: editEntry.Location,
          Full_SOAP: editEntry.Full_SOAP,
        });
    }

    if (!result.error) {
      toast.success("✅ Saved successfully!");
      setEditMode(false);
      fetchData();
    } else {
      toast.error("❌ Error saving changes.");
    }
  };

  const toggleExpanded = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-gray-950 text-white overflow-y-auto">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto mb-6 flex flex-wrap gap-4 items-center">
      <button
          onClick={() => {
            setEditEntry({
              Name: '',
              Location: null,
              SOAP_Date: '',
              Recheck_Due: '',
              Case_Summary: '',
              Full_SOAP: ''
            });
            setEditMode(true);
          }}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
      >
        ➕ New SOAP Entry
      </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name..."
          className="flex-grow px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white shadow"
        />
                <button
          onClick={() => {
            const broken = entries.filter(e => !e.SOAP_Date || !e.Name?.trim());
            console.warn("🧹 Cleaner Triggered — Broken Rows:", broken);
            toast(`🧼 Found ${broken.length} broken rows. Check console.`, { icon: '🧹' });
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
        >
          🧹 Audit Missing Dates</button>
        <button
          onClick={async () => {
            const broken = entries.filter(e => (!e.SOAP_Date || e.SOAP_Date.trim() === '') && e.id);
            if (broken.length === 0) {
              toast('✅ No missing SOAP_Date entries to fix.');
              return;
            }

            const updates = broken.map(row =>
              supabase.from('master_tracker').update({ SOAP_Date: '2025-01-01' }).eq('id', row.id)
            );

            await Promise.all(updates);
            toast.success(`🧼 Fixed ${broken.length} missing dates with placeholder.`);
            fetchData();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          🛠 Fix Missing Dates
        </button>
      </div>
      {loading ? (
        <p className="text-center text-gray-300">Loading...</p>
      ) : (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
          {filteredNames.map((name, idx) => {
            const entries = groupedEntries[name];
            const firstEntry = entries[0];
            const isOpen = expanded[name];
            return (
              <div key={idx} className="bg-gray-800 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-semibold text-white">{entries[0].Name}</h2>
                  <button
                    onClick={() => toggleExpanded(name)}
                    className="text-sm text-teal-400 hover:underline"
                  >
                    {isOpen ? "🔼 Hide all SOAPs" : "🔽 Show all SOAPs"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(isOpen ? entries : [firstEntry]).map((entry, i) => (
                    <div
                      key={i}
                      className="bg-gray-900 p-4 rounded-xl border border-gray-700 cursor-pointer hover:ring-2 hover:ring-teal-500"
                      onClick={() => setSelected(entry)}
                    >
                      <p className="text-sm text-gray-400">📅 {formatDate(entry.SOAP_Date)}</p>
                      <p className="text-sm text-gray-200 mt-1">{entry.Case_Summary}</p>
                      {entry.Recheck_Due && (
                        <p className={`text-xs mt-1 ${getRecheckColor(entry.Recheck_Due)}`}>
                          🔁 Recheck Due: {formatDate(entry.Recheck_Due)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {selected.Name} – Full SOAP
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-200 bg-gray-800 p-4 rounded-xl border border-gray-700">
              {selected.Full_SOAP || "No SOAP available."}
            </pre>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setSelected(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                ✖️ Close
              </button>
              <button
                onClick={() => handleEdit(selected)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {editMode && editEntry && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-white">
              ✏️ Edit {editEntry.Name}
            </h2>
            <div className="space-y-4">
              <input type="text" value={editEntry.Name || ''} onChange={(e) => setEditEntry({ ...editEntry, Name: e.target.value })} placeholder="Name" className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
              <input type="text" value={editEntry.Location || ''} onChange={(e) => setEditEntry({ ...editEntry, Location: e.target.value })} placeholder="Location (optional)" className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
              <input type="date" value={editEntry.SOAP_Date || ''} onChange={(e) => setEditEntry({ ...editEntry, SOAP_Date: e.target.value })} className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
              <input type="date" value={editEntry.Recheck_Due || ''} onChange={(e) => setEditEntry({ ...editEntry, Recheck_Due: e.target.value })} className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
              <textarea placeholder="Case Summary" value={editEntry.Case_Summary || ''} onChange={(e) => setEditEntry({ ...editEntry, Case_Summary: e.target.value })} rows={3} className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
              <textarea placeholder="Full SOAP (optional)" value={editEntry.Full_SOAP || ''} onChange={(e) => setEditEntry({ ...editEntry, Full_SOAP: e.target.value })} rows={6} className="w-full p-2 rounded border border-gray-700 bg-gray-800 text-white" />
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setEditMode(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">✖️ Cancel</button>
              <button onClick={saveEdit} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
