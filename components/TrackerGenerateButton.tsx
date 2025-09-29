"use client";

import { useState } from "react";

type Seed = {
  date?: string;
  name?: string;
  species?: string;
  sexStatus?: string;
  residence?: string;
  weight?: { lb?: number; oz?: number; kg?: number } | null;
  vitals?: { temp?: string; hr?: string; rr?: string } | null;
  techNotes?: string;
  exam?: string;
  labs?: string;
  imaging?: string;
  problems?: string[];
  planHints?: string[];
  summaryHints?: string;
  styleVariant?: "Lucas" | "Sophie" | "Orlando" | "Default";
};

export default function TrackerGenerateButton({
  seed,
  lookup, // { by: "name" | "soap_id", value: string }
}: {
  seed: Seed;
  lookup: { by: "name" | "soap_id"; value: string };
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/soap/with-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: seed, lookup }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setText(json.soap || "");
    } catch (e: any) {
      alert(`❌ Failed to fetch SOAP: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (text) navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button
          onClick={generate}
          disabled={loading}
          className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs disabled:opacity-50"
          type="button"
          title="Generate SOAP from last note + current row"
        >
          {loading ? "Generating…" : "✨ Generate"}
        </button>
        <button
          onClick={copy}
          disabled={!text}
          className="px-2.5 py-1.5 rounded-md bg-slate-700 text-white text-xs disabled:opacity-50"
          type="button"
        >
          Copy
        </button>
      </div>
      {text && (
        <textarea
          className="w-64 h-28 p-2 rounded-md bg-black/25 border border-white/10 text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      )}
    </div>
  );
}
