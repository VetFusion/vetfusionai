"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Types from your API
------------------------------------------------------------------- */
type Row = {
  id: string;
  name: string;
  name_caps?: string | null;
  name_key?: string | null;
  ward?: string | null;
  days_since?: number | null;
  soap_id?: string | null;
  location: string | null;
  area: string | null;
  cage: string | null;
  soap_date: string; // YYYY-MM-DD
  snippet: string | null;
};

type HistoryRow = {
  soap_id: string;
  name_caps: string | null;
  soap_date: string;
  snippet: string | null;
};

type SortKey = "date" | "name";
type Dir = "asc" | "desc";

/* ------------------------------------------------------------------
   Utilities
------------------------------------------------------------------- */
function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const isTypingTarget = (el: Element | null) => {
  if (!el) return false;
  const n = el as HTMLElement;
  const tag = n.tagName?.toLowerCase();
  return n.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
};

const wardChip = (code?: string | null) =>
  code ? (
    <span className="px-2 py-0.5 mr-2 rounded-full text-[10px] bg-gray-900 text-white">{code}</span>
  ) : null;

const computeNameKey = (n?: string | null) =>
  (n || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const copy = (text: string) => navigator.clipboard.writeText(text);

const STORAGE_KEY = "vf_tracker_state_v2";

/* ------------------------------------------------------------------
   Inline AI generator (Generate → Save) per-row
------------------------------------------------------------------- */
function InlineAIGenerator({ row }: { row: Row }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usedPrior, setUsedPrior] = useState<string>("");

  const lookupBy =
    (row.name_key || computeNameKey(row.name)) ? "name_key" :
    (row.soap_id ? "soap_id" : "name");

  const lookupValue = row.name_key || computeNameKey(row.name) || row.soap_id || row.name;

  async function generate() {
    setLoading(true);
    try {
      const payload = {
        input: {
          date: new Date().toISOString().slice(0, 10),
          name: row.name,
          residence: [row.ward, row.area].filter(Boolean).join("-") || row.location || undefined,
          techNotes: row.snippet || undefined,
          styleVariant: "Lucas",
        },
        lookup: { by: lookupBy as "name_key" | "soap_id" | "name", value: lookupValue },
      };

      // Prefer continuity-aware endpoint
      let res = await fetch("/api/soap/with-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Fallback to basic generator if continuity route isn't present
      if (res.status === 404) {
        res = await fetch("/api/soap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: payload.input }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      setText(json.soap || json.content || "");
      setUsedPrior(json.usedPrior || json.usedPriorCount ? " (with prior)" : "");
    } catch (e: any) {
      alert(`❌ Failed to generate: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!text.trim()) {
      alert("No SOAP to save yet. Generate first.");
      return;
    }
    setSaving(true);
    try {
      const trackerRow = {
        // minimal upsert payload for master_tracker (adjust column names to match your DB)
        Name: row.name,
        SOAP_Date: new Date().toISOString().slice(0, 10),
        Ward: row.ward ?? null,
        Location: row.location ?? null,
        Area: row.area ?? null,
        Cage: row.cage ?? null,
        Snippet: text.slice(0, 280),
      };

      const res = await fetch("/api/soap/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soap: { content: text }, trackerRow }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      alert("✅ Saved to Supabase.");
    } catch (e: any) {
      if (String(e?.message || "").includes("Failed to fetch")) {
        alert("The save endpoint (/api/soap/upsert) is missing. Ask me for that route and I’ll paste it in.");
      } else {
        alert(`❌ Save failed: ${e.message}`);
      }
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button
          onClick={generate}
          disabled={loading}
          className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs disabled:opacity-50"
          type="button"
          title="Generate SOAP from last note + this row"
        >
          {loading ? "Generating…" : `✨ Generate${usedPrior}`}
        </button>
        <button
          onClick={() => copy(text)}
          disabled={!text}
          className="px-2.5 py-1.5 rounded-md bg-slate-700 text-white text-xs disabled:opacity-50"
          type="button"
        >
          Copy
        </button>
        <button
          onClick={save}
          disabled={!text || saving}
          className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-xs disabled:opacity-50"
          type="button"
          title="Save to Supabase (soap_notes + master_tracker upsert)"
        >
          {saving ? "Saving…" : "Save"}
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

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */
export default function TrackerPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ward, setWard] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  // Sort
  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<Dir>("desc");

  // Drawer
  const [open, setOpen] = useState<Row | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const fetchAbort = useRef<AbortController | null>(null);

  // Derived: CSV link
  const csvHref = useMemo(() => {
    const params = new URLSearchParams({
      ...(dq && { q: dq }),
      ...(from && { from }),
      ...(to && { to }),
      ...(ward && { ward }),
      ...(dueOnly ? { due: "1" } : {}),
      sort,
      dir,
      limit: "1000",
      format: "csv",
    });
    return `/api/tracker?${params.toString()}`;
  }, [dq, from, to, ward, dueOnly, sort, dir]);

  /* ---------------- URL ↔ State (hydrate on mount) ---------------- */
  useEffect(() => {
    const url = new URL(window.location.href);
    const get = (k: string) => url.searchParams.get(k) ?? "";

    const initial = {
      q: get("q"),
      from: get("from"),
      to: get("to"),
      ward: get("ward"),
      dueOnly: get("due") === "1",
      sort: (get("sort") as SortKey) || "date",
      dir: (get("dir") as Dir) || "desc",
    };

    const hasURLState =
      url.searchParams.size > 0 &&
      (url.searchParams.has("q") ||
        url.searchParams.has("from") ||
        url.searchParams.has("to") ||
        url.searchParams.has("ward") ||
        url.searchParams.has("due"));

    if (!hasURLState) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          initial.q = s.q ?? initial.q;
          initial.from = s.from ?? initial.from;
          initial.to = s.to ?? initial.to;
          initial.ward = s.ward ?? initial.ward;
          initial.dueOnly = s.dueOnly ?? initial.dueOnly;
          initial.sort = s.sort ?? initial.sort;
          initial.dir = s.dir ?? initial.dir;
        }
      } catch {}
    }

    setQ(initial.q);
    setFrom(initial.from);
    setTo(initial.to);
    setWard(initial.ward);
    setDueOnly(initial.dueOnly);
    setSort(initial.sort);
    setDir(initial.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state → URL + localStorage
  useEffect(() => {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    sp.set("sort", sort);
    sp.set("dir", dir);
    dq ? sp.set("q", dq) : sp.delete("q");
    from ? sp.set("from", from) : sp.delete("from");
    to ? sp.set("to", to) : sp.delete("to");
    ward ? sp.set("ward", ward) : sp.delete("ward");
    dueOnly ? sp.set("due", "1") : sp.delete("due");
    const next = `${url.pathname}?${sp.toString()}`;
    window.history.replaceState({}, "", next);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ q: dq, from, to, ward, dueOnly, sort, dir }));
    } catch {}
  }, [dq, from, to, ward, dueOnly, sort, dir]);

  /* ---------------- Fetch ---------------- */
  const fetchData = useCallback(async () => {
    fetchAbort.current?.abort();
    const ac = new AbortController();
    fetchAbort.current = ac;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        ...(dq && { q: dq }),
        ...(from && { from }),
        ...(to && { to }),
        ...(ward && { ward }),
        ...(dueOnly ? { due: "1" } : {}),
        sort,
        dir,
        limit: "200",
      });
      const r = await fetch(`/api/tracker?${params.toString()}`, { cache: "no-store", signal: ac.signal });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setRows(j.rows ?? []);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message || "Failed to load tracker rows.");
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [dq, from, to, ward, dueOnly, sort, dir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- Hotkeys ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = document.activeElement;
      if (!target || isTypingTarget(target)) return;

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if ((e.key === "r" || e.key === "R") && e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        fetchData();
      }

      if (e.key === "Escape") setOpen(null);
    };

    const onEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") fetchData();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEnter, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEnter, true);
    };
  }, [fetchData]);

  /* ---------------- Helpers ---------------- */
  const setSortToggle = (k: SortKey) => {
    if (k === sort) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(k);
      setDir(k === "name" ? "asc" : "desc");
    }
  };

  const openDrawer = async (r: Row) => {
    setOpen(r);
    setHistory(null);
    const key = r.name_key || computeNameKey(r.name);
    if (!key) return;
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/history?name_key=${encodeURIComponent(key)}&limit=5`, { cache: "no-store" });
      const j = res.ok ? await res.json() : { rows: [] };
      setHistory(j.rows ?? []);
    } finally {
      setHistoryLoading(false);
    }
  };

  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFrom(fmt(start));
    setTo(fmt(end));
  };

  const displayName = (r: Row) => r.name_caps?.trim() || r.name || "—";
  const displayAreaCage = (r: Row) => [r.area, r.cage].filter(Boolean).join(" / ") || "—";
  const ageClass = (n?: number | null) =>
    n == null ? "bg-gray-400 text-white" : n <= 7 ? "bg-green-600 text-white" : n <= 30 ? "bg-yellow-600 text-white" : "bg-gray-600 text-white";

  /* ---------------- Skeleton Row ---------------- */
  const SkeletonRow = () => (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );

  /* ---------------- Render ---------------- */
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Master Tracker</h1>
        <div className="flex items-center gap-2">
          <a className="px-3 py-2 rounded-xl border" href={csvHref} target="_blank" rel="noreferrer">
            Export CSV
          </a>
          <div className="text-sm text-gray-500">
            {rows.length} result{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        <div className="relative">
          <input
            ref={searchRef}
            className="border rounded-xl p-2 w-full pr-8"
            placeholder="Search name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search by name"
          />
          {q && (
            <button
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              onClick={() => setQ("")}
              type="button"
            >
              ×
            </button>
          )}
        </div>
        <input type="date" className="border rounded-xl p-2" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input type="date" className="border rounded-xl p-2" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <input
          className="border rounded-xl p-2"
          placeholder="Ward (e.g., BR, MR…)"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          aria-label="Ward"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {["BR", "MR", "ICU", "JH", "PK", "Q", "ALL"].map((w) => (
            <button
              key={w}
              className={`px-2 py-1 rounded-full text-xs border ${ward === w || (w === "ALL" && !ward) ? "bg-black text-white" : ""}`}
              onClick={() => setWard(w === "ALL" ? "" : w)}
              type="button"
            >
              {w}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm px-2">
          <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} />
          Recheck due (&gt;30d)
        </label>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl shadow bg-black text-white" onClick={fetchData} disabled={loading} type="button">
            {loading ? "Loading…" : "Filter"}
          </button>
          <button
            className="px-4 py-2 rounded-xl shadow"
            onClick={() => {
              setQ("");
              setFrom("");
              setTo("");
              setWard("");
              setDueOnly(false);
            }}
            disabled={loading}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Quick ranges */}
      <div className="flex gap-2 text-xs text-gray-600">
        <span className="py-1">Quick range:</span>
        {[
          { label: "Today", d: 1 },
          { label: "7d", d: 7 },
          { label: "30d", d: 30 },
          { label: "90d", d: 90 },
        ].map((p) => (
          <button key={p.label} className="px-2 py-1 rounded-full border" onClick={() => setRange(p.d)} type="button">
            {p.label}
          </button>
        ))}
        <button className="px-2 py-1 rounded-full border" onClick={() => { setFrom(""); setTo(""); }} type="button">
          Clear dates
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
          {error}{" "}
          <button className="underline ml-2" onClick={fetchData} type="button">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-2xl border">
        <table className="min-w-full text-sm leading-tight">
          <thead className="bg-gray-900 text-white sticky top-0 z-10">
            <tr>
              <th className="text-left p-3">
                <button className="underline underline-offset-4" onClick={() => setSortToggle("date")} type="button" aria-label="Sort by date">
                  Date {sort === "date" ? (dir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="text-left p-3">Residence / Run</th>
              <th className="text-left p-3">
                <button className="underline underline-offset-4" onClick={() => setSortToggle("name")} type="button" aria-label="Sort by name">
                  NAME {sort === "name" ? (dir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="text-left p-3">Preview</th>
              <th className="text-left p-3">Age</th>
              <th className="text-left p-3">AI SOAP</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </>
            )}

            {!loading && rows.length === 0 && !error && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No rows match your filters.&nbsp;
                  <button
                    className="underline"
                    onClick={() => {
                      setQ(""); setFrom(""); setTo(""); setWard(""); setDueOnly(false);
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-gray-50 hover:bg-gray-100">
                <td className="p-3 whitespace-nowrap">
                  <span title="Date of last SOAP">{r.soap_date}</span>
                  {r.days_since != null && r.days_since > 30 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white" title="Recheck due">
                      Due
                    </span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {wardChip(r.ward)}
                  {[r.area, r.cage].filter(Boolean).join(" / ") || r.location || "—"}
                </td>
                <td className="p-3 font-semibold">
                  {r.soap_id ? (
                    <a className="underline" href={`/soap/${r.soap_id}`}>
                      {r.name_caps?.trim() || r.name || "—"}
                    </a>
                  ) : (
                    r.name_caps?.trim() || r.name || "—"
                  )}
                </td>
                <td className="p-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <button className="underline" onClick={() => openDrawer(r)} title="Quick preview" type="button">
                      {r.snippet ?? "—"}
                    </button>
                    <button
                      className="text-xs px-2 py-0.5 rounded-full border"
                      onClick={() => copy(`${r.name_caps?.trim() || r.name || "—"} — ${r.soap_date}\n${r.snippet ?? ""}`)}
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${ageClass(r.days_since)}`}>
                    {r.days_since == null ? "—" : `${r.days_since}d`}
                  </span>
                </td>
                <td className="p-3 align-top">
                  <InlineAIGenerator row={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right-side preview + history drawer */}
      {open && (
        <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(null)}>
          <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">{open.name_caps?.trim() || open.name || "—"}</h2>
              <button className="p-2" onClick={() => setOpen(null)} aria-label="Close preview" type="button">
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-3 space-x-2">
              <span>{open.soap_date}</span>
              <span>•</span>
              <span>{open.location ?? "—"}</span>
              <span>•</span>
              <span>{[open.area, open.cage].filter(Boolean).join(" / ") || "—"}</span>
              {open.days_since != null && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${ageClass(open.days_since)}`}>{open.days_since}d</span>
                </>
              )}
            </div>

            <pre className="whitespace-pre-wrap text-sm border rounded-xl p-4">
              {open.snippet ?? "No summary available."}
            </pre>

            {/* AI generator (drawer) */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">AI SOAP</h3>
              <InlineAIGenerator row={open} />
            </div>

            <div className="mt-4 flex gap-2">
              {open.soap_id && (
                <a className="px-3 py-2 rounded-lg bg-black text-white" href={`/soap/${open.soap_id}`}>
                  Open full SOAP
                </a>
              )}
              <button
                className="px-3 py-2 rounded-lg border"
                onClick={() => copy(`${open.name_caps?.trim() || open.name || "—"} — ${open.soap_date}\n${open.snippet ?? ""}`)}
                type="button"
              >
                Copy preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
