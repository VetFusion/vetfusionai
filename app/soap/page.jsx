"use client";

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

// ---------- helpers ----------
function computeWeightKg(weightInput) {
  if (!weightInput) return "";
  const w = String(weightInput).toLowerCase().trim();
  try {
    if (!w) return "";
    if (w.includes("kg")) {
      const kg = parseFloat(w.replace(/[^\d.]/g, ""));
      return Number.isFinite(kg) ? kg.toFixed(2) : "";
    }
    if (w.includes("lb")) {
      const lb = parseFloat(w.replace(/[^\d.]/g, "")) || 0;
      const ozMatch = w.match(/(\d+(?:\.\d+)?)\s*oz/);
      const oz = ozMatch ? parseFloat(ozMatch[1]) : 0;
      const totalLb = lb + oz / 16;
      return (totalLb / 2.20462).toFixed(2);
    }
    const val = parseFloat(w);
    return Number.isFinite(val) ? val.toFixed(2) : "";
  } catch {
    return "";
  }
}

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
  const [suggestions, setSuggestions] = useState([]);
  const [layout, setLayout] = useState("delta-v2025-09");

  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // ---------- suggestions ----------
  const fetchSuggestions = async (partial) => {
    try {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("name")
        .ilike("name", `%${partial}%`)
        .limit(5);
      if (error) throw error;
      const uniqueNames = Array.from(new Set((data || []).map((d) => d.name?.trim()).filter(Boolean)));
      setSuggestions(uniqueNames);
    } catch (err) {
      console.error("❌ Supabase fetchSuggestions error:", err?.message || err);
    }
  };

  // ---------- lookup latest details ----------
  const fetchAnimalDetails = async (name) => {
    if (!name) return;
    try {
      const { data, error } = await supabase
        .from("master_tracker")
        .select("location, weight")
        .ilike("name", name.trim())
        .order("soap_date", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const latest = data[0];
        if (latest.location) setLocation(latest.location);
        if (latest.weight) setWeight(latest.weight);
      }
    } catch (err) {
      console.error("❌ Supabase fetchAnimalDetails error:", err?.message || err);
    }
  };

  // ---------- generate ----------
  const generateSOAP = async () => {
    setLoading(true);
    setGeneratedSOAP("🧠 Talking to VetFusionAI... Please wait.");

    const weightInKg = computeWeightKg(weight);
    let previousSOAPs = [];

    try {
      if (useHistory && animalName.trim()) {
        const { data, error } = await supabase
          .from("master_tracker")
          .select("full_soap")
          .ilike("name", animalName.trim())
          .order("soap_date", { ascending: false })
          .limit(3);
        if (error) throw error;
        previousSOAPs = (data || []).map((d) => d.full_soap).filter(Boolean);
      }

      const response = await fetch("/api/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalment,
          history,
          clinicalFindings,
          weight: weightInKg,
          location,
          planOverride,
          animalName,
          useHistory,
          previousSOAPs,
          layout,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        throw new Error(`❌ Failed to fetch SOAP: ${t}`);
      }

      const data = await response.json();
      setGeneratedSOAP(data.soapNote);
      setNoteHistory((prev) => [{ timestamp: new Date().toLocaleString(), note: data.soapNote }, ...prev]);
    } catch (err) {
      console.error("❌ Error generating SOAP:", err);
      toast.error("🚨 Failed to generate SOAP. See console for details.");
    }

    setLoading(false);
    setSaveSuccess("");
  };

  // ---------- save ----------
  const saveToTracker = async () => {
    try {
      const caseSummary =
        generatedSOAP.match(/📋 Summary[\s\S]*?\n• (.*)/)?.[1]?.trim() ||
        generatedSOAP.match(/🧾 Summary:\s*\n([\s\S]*?)(?:\n🧠|\n📝|\n🔁|$)/)?.[1]?.trim() ||
        "No summary available.";

      const planMatch =
        generatedSOAP.match(/📝 Plan[\s\S]*?(?:\n\n|$)/) ||
        generatedSOAP.match(/📝 \*\*Plan\*\*:\n([\s\S]*?)(?=\n[A-Z]|\n\*\*|$)/);
      const extractedPlan = planMatch ? (planMatch[1] || planMatch[0] || "").trim() : "";
      const currentMeds = planOverride || extractedPlan || "No plan available.";

      const today = new Date().toISOString().split("T")[0];
      const recheckDue = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

      // master_tracker snapshot (lowercase keys)
      const payload = {
        name: animalName?.trim() || "Unknown",
        location: location?.trim() || "Unspecified",
        soap_date: today,
        weight: weight?.toString().trim() || "",
        species: "",
        status: "",
        recheck_due: recheckDue,
        current_meds: currentMeds.slice(0, 2999),
        case_summary: (caseSummary || "").slice(0, 999),
        full_soap: generatedSOAP.slice(0, 9999),
      };

      const { error: e1 } = await supabase
        .from("master_tracker")
        .upsert([payload], { onConflict: "name,soap_date" });

      if (e1) {
        console.error("🛑 master_tracker upsert error:", e1);
        toast.error(`❌ Error saving to Tracker: ${e1.message}`);
        return;
      }
      toast.success("✅ SOAP saved to tracker!");
      setSaveSuccess("");

      // soap_notes (full longitudinal)
      const weightInKg = computeWeightKg(weight);
      const vitalsJson = null;

      const { error: e2 } = await supabase
        .from("soap_notes")
        .upsert(
          [
            {
              animal_name: (animalName || "Unknown").toUpperCase().trim(),
              soap_date: today,
              full_soap: generatedSOAP,
              case_summary: caseSummary,
              weight_lb_oz: weight?.toString().trim() || null,
              weight_kg: weightInKg ? Number(weightInKg) : null,
              vitals: vitalsJson,
              recheck_due: recheckDue,
            },
          ],
          { onConflict: "animal_name,soap_date" }
        );

      if (e2) console.warn("soap_notes upsert warning:", e2.message);
    } catch (err) {
      console.error(err);
      toast.error("🔥 Something went wrong while saving.");
    }
  };

  // ---------- utils ----------
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSOAP);
    toast.success("📋 SOAP copied to clipboard");
  };

  const saveAsPDF = () => {
    const doc = new jsPDF();
    const cleaned = generatedSOAP.replace(/[^\x00-\x7F]/g, "");
    doc.setFont("helvetica");
    const lines = doc.splitTextToSize(cleaned, 180);
    doc.text(lines, 10, 10);
    doc.save(`${(animalName || "SOAP").trim()}-Note.pdf`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <h1 className="text-5xl font-bold mb-8 text-gray-900 dark:text-white">🐾 VetFusionAI</h1>
      <p className="text-xl font-medium mb-6 text-gray-700 dark:text-gray-300">
        AI-Powered SOAP Notes <span className="font-semibold">Built for Veterinarians, by Veterinarians</span>
      </p>

      <div className="w-full max-w-2xl bg-white/30 dark:bg-gray-800/40 shadow-xl rounded-xl backdrop-blur-md p-6 space-y-4">
        <input
          ref={nameInputRef}
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          placeholder="Animal Name (e.g., Wilbur)"
          value={animalName}
          onChange={async (e) => {
            const name = e.target.value;
            setAnimalName(name);
            await fetchAnimalDetails(name);
            await fetchSuggestions(name);
          }}
        />

        {suggestions.length > 0 && (
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md shadow mb-2">
            <p className="text-xs text-gray-400 mb-1">Suggested Matches:</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={async () => {
                      setAnimalName(s);
                      await fetchAnimalDetails(s);
                      setSuggestions([]);
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-teal-600 text-white hover:bg-teal-500"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
            placeholder="Location (e.g., BR-14 or ICU)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
            placeholder="Weight (e.g., 20.5 lb, 20 lb 8 oz, or 9.3 kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <input
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          placeholder="🩺 Signalment (e.g., 3 y/o MN Lab mix)"
          value={signalment}
          onChange={(e) => setSignalment(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          placeholder="📚 Brief history or reason for visit"
          value={history}
          onChange={(e) => setHistory(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          placeholder="🔍 Key findings: PE, labs, imaging, etc."
          value={clinicalFindings}
          onChange={(e) => setClinicalFindings(e.target.value)}
        />
        <textarea
          className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
          placeholder="📝 Plan: meds, rechecks, instructions... (optional)"
          value={planOverride}
          onChange={(e) => setPlanOverride(e.target.value)}
          rows={6}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <label className="text-sm text-white flex items-center gap-2">
            <input
              type="checkbox"
              id="useHistory"
              checked={useHistory}
              onChange={(e) => setUseHistory(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            🔁 Use Previous SOAPs for Context
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Layout</span>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
            >
              <option value="delta-v2025-09">Delta v2025-09 (current)</option>
              <option value="legacy">Legacy</option>
            </select>
          </div>
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
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 mb-4 text-md leading-relaxed">
            {generatedSOAP}
          </div>

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
