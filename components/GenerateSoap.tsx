"use client";

import { useState } from "react";

type SoapInput = {
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

export default function GenerateSoap({ seed }: { seed: SoapInput }) {
  const [loading, setLoading] = useState(false);
  const [soap, setSoap] = useState<string>("");

  async function generate() {
    setLoading(true);
    try {
      // Prefer the new unified route
      let res = await fetch("/api/soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: seed }),
      });

      // Fallback to legacy route if needed
      if (res.status === 404) {
        res = await fetch("/api/generate-soap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: seed }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      const text =
        json.soap ??
        json.content ??
        json.note ??
        json.result ??
        json.output ??
        "";

      if (!text) throw new Error("Empty response from server.");
      setSoap(text);
    } catch (e: any) {
      alert(`❌ Failed to fetch SOAP: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(soap || "");
  }

  return (
    <section className="vf-glass vf-glow p-5 scroll-mt-20">
      <div className="flex items-center justify-between">
        <h2 className="vf-h2">✨ Generate SOAP (AI)</h2>
        <div className="flex gap-2">
          <button
            className="vf-btn vf-btn--primary disabled:opacity-50"
            onClick={generate}
            disabled={loading}
            type="button"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
          <button
            className="vf-btn disabled:opacity-50"
            onClick={copy}
            disabled={!soap}
            type="button"
          >
            Copy
          </button>
        </div>
      </div>

      <textarea
        className="w-full h-80 p-3 mt-3 rounded-xl bg-black/20 border border-white/10 text-sm"
        placeholder="Generated SOAP will appear here…"
        value={soap}
        onChange={(e) => setSoap(e.target.value)}
      />
    </section>
  );
}
