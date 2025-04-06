"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TrackerPage() {
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("master_tracker").select("*");
      if (!error) setEntries(data);
    };
    fetchData();
  }, []);

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setEditMode(true);
  };

  const saveChanges = async () => {
    const { error } = await supabase.from("master_tracker").update(editEntry).eq("id", editEntry.id);
    if (!error) {
      setEntries((prev) => prev.map((e) => (e.id === editEntry.id ? editEntry : e)));
      setEditMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-teal-400 mb-6">📊 Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold">{entry.Name}</h2>
            <p>📍 <strong>Location:</strong> {entry.Location}</p>
            <p>⚖️ <strong>Weight:</strong> {entry.Weight}</p>
            <p>📆 <strong>Recheck Due:</strong> {entry.Recheck_Due}</p>
            <p>🧠 <strong>Summary:</strong> {entry.Case_Summary}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setSelected(entry)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded">🔍 View</button>
              <button onClick={() => handleEdit(entry)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded">✏️ Edit</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-200">
                  {(selected?.Full_SOAP ?? '').trim().length > 0
                    ? selected.Full_SOAP
                    : 'No SOAP available.'}
                </pre>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-between">
              <button onClick={() => setSelected(null)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">✖️ Close</button>
              <button onClick={() => handleEdit(selected)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">✏️ Edit</button>
            </div>
          </div>
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
