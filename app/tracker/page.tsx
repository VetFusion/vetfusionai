"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  soap_date: string;     // YYYY-MM-DD
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

/* ---------- Utilities ---------- */

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
  const node = el as HTMLElement;
  const tag = node.tagName?.toLowerCase();
  return (
    node.isContentEditable ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select"
  );
};

const wardChip = (code?: string | null) =>
  code ? (
    <span className="px-2 py-1 mr-2 rounded-full text-[10px] bg-gray-200">{code}</span>
  ) : null;

/* ---------- Page ---------- */

export default function TrackerPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ward, setWard] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  const [sort, setSort] = useState<SortKey>("date");
  const [dir, setDir] = useState<Dir>("desc");

  const [open, setOpen] = useState<Row | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const displayName = (r: Row) => (r.name_caps?.trim() || r.name || "—");
  const displayAreaCage = (r: Row) =>
    [r.area, r.cage].filter(Boolean).join(" / ") || "—";
  const ageClass = (n?: number | null) =>
    n == null
      ? "bg-gray-400 text-white"
      : n <= 7
      ? "bg-green-600 text-white"
      : n <= 30
      ? "bg-yellow-600 text-white"
      : "bg-gray-600 text-white";

  const fetchData = useCallback(async () => {
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
      const r = await fetch(`/api/tracker?${params.toString()}`, {
        cache: "no-store",
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setRows(j.rows ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load tracker rows.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dq, from, to, ward, dueOnly, sort, dir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hotkeys: "/" focus search (when not typing), Alt+R refresh, Esc close drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = document.activeElement;
      if (isTypingTarget(target)) return;

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if ((e.key === "r" || e.key === "R") && e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        fetchData();
        return;
      }

      if (e.key === "Escape") {
        setOpen(null);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fetchData]);

  const setSortToggle = (k: SortKey) => {
    if (k === sort) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(k);
      setDir(k === "name" ? "asc" : "desc");
    }
  };

  const csvHref = () => {
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
  };

  const openDrawer = async (r: Row) => {
    setOpen(r);
    setHistory(null);
    if (!r.name_key) return;
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `/api/history?name_key=${encodeURIComponent(r.name_key)}&limit=5`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setHistory([]);
        return;
      }
      const j = await res.json();
      setHistory(j.rows ?? []);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Master Tracker</h1>
        <div className="flex items-center gap-2">
          <a className="px-3 py-2 rounded-xl border" href={csvHref()}>
            Export CSV
          </a>
          <div className="text-sm text-gray-500">
            {rows.length} result{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        <input
          ref={searchRef}
          className="border rounded-xl p-2"
          placeholder="Search name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          type="date"
          className="border rounded-xl p-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="border rounded-xl p-2"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          className="border rounded-xl p-2"
          placeholder="Ward (e.g., BR, MR…)"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
        />
        <div className="flex items-center gap-2">
          {["BR", "MR", "ICU"].map((w) => (
            <button
              key={w}
              className={`px-2 py-1 rounded-full text-xs border ${
                ward === w ? "bg-black text-white" : ""
              }`}
              onClick={() => setWard(ward === w ? "" : w)}
            >
              {w}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm px-2">
          <input
            type="checkbox"
            checked={dueOnly}
            onChange={(e) => setDueOnly(e.target.checked)}
          />
          Recheck due (&gt;30d)
        </label>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl shadow bg-black text-white"
            onClick={fetchData}
            disabled={loading}
          >
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
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
          {error}{" "}
          <button className="underline ml-2" onClick={fetchData}>
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
                <button
                  className="underline underline-offset-4"
                  onClick={() => setSortToggle("date")}
                >
                  Date {sort === "date" ? (dir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="text-left p-3">Residence / Run</th>
              <th className="text-left p-3">
                <button
                  className="underline underline-offset-4"
                  onClick={() => setSortToggle("name")}
                >
                  NAME {sort === "name" ? (dir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th className="text-left p-3">Preview</th>
              <th className="text-left p-3">Age</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  No rows match your filters.
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-gray-50 hover:bg-gray-100">
                <td className="p-3">{r.soap_date}</td>
                <td className="p-3">
                  {wardChip(r.ward)}
                  {displayAreaCage(r)}
                </td>
                <td className="p-3 font-semibold">
                  {r.soap_id ? (
                    <a className="underline" href={`/soap/${r.soap_id}`}>
                      {displayName(r)}
                    </a>
                  ) : (
                    displayName(r)
                  )}
                </td>
                <td className="p-3 text-gray-600">
                  <button
                    className="underline"
                    onClick={() => openDrawer(r)}
                    title="Quick preview"
                  >
                    {r.snippet ?? "—"}
                  </button>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${ageClass(
                      r.days_since
                    )}`}
                  >
                    {r.days_since == null ? "—" : `${r.days_since}d`}
                  </span>
                  {r.days_since != null && r.days_since > 30 && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                      Recheck due
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right-side preview + history drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40"
          onClick={() => setOpen(null)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">{displayName(open)}</h2>
              <button className="p-2" onClick={() => setOpen(null)}>
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-600 mb-3 space-x-2">
              <span>{open.soap_date}</span>
              <span>•</span>
              <span>{open.location ?? "—"}</span>
              <span>•</span>
              <span>{displayAreaCage(open)}</span>
              {open.days_since != null && (
                <>
                  <span>•</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${ageClass(
                      open.days_since
                    )}`}
                  >
                    {open.days_since}d
                  </span>
                </>
              )}
            </div>

            <pre className="whitespace-pre-wrap text-sm border rounded-xl p-4">
              {open.snippet ?? "No summary available."}
            </pre>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">History (last 5)</h3>
              {historyLoading && (
                <div className="text-sm text-gray-500">Loading…</div>
              )}
              {!historyLoading && history && history.length === 0 && (
                <div className="text-sm text-gray-500">No prior SOAPs.</div>
              )}
              {!historyLoading && history && history.length > 0 && (
                <ul className="text-sm space-y-1">
                  {history.map((h) => (
                    <li key={h.soap_id}>
                      <a className="underline" href={`/soap/${h.soap_id}`}>
                        {h.soap_date}
                      </a>
                      <span className="text-gray-500">
                        {" "}
                        — {h.snippet ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {open.soap_id && (
                <a
                  className="px-3 py-2 rounded-lg bg-black text-white"
                  href={`/soap/${open.soap_id}`}
                >
                  Open full SOAP
                </a>
              )}
              <button
                className="px-3 py-2 rounded-lg border"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${displayName(open)} — ${open.soap_date}\n${
                      open.snippet ?? ""
                    }`
                  )
                }
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
