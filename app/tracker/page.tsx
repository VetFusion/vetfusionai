"use client";

import { useState, useEffect } from "react";

export default function TrackerPage() {
  const [filter, setFilter] = useState("");
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetch("/data/master-tracker.json")
      .then((res) => res.json())
      .then((data) => setPatients(data));
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = [p.Name, p.Location, p.Species, p.Status]
      .filter(Boolean)
      .some((val) => val.toLowerCase().includes(filter.toLowerCase()));
    const matchesStatus = statusFilter === "All" || (p.Status?.toLowerCase() === statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "stable": return "bg-green-100 text-green-800 dark:bg-green-700 dark:text-white";
      case "monitoring": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white";
      case "active": return "bg-red-100 text-red-800 dark:bg-red-700 dark:text-white";
      case "hospice": return "bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-white";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-white";
    }
  };

  const isOverdue = (recheck) => {
    if (!recheck) return false;
    const today = new Date();
    const date = new Date(recheck);
    return date < today;
  };

  const isSoon = (recheck) => {
    if (!recheck) return false;
    const today = new Date();
    const date = new Date(recheck);
    const diff = (date - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  return (
    <div className={`${darkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"} p-6 space-y-6 min-h-screen transition-colors`}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🐾 VetFusionAI Master Tracker</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="text-sm bg-gray-200 text-black dark:bg-gray-700 dark:text-white px-4 py-1 rounded">{darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded p-2 w-full max-w-md bg-white dark:bg-gray-800 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="All">All Statuses</option>
          <option value="Stable">Stable</option>
          <option value="Monitoring">Monitoring</option>
          <option value="Active">Active</option>
          <option value="Hospice">Hospice</option>
        </select>
      </div>

      <div className="overflow-auto border rounded-xl mt-4 max-h-[80vh]">
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
            <tr>
              {[
                "Name",
                "Location",
                "Species",
                "Status",
                "Weight",
                "SOAP Date",
                "Recheck Due",
                "Current Meds",
                "Case Summary",
              ].map((header) => (
                <th key={header} className="p-2 border text-left bg-gray-100 dark:bg-gray-700 text-xs font-semibold uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p, i) => (
              <tr key={i} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                <td
                  className="p-2 border font-medium text-blue-600 dark:text-blue-300 cursor-pointer hover:underline"
                  onClick={() => setSelectedPatient(p)}
                >
                  {p.Name}
                </td>
                <td className="p-2 border dark:text-white">{p.Location}</td>
                <td className="p-2 border dark:text-white">{p.Species}</td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.Status)}`}>{p.Status}</span>
                </td>
                <td className="p-2 border dark:text-white">{p.Weight}</td>
                <td className="p-2 border dark:text-white">{p["SOAP Date"]}</td>
                <td className={`p-2 border font-semibold ${isOverdue(p["Recheck Due"]) ? "text-red-600" : isSoon(p["Recheck Due"]) ? "text-yellow-600" : "text-gray-700"}`}>{p["Recheck Due"]}</td>
                <td className="p-2 border text-xs text-gray-600 dark:text-gray-200 whitespace-pre-line leading-relaxed">{p["Current Meds"]}</td>
                <td className="p-2 border text-xs text-gray-600 dark:text-gray-200 whitespace-pre-line leading-relaxed">{p["Case Summary"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPatient && (
        <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white dark:bg-gray-900 text-black dark:text-white shadow-lg p-6 overflow-y-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📝 {selectedPatient.Name}'s Profile</h2>
            <button onClick={() => setSelectedPatient(null)} className="text-sm bg-red-500 text-white px-3 py-1 rounded">Close</button>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>📍 Location:</strong> {selectedPatient.Location}</p>
            <p><strong>🐾 Species:</strong> {selectedPatient.Species}</p>
            <p><strong>📊 Status:</strong> {selectedPatient.Status}</p>
            <p><strong>⚖️ Weight:</strong> {selectedPatient.Weight}</p>
            <p><strong>🗓 SOAP Date:</strong> {selectedPatient["SOAP Date"]}</p>
            <p><strong>📅 Recheck Due:</strong> {selectedPatient["Recheck Due"]}</p>
            <p><strong>💊 Medications:</strong></p>
            <p className="whitespace-pre-line leading-relaxed">{selectedPatient["Current Meds"]}</p>
            <p><strong>🧠 Case Summary:</strong></p>
            <p className="whitespace-pre-line leading-relaxed">{selectedPatient["Case Summary"]}</p>
          </div>
          <a
            href={`/animal/${encodeURIComponent(selectedPatient.Name.toLowerCase().replace(/\s+/g, "-"))}`}
            className="mt-6 inline-block text-blue-500 hover:underline text-sm"
          >
            → View Full Profile
          </a>
        </div>
      )}
    </div>
  );
}
