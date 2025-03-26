"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TrackerPage() {
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase.from('master_tracker').select('*');
    if (error) console.error('Error fetching:', error);
    else setPatients(data);
  };

  const savePatient = async (patient) => {
    const { error } = await supabase
      .from('master_tracker')
      .update(patient)
      .eq('id', patient.id);

    if (error) alert('❌ Error saving patient.');
    else alert('✅ Patient saved!');
  };

  const handleInputChange = (index, key, value) => {
    setPatients((prevPatients) => {
      const updated = [...prevPatients];
      updated[index][key] = value;
      return updated;
    });
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = [p.Name, p.Location, p.Species, p.Status]
      .filter(Boolean)
      .some((val) => val.toLowerCase().includes(filter.toLowerCase()));
    const matchesStatus = statusFilter === "All" || p.Status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    stable: "bg-green-100 text-green-800 dark:bg-green-700 dark:text-white",
    monitoring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white",
    active: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-white",
    hospice: "bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-white",
  };

  return (
    <div className={`${darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"} min-h-screen p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🐾 VetFusionAI Tracker</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="🔎 Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          {['All', 'Stable', 'Monitoring', 'Active', 'Hospice'].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="overflow-auto rounded-xl border shadow">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-200 dark:bg-gray-800">
            <tr>
              {["Name", "Location", "Species", "Status", "Weight", "SOAP_Date", "Recheck_Due", "Save"].map(h => (
                <th key={h} className="p-2 border text-left">{h.replace("_", " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, idx) => (
              <tr key={patient.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                {['Name', 'Location', 'Species', 'Status', 'Weight', 'SOAP_Date', 'Recheck_Due'].map((key) => (
                  <td key={key} className="p-2 border">
                    <input
                      value={patient[key] || ""}
                      onChange={(e) => handleInputChange(idx, key, e.target.value)}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </td>
                ))}
                <td className="p-2 border">
                  <button
                    onClick={() => savePatient(patient)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    💾 Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
