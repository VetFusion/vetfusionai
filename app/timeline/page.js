// ✅ VetFusionAI Timeline View – SOAP + Attachments
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TimelinePage() {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [chartData, setChartData] = useState([]);

  const fetchTimeline = async () => {
    setLoading(true);
    const { data: soaps } = await supabase
      .from('master_tracker')
      .select('*')
      .eq('Name', name)
      .order('SOAP_Date', { ascending: false });

    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('Linked_Animal', name)
      .order('Uploaded_At', { ascending: false });

    setEntries(soaps || []);
    const weights = (soaps || []).map(s => ({
      date: s.SOAP_Date,
      weight: parseFloat((s.Weight || '').replace(/[^0-9.]/g, '')) || null
    })).filter(d => d.weight);
    setChartData(weights);
    setFiles(attachments || []);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {chartData.length > 0 && (
        <div className="mb-10 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">📈 Weight Trend</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            {chartData.map((point, i) => (
              <li key={i}>📅 {point.date}: <strong>{point.weight} lbs</strong></li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end mb-4">
        <button
          onClick={async () => {
            const context = [
                ...entries.map(e => `${e.SOAP_Date || 'No Date'}\n${e.Full_SOAP || ''}`),
                ...files.map(f => `File: ${f.File_Name}`)
              ].join('\n---\n');
              

              const res = await fetch('/api/generate-soap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  promptType: 'timeline_summary',
                  model: 'gpt-4-turbo',
                  previousSOAPs: [context]
                })
              });
              const data = await res.json();
                          setSummary(data.soapNote);
            const blob = new Blob([data.soapNote], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${name}_timeline_summary.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          🧠 Summarize Timeline
        </button>
      </div>
      <h1 className="text-4xl font-bold text-center mb-6">📅 Timeline View</h1>

      {summary && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🧠 Timeline Summary</h2>
          <button
            onClick={() => navigator.clipboard.writeText(summary)}
            className="absolute top-3 right-4 text-xs bg-yellow-300 text-yellow-900 px-2 py-1 rounded hover:bg-yellow-400"
          >📋 Copy</button>
          <pre className="whitespace-pre-wrap text-sm text-yellow-900 mt-2">{summary}</pre>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          className="w-full border p-2 rounded"
          placeholder="Enter Animal Name (case sensitive)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={fetchTimeline}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          🔍 View Timeline
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {entries.length === 0 && files.length === 0 && !loading && (
        <p className="text-center text-gray-400">No data found for that animal.</p>
      )}

      {entries.map((e, i) => (
        <div key={`soap-${i}`} className="bg-white border rounded-lg shadow p-4 mb-4">
          <p className="text-sm text-gray-500">📅 {e.SOAP_Date}</p>
          <p className="font-semibold text-gray-800">📝 SOAP Note</p>
          <pre className="whitespace-pre-wrap text-gray-700 text-sm mt-2">{e.Full_SOAP}</pre>
        </div>
      ))}

      {files.map((f, i) => (
        <div key={`file-${i}`} className="bg-indigo-50 border-l-4 border-indigo-400 rounded p-4 mb-4">
          <p className="text-sm text-gray-500">📎 Uploaded: {new Date(f.Uploaded_At).toLocaleDateString()}</p>
          <p className="font-semibold">📂 {f.File_Name}</p>
          <a
            href={f.File_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm mt-2 inline-block"
          >
            🔗 View File
          </a>
        </div>
      ))}
    </div>
  );
}
