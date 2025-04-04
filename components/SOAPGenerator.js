"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

const fetchPreviousSOAPs = async (animalName) => {
  const { data, error } = await supabase
    .from("master_tracker")
    .select("Full_SOAP")
    .ilike("Name", name.trim())
    .order("SOAP_Date", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching previous SOAPs:", error);
    return [];
  }

  return data.map((entry) => entry.Full_SOAP);
};

export default function SOAPGenerator() {
  const [animalName, setAnimalName] = useState("");
  const [location, setLocation] = useState("");
  const [signalment, setSignalment] = useState("");
  const [history, setHistory] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [planOverride, setPlanOverride] = useState("");
  const [weight, setWeight] = useState("");
  const [generatedSOAP, setGeneratedSOAP] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [noteHistory, setNoteHistory] = useState([]);
  const [useHistory, setUseHistory] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState("");

  const generateSOAP = async () => {
    setLoading(true);
    setGeneratedSOAP("🧠 Talking to VetFusionAI... Please wait.");
// const previousSOAPs = useHistory ? await fetchPreviousSOAPs(animalName) : [];
const previousSOAPs = []; // 🔌 Bypassing Supabase temporarily

    const weightInKg = weight?.toLowerCase().includes("lb")
      ? (parseFloat(weight) / 2.20462).toFixed(2)
      : weight;

      const response = await fetch(`${window.location.origin}/api/generate-soap`, {
        method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signalment,
        history,
        clinicalFindings,
        weight: weightInKg,
        previousSOAPs,
        location,
        planOverride,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`❌ Failed to fetch SOAP: ${text}`);
    }
    const data = await response.json();
        setGeneratedSOAP(data.soapNote);

    setNoteHistory((prevHistory) => [
      { timestamp: new Date().toLocaleString(), note: data.soapNote },
      ...prevHistory,
    ]);

    setLoading(false);
    setSaveSuccess("");
  };

  const saveToTracker = async () => {
    try {
      const caseSummary =
        generatedSOAP.match(/🧠 \*\*Assessment\*\*:\n(.*?)(\n|\.|$)/)?.[1]?.trim() ||
        "No summary available.";
  
      const planMatch =
        generatedSOAP.match(/📝 \*\*Plan\*\*:\n([\s\S]*?)(?=\n[A-Z]|\n\*\*|$)/);
      const extractedPlan = planMatch ? planMatch[1].trim() : "";
      const currentMeds = planOverride || extractedPlan || "No plan available.";
  
      const today = new Date().toISOString().split("T")[0]; // ✅ formatted date string
      const recheckDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days later
      .toISOString()
      .split("T")[0];
    
      const payload = {
        Name: animalName?.trim() || "Unknown",
        Location: location?.trim() || "Unspecified",
        SOAP_Date: today, // ✅ valid formatted date
        Weight: weight?.toString().trim() || "",
        Species: "",
        Status: "",
        Recheck_Due: recheckDue, // ✅ ← THIS LINE FIXES THE ERROR
        Current_Meds: currentMeds.slice(0, 2999),
        Case_Summary: caseSummary.slice(0, 999),
        Full_SOAP: generatedSOAP.slice(0, 9999),
      };
      
  
      console.log("📦 Supabase Insert Payload:", payload);

      const { error } = await supabase.from("master_tracker").insert([payload]);
      
      if (error) {
        console.error("🛑 Supabase insert error:", error);
        toast.error(`❌ Error saving to Tracker: ${error.message}`);
      } else {
        toast.success("✅ SOAP saved to tracker!");
        setSaveSuccess(""); // Optional: clear older messages
      }
      } catch (err) {
        console.error("🔥 Unexpected save error:", err);
        toast.error("🔥 Something went wrong while saving.");
      }
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
  const fetchAnimalDetails = async (name) => {
    if (!name) return;
  
    console.log("🔍 Looking up:", name);
  
    const { data, error } = await supabase
      .from("master_tracker")
      .select("Location, Weight")
      .ilike("Name", name.trim()) // 🔁 CASE-INSENSITIVE MATCH
      .order("SOAP_Date", { ascending: false })
      .limit(1);
  
    if (error) {
      console.error("🛑 Supabase error:", error);
      return;
    }
  
    if (data && data.length > 0) {
      const latest = data[0];
      if (latest.Location) setLocation(latest.Location);
      if (latest.Weight) setWeight(latest.Weight);
      console.log("📥 Auto-filled animal details:", latest);
    } else {
      console.log("❌ No matching animal found for:", name);
    }
  };
  
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">🐾 VetFusionAI</h1>
      <p className="text-xl font-medium mb-6 text-gray-700 dark:text-gray-300">
        AI-Powered SOAP Notes <span className="font-semibold">Built for Veterinarians, by Veterinarians</span>
      </p>

      <div className="w-full max-w-2xl bg-white/30 dark:bg-gray-800/40 shadow-xl rounded-xl backdrop-blur-md p-6 space-y-4">
      <input
  className="w-full p-3 rounded-lg"
  placeholder="Animal Name"
  value={animalName}
  onChange={async (e) => {
    const name = e.target.value;
    setAnimalName(name);
    await fetchAnimalDetails(name);
  }}
/>
        <input className="w-full p-3 rounded-lg" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="w-full p-3 rounded-lg" placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input className="w-full p-3 rounded-lg" placeholder="🩺 Signalment" value={signalment} onChange={(e) => setSignalment(e.target.value)} />
        <textarea className="w-full p-3 rounded-lg" placeholder="📚 History" value={history} onChange={(e) => setHistory(e.target.value)} />
        <textarea className="w-full p-3 rounded-lg" placeholder="🔍 Clinical Findings" value={clinicalFindings} onChange={(e) => setClinicalFindings(e.target.value)} />
        <textarea className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white" placeholder="📝 Plan (manual or AI-generated)" value={planOverride} onChange={(e) => setPlanOverride(e.target.value)} rows={6} />

        <div className="flex items-center space-x-3">
          <input type="checkbox" id="useHistory" checked={useHistory} onChange={(e) => setUseHistory(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
          <label htmlFor="useHistory" className="text-sm">🔁 Use Previous SOAPs for Context</label>
        </div>

        <button className="w-full py-3 bg-teal-500 text-white rounded-lg font-semibold" onClick={generateSOAP} disabled={loading}>
          {loading ? "🧠 Talking to VetFusionAI..." : "✨ Generate SOAP Note"}
        </button>

        <button className="w-full mt-2 bg-green-600 text-white py-2 px-4 rounded-lg" onClick={saveToTracker} disabled={!generatedSOAP}>
          📥 Save to Tracker
        </button>
        {saveSuccess && <p className="text-green-500 text-center mt-2">{saveSuccess}</p>}

        <button className="w-full mt-2 bg-purple-600 text-white py-2 px-4 rounded-lg" onClick={() => setShowHistory(true)}>
          📚 View Note History
        </button>
      </div>

      {generatedSOAP && (
        <div className="mt-8 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">📋 Generated SOAP Note</h2>
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 mb-4 text-md leading-relaxed">{generatedSOAP}</div>

          <div className="flex gap-4 justify-center mt-6">
            <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg" onClick={copyToClipboard}>
              📋 Copy to Clipboard
            </button>
            <button className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-5 rounded-lg" onClick={saveAsPDF}>
              📄 Save as PDF
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="mt-8 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📚 SOAP Note History</h2>
            <button className="text-gray-500 dark:text-gray-300 hover:text-gray-700" onClick={() => setShowHistory(false)}>
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
