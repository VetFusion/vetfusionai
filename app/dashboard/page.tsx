"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch("/data/master-tracker.json")
      .then((res) => res.json())
      .then((data) => setPatients(data));
  }, []);

  const countByStatus = (status) => patients.filter(p => p.Status?.toLowerCase() === status).length;
  const isOverdue = (recheck) => {
    if (!recheck) return false;
    const date = new Date(recheck);
    return date < new Date();
  };

  const overdueCount = patients.filter(p => isOverdue(p["Recheck Due"]) && p["Recheck Due"] !== "").length;
  const ringwormCount = patients.filter(p => p["Case Summary"]?.toLowerCase().includes("ringworm")).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">📊 VetFusionAI Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
        <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-xl font-semibold shadow">Total: {patients.length}</div>
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-xl font-semibold shadow">Active: {countByStatus("active")}</div>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-xl font-semibold shadow">Monitoring: {countByStatus("monitoring")}</div>
        <div className="bg-purple-100 text-purple-800 px-4 py-3 rounded-xl font-semibold shadow">Hospice: {countByStatus("hospice")}</div>
        <div className="bg-pink-100 text-pink-800 px-4 py-3 rounded-xl font-semibold shadow">Ringworm: {ringwormCount}</div>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/tracker" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm">🐾 Open Tracker</a>
          <a href="/animal/ethel" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm">🔍 View Example Profile</a>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(patients, null, 2)], { type: "application/json" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "vetfusionai_tracker_backup.json";
              link.click();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
          >
            💾 Export Full JSON
          </button>
        </div>
      </div>
    </div>
  );
}
