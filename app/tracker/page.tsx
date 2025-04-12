// ✅ VetFusionAI Tracker Dashboard – Recheck Due Alerts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TrackerDashboardPage() {
  const [tracker, setTracker] = useState([]);

  useEffect(() => {
    const fetchTracker = async () => {
      const { data, error } = await supabase
        .from('master_tracker')
        .select('*')
        .order('SOAP_Date', { ascending: false });

      if (!error && data) {
        setTracker(data);
      }
    };
    fetchTracker();
  }, []);

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-white">📊 Recheck Dashboard</h1>
        <p className="text-center text-gray-600 dark:text-gray-300">Tracking patients with upcoming or overdue rechecks.</p>

        <table className="w-full table-auto text-sm mt-6">
          <thead className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Last SOAP</th>
              <th className="px-4 py-2 text-left">Recheck Due</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {tracker.map((entry, idx) => (
              <tr
                key={idx}
                className={`border-b dark:border-gray-700 ${isOverdue(entry.Recheck_Due) ? 'bg-red-100 dark:bg-red-900' : 'bg-white dark:bg-gray-800'}`}
              >
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{entry.Name}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{entry.SOAP_Date}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{entry.Recheck_Due || '—'}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{entry.Location}</td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{entry.Status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
