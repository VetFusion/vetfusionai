"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

export default function SOAPGenerator() {
  const [signalment, setSignalment] = useState("");
  const [history, setHistory] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [generatedSOAP, setGeneratedSOAP] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [noteHistory, setNoteHistory] = useState([]);

  const generateSOAP = async () => {
    setLoading(true);
    const response = await fetch("/api/generate-soap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalment, history, clinicalFindings, assessment, plan }),
    });

    const data = await response.json();
    setGeneratedSOAP(data.soapNote);

    setNoteHistory(prevHistory => [
      { timestamp: new Date().toLocaleString(), note: data.soapNote },
      ...prevHistory,
    ]);

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSOAP);
    alert("SOAP Note copied to clipboard!");
  };

  const saveAsPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(generatedSOAP, 180);
    doc.text(lines, 10, 10);
    doc.save("SOAP-Note.pdf");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4 sm:px-6 md:px-8">
      <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">🐾 VetFusionAI</h1>
      <p className="text-xl font-medium mb-6 text-gray-700 dark:text-gray-300">
        AI-Powered SOAP Notes <span className="font-semibold">Built for Veterinarians, by Veterinarians</span>
      </p>

      <div className="w-full max-w-2xl bg-white/30 dark:bg-gray-800/40 shadow-xl rounded-xl backdrop-blur-md p-6 sm:p-8 space-y-4">
        <input
          className="w-full p-3 rounded-lg bg-white/80 dark:bg-gray-700 placeholder-gray-600 dark:placeholder-gray-300 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          placeholder="🐶 Signalment (Age, Breed, Sex, etc.)"
          value={signalment}
          onChange={(e) => setSignalment(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg bg-white/80 dark:bg-gray-700 placeholder-gray-600 dark:placeholder-gray-300 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          placeholder="📚 History"
          value={history}
          onChange={(e) => setHistory(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg bg-white/80 dark:bg-gray-700 placeholder-gray-600 dark:placeholder-gray-300 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          placeholder="🔍 Clinical Findings"
          value={clinicalFindings}
          onChange={(e) => setClinicalFindings(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg bg-white/80 dark:bg-gray-700 placeholder-gray-600 dark:placeholder-gray-300 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          placeholder="🧠 Assessment"
          value={assessment}
          onChange={(e) => setAssessment(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg bg-white/80 dark:bg-gray-700 placeholder-gray-600 dark:placeholder-gray-300 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          placeholder="📝 Plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        />

        <button
          className={`w-full py-3 font-semibold rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:scale-105 shadow-md transition-transform duration-300 text-sm sm:text-base ${loading && 'opacity-60 cursor-not-allowed'}`}
          onClick={generateSOAP}
          disabled={loading}
        >
          {loading ? "🌀 Generating..." : "✨ Generate SOAP Note"}
        </button>

        <button
          className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg shadow transition"
          onClick={() => setShowHistory(true)}
        >
          📚 View Note History
        </button>
      </div>

      {generatedSOAP && (
        <div className="mt-8 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">📋 Generated SOAP Note</h2>
          <div className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{generatedSOAP}</div>

          <div className="flex gap-4 justify-center mt-6">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg shadow-md transition text-sm sm:text-base"
              onClick={copyToClipboard}
            >
              📋 Copy to Clipboard
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-5 rounded-lg shadow-md transition text-sm sm:text-base"
              onClick={saveAsPDF}
            >
              📄 Save as PDF
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="mt-8 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📚 SOAP Note History</h2>
            <button
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700"
              onClick={() => setShowHistory(false)}
            >
              ✖️ Close
            </button>
          </div>
          {noteHistory.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">No SOAP notes generated yet.</p>
          ) : (
            <ul className="space-y-4">
              {noteHistory.map((entry, index) => (
                <li key={index} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{entry.timestamp}</span>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{entry.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
