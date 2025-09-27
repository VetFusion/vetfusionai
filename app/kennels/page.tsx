"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO, addDays, isBefore } from "date-fns";

type Row = {
  id: number;
  Name: string;
  Location: string | null;
  area: string | null;
  cage: number | null;
  SOAP_Date: string | null;
  Recheck_Due: string | null;
  Case_Summary: string | null;
  Full_SOAP: string | null;
  Weight: string | null;
  Status: string | null;
};

export default function KennelBoardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areasFilter, setAreasFilter] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("master_tracker")
        .select("id, Name, Location, area, cage, SOAP_Date, Recheck_Due, Case_Summary, Full_SOAP, Weight, Status")
        .order("SOAP_Date", { ascending: false });
      if (!alive) return;
      if (error) console.error(error);
      setRows(data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const allAreas = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r.area) s.add(r.area); });
    return Array.from(s).sort();
  }, [rows]);

  const grouped = useMemo(() => {
    const byArea: Record<string, Row[]> = {};
    for (const r of rows) {
      const a = (r.area || "—").toUpperCase();
      if (!byArea[a]) byArea[a] = [];
      byArea[a].push(r);
    }
    // filter + sort by cage numeric
    const output: Record<string, Row[]> = {};
    Object.entries(byArea).forEach(([a, list]) => {
      const filtered = list.filter(r => r.Name.toLowerCase().includes(search.toLowerCase()));
      filtered.sort((x, y) => (x.cage || 0) - (y.cage || 0));
      if (!areasFilter.length || areasFilter.includes(a)) output[a] = filtered;
    });
    return output;
  }, [rows, search, areasFilter]);

  const colorClass = (r: Row) => {
    const overdue = r.Recheck_Due && isBefore(parseISO(r.Recheck_Due), new Date());
    const s = (r.Status || r.Case_Summary || "").toLowerCase();
    if (s.includes("icu") || s.includes("critical")) return "border-red-600 bg-red-900/30";
    if (s.includes("isolation") || s.includes("ringworm") || s.includes("mc")) return "border-amber-600 bg-amber-900/25";
    if (s.includes("surgery") || s.includes("dental")) return "border-indigo-600 bg-indigo-900/25";
    if (overdue) return "border-yellow-600 bg-yellow-900/25";
    return "border-emerald-600 bg-emerald-900/20";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-3 items-center">
          <h1 className="text-2xl font-bold">🐶 Kennel Board</h1>
          <input
            className="flex-1 min-w-[220px] px-4 py-2 rounded-lg bg-gray-900 border border-gray-700"
            placeholder="Search animal name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2 overflow-x-auto">
            {allAreas.map(a => (
              <button
                key={a}
                onClick={() => setAreasFilter(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])}
                className={`px-3 py-1 rounded-full border ${areasFilter.includes(a) ? "bg-teal-700 border-teal-500" : "bg-gray-900 border-gray-700"}`}
              >
                {a}
              </button>
            ))}
            {!!areasFilter.length && (
              <button onClick={() => setAreasFilter([])} className="px-3 py-1 rounded-full border bg-gray-800 border-gray-700">
                Clear
              </button>
            )}
          </div>
          <Link href="/schedule" className="ml-auto text-teal-400 hover:underline">📅 Schedule</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {loading ? <p className="text-gray-300">Loading…</p> : (
          Object.entries(grouped).map(([area, list]) => {
            if (!list.length) return null;
            return (
              <section key={area}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{area}</h2>
                  <span className="text-sm text-gray-400">{list.length} animal(s)</span>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {list.map(r => (
                    <div key={`${r.id}`} className={`rounded-2xl border p-4 hover:ring-2 hover:ring-teal-500 transition ${colorClass(r)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-lg font-bold">{r.Name}</div>
                        <div className="text-xs text-gray-300">{r.Weight || ""}</div>
                      </div>
                      <div className="text-sm text-gray-300">Cage: <span className="font-mono">{r.cage ?? "—"}</span></div>
                      <div className="text-xs text-gray-400 mt-1">SOAP: {r.SOAP_Date ? format(new Date(r.SOAP_Date), "MMM d, yyyy") : "—"}</div>
                      {r.Recheck_Due && <div className="text-xs text-amber-300 mt-1">🔁 Recheck: {format(new Date(r.Recheck_Due), "MMM d, yyyy")}</div>}
                      {r.Case_Summary && <div className="mt-2 text-sm text-gray-100 whitespace-pre-wrap line-clamp-4">{r.Case_Summary}</div>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/profile/${encodeURIComponent(r.Name.toLowerCase())}`} className="text-teal-300 text-sm hover:underline">Profile</Link>
                        <button
                          onClick={async () => {
                            const { error } = await supabase.from("master_tracker").update({ Status: "Prepped for treatment" }).eq("id", r.id);
                            if (error) console.error(error);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700"
                        >Mark Prepped</button>
                        <button
                          onClick={async () => {
                            const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
                            const { error } = await supabase.from("master_tracker").update({ Recheck_Due: tomorrow }).eq("id", r.id);
                            if (error) console.error(error);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700"
                        >+1d Recheck</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
