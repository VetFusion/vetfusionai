// app/soap/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";
import PrintButton from "@/components/PrintButton";
import CopyButton from "@/components/CopyButton";
import GenerateSoap from "@/components/GenerateSoap"; // <-- client tool for AI generate

export const dynamic = "force-dynamic";

/* ---------------- Types ---------------- */
type TrackerMeta = {
  name: string | null;
  name_caps: string | null;
  location: string | null;
  ward: string | null;
  area: string | null;
  cage: string | null;
  soap_date: string | null;
  days_since: number | null;
  soap_id: string | null;
  name_key: string | null;
};

type SoapRecord = {
  id: string;
  animal_name: string | null;
  soap_date: string | null;
  case_summary: string | null;
  temp_f: number | null;
  hr_bpm: number | null;
  rr_bpm: number | null;
  weight_lb: number | null;
  weight_oz: number | null;
  weight_kg: number | null;
};

/* ---------------- Helpers (server-safe) ---------------- */
function splitSections(full?: string | null) {
  const src = (full ?? "").replace(/\r/g, "");
  const blocks: Record<string, string> = {};
  const keys = ["TECH NOTES", "SUMMARY", "PROBLEMS", "PLAN", "ASSESSMENT", "SUBJECTIVE", "OBJECTIVE"];
  const re = new RegExp(
    `(^|\\n)[\\s•\\-–—\\*🔥🐾📝💊⚕️✅❌]*\\s*(?:${keys
      .map((k) => k.replace(/ /g, "[\\s_]*"))
      .join("|")})\\s*:?\\s*\\n`,
    "gi",
  );
  const marks: Array<{ key: string; at: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const raw = m[0].toUpperCase();
    const found = keys.find((k) => raw.includes(k));
    if (found) marks.push({ key: found, at: m.index + m[0].length });
  }
  if (marks.length === 0) {
    if (src.trim()) blocks["SUMMARY"] = src.trim();
    return blocks;
  }
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].at;
    const end = i + 1 < marks.length ? marks[i + 1].at - 1 : src.length;
    const body = src.slice(start, end).trim();
    if (body) blocks[marks[i].key] = body;
  }
  return blocks;
}

function parseRun(text?: string | null) {
  if (!text) return { run: null, ward: null, area: null, cage: null };
  const t = String(text);
  const m1 = t.match(/(?:Location\/Run|Residence\/Run)\s*:\s*([A-Z]{1,3}-?\d{1,3}[A-Z]?)/i);
  if (m1) {
    const run = m1[1].toUpperCase();
    const [ward, area] = run.split("-");
    return { run, ward: ward ?? null, area: area ?? null, cage: null };
  }
  const m2 = t.match(/\b(BR|MR|ICU|MC|CAT ICU|DOG ICU|MAIN|B)-?\s?(\d{1,3}[A-Z]?)\b/i);
  if (m2) {
    const wRaw = m2[1].toUpperCase();
    const ward = wRaw === "B" ? "BR" : wRaw === "MAIN" ? "MR" : wRaw;
    const area = m2[2].toUpperCase();
    return { run: `${ward}-${area}`, ward, area, cage: null };
  }
  return { run: null, ward: null, area: null, cage: null };
}

function parseVitals(text?: string | null) {
  if (!text) return { temp_f: null, hr_bpm: null, rr_bpm: null };
  const t = String(text).replace(/\s+/g, " ");
  const temp_f = t.match(/(?:T|Temp|T°|🌡)\s*[:=]?\s*(\d{2,3}(?:\.\d)?)(?:\s*°?\s*F)?/i)?.[1] ?? null;
  const hr_bpm = t.match(/(?:HR|Pulse|❤️)\s*[:=]?\s*(\d{2,3})\s*b?pm?/i)?.[1] ?? null;
  const rr_bpm = t.match(/(?:RR|Resp|🌬️)\s*[:=]?\s*(\d{1,3})\s*b?pm?/i)?.[1] ?? null;
  return {
    temp_f: temp_f ? Number(temp_f) : null,
    hr_bpm: hr_bpm ? Number(hr_bpm) : null,
    rr_bpm: rr_bpm ? Number(rr_bpm) : null,
  };
}

function parseWeight(text?: string | null) {
  if (!text) return { weight_lb: null, weight_oz: null, weight_kg: null };
  const t = String(text);
  const mLbOz = t.match(/(?:Weight|Wt|⚖)\s*[:=]?\s*(\d{1,3})\s*lb[s]?\s*(\d{1,2})\s*oz/i);
  const mLb = t.match(/(?:Weight|Wt|⚖)\s*[:=]?\s*(\d{1,3})\s*lb/i);
  const mKg = t.match(/(\d{1,3}(?:\.\d+)?)\s*kg/i);
  let lb: number | null = null,
    oz: number | null = null,
    kg: number | null = null;
  if (mLbOz) {
    lb = Number(mLbOz[1]);
    oz = Number(mLbOz[2]);
  } else if (mLb) {
    lb = Number(mLb[1]);
  }
  if (mKg) kg = Number(mKg[1]);
  if (kg == null && lb != null) {
    kg = Math.round((lb + (oz ? oz / 16 : 0)) * 0.453592 * 100) / 100;
  }
  return { weight_lb: lb, weight_oz: oz, weight_kg: kg };
}

function parseMeds(text?: string | null) {
  const lines = (text ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const rx =
    /^[-•\*]?\s*([A-Za-z][A-Za-z0-9\-\s]+?)\s*[:\-–]?\s*([0-9][^,\s]*[^\s]*)?(?:\s*(PO|SQ|IM|IV|PR|SL))?(?:\s*(SID|BID|TID|QID|Q\d+h|PRN))?(?:\s*[–-]\s*(.*))?$/i;
  const meds: Array<{ drug: string; dose: string; route: string; freq: string; notes: string }> = [];
  for (const ln of lines) {
    const m = ln.match(rx);
    if (!m) continue;
    const [, drug, dose = "", route = "", freq = "", notes = ""] = m;
    if (!drug) continue;
    meds.push({
      drug: drug.trim(),
      dose: dose.trim(),
      route: route.toUpperCase(),
      freq: freq.toUpperCase(),
      notes: notes.trim(),
    });
  }
  const uniq = new Map<string, (typeof meds)[number]>();
  meds.forEach((row) => uniq.set([row.drug, row.dose, row.route, row.freq, row.notes].join("|"), row));
  return Array.from(uniq.values());
}

function scrubSummary(text?: string | null) {
  if (!text) return "";
  const drop = [
    /^🐾.*DELTA RESCUE/i,
    /^Nonprofit Owner/i,
    /Arrastre Canyon/i,
    /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/,
    /^Decision-?Maker/i,
    /^VCPR/i,
    /^Vaccines/i,
    /^Other Vitals/i,
  ];
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter((ln) => !drop.some((rx) => rx.test(ln)))
    .join("\n")
    .trim();
}

function detectChips(texts: string[]) {
  const t = texts.join(" ").toLowerCase();
  const chips: string[] = [];
  if (/\bfelv\b|\bfe\-?lv\b/.test(t)) chips.push("FeLV+");
  if (/\bfiv\b/.test(t)) chips.push("FIV");
  if (/\banemi[ac]\b|\bpcv\b|\bhematocrit\b/.test(t)) chips.push("Anemia");
  if (/\btransfus/i.test(t)) chips.push("Transfusion");
  return chips;
}

function parseLabs(text?: string | null) {
  const t = (text ?? "").replace(/\r/g, "");
  const get = (re: RegExp) => {
    const m = t.match(re);
    return m ? m[1] : undefined;
  };
  const out: Record<string, string> = {};
  const PCV = get(/\bPCV\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (PCV) out.PCV = `${PCV} %`;
  const HCT = get(/\bHCT\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (HCT) out.HCT = `${HCT} %`;
  const TS = get(/\b(?:TS|TP)\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (TS) out.TS = `${TS} g/dL`;
  const BUN = get(/\bBUN\b[^0-9\-]*([0-9]{1,3})/i);
  if (BUN) out.BUN = `${BUN} mg/dL`;
  const CREA = get(/\b(?:CREA|Creatinine)\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (CREA) out.CREA = `${CREA} mg/dL`;
  const ALT = get(/\bALT\b[^0-9\-]*([0-9]{1,4})/i);
  if (ALT) out.ALT = `${ALT} U/L`;
  const ALP = get(/\bALP\b[^0-9\-]*([0-9]{1,4})/i);
  if (ALP) out.ALP = `${ALP} U/L`;
  const GLU = get(/\b(?:GLU|Glucose)\b[^0-9\-]*([0-9]{1,3})/i);
  if (GLU) out.GLU = `${GLU} mg/dL`;
  const T4 = get(/\bT4\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (T4) out.T4 = `${T4} µg/dL`;
  const TP = get(/\bTotal\s*Protein\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (TP) out.TP = `${TP} g/dL`;
  const ALB = get(/\b(?:ALB|Albumin)\b[^0-9\-]*([0-9]{1,2}(?:\.[0-9])?)/i);
  if (ALB) out.ALB = `${ALB} g/dL`;
  return out;
}

/* ---------------- Page (Server) ---------------- */
export default async function SoapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return (
      <div className="vf-glass vf-glow p-5 m-6">
        <div className="vf-accent h-[2px] w-full opacity-40 mb-3" />
        <h1 className="text-xl font-bold">Missing Supabase env vars</h1>
        <p className="text-sm text-red-300">Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart.</p>
      </div>
    );
  }

  const supabase = createClient(url, anon);

  const { data: meta } = await supabase
    .from("v_tracker_latest")
    .select("name, name_caps, location, ward, area, cage, soap_date, days_since, soap_id, name_key")
    .eq("soap_id", id)
    .maybeSingle<TrackerMeta>();

  const { data: soap, error: soapErr } = await supabase
    .from("soap_notes")
    .select("*")
    .eq("id", id)
    .single<SoapRecord>();

  if (soapErr || !soap) {
    return (
      <div className="vf-glass vf-glow p-5 m-6">
        <div className="vf-accent h-[2px] w-full opacity-40 mb-3" />
        <h1 className="text-xl font-bold">SOAP not found</h1>
        <p className="text-sm text-red-300">{soapErr?.message ?? "No record"}</p>
        <a className="vf-btn mt-3 inline-block" href="/tracker">
          ← Back to Tracker
        </a>
      </div>
    );
  }

  // Derivations
  const runParsed = parseRun(soap.case_summary);
  const run =
    runParsed.run ||
    (meta?.ward && meta?.area ? `${meta.ward}-${meta.area}` : meta?.location || meta?.ward || "—");

  const vit = parseVitals(soap.case_summary);
  const wts = parseWeight(soap.case_summary);

  const tempF = soap.temp_f ?? vit.temp_f ?? "—";
  const hrBpm = soap.hr_bpm ?? vit.hr_bpm ?? "—";
  const rrBpm = soap.rr_bpm ?? vit.rr_bpm ?? "—";

  const wLb = soap.weight_lb ?? wts.weight_lb;
  const wOz = soap.weight_oz ?? wts.weight_oz ?? 0;
  const wKg = soap.weight_kg ?? wts.weight_kg;
  const weight =
    wLb != null || wKg != null ? `${wLb ?? "—"} lb ${wOz ?? 0} oz (${wKg ?? "—"} kg)` : "—";

  const name = meta?.name_caps || (soap.animal_name ? String(soap.animal_name).toUpperCase() : "—");
  const date = soap.soap_date ?? meta?.soap_date ?? "—";
  const days = typeof meta?.days_since === "number" ? meta.days_since : null;

  const S = splitSections(soap.case_summary);
  const summaryClean = scrubSummary(S["SUMMARY"]);
  const medsParsed = parseMeds(S["PLAN"] || S["SUMMARY"]);
  const chips = detectChips([summaryClean, S["PROBLEMS"] ?? "", S["PLAN"] ?? ""]);
  const labs = parseLabs(soap.case_summary);

  const headerText = [
    `🐾 ${name} 🐾`,
    `Date: ${date}`,
    `Residence/Run: ${run}`,
    `Weight: ${weight}`,
    `TPR: ${tempF} °F / ${hrBpm} bpm / ${rrBpm} bpm`,
  ].join("\n");

  const planText =
    S["PLAN"] ??
    (medsParsed.length
      ? medsParsed.map((m) => `${m.drug} ${m.dose} ${m.route} ${m.freq} ${m.notes}`.trim()).join("\n")
      : "");

  const ageBadge =
    days != null ? (
      <span
        className={[
          "px-2 py-0.5 rounded-full text-xs",
          days <= 7 ? "bg-green-600 text-white" : days <= 30 ? "bg-yellow-600 text-white" : "bg-gray-600 text-white",
        ].join(" ")}
        title="Days since SOAP"
      >
        {days}d
      </span>
    ) : null;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Toolbar */}
      <div className="vf-glass vf-glow p-3 flex items-center justify-between">
        <div className="text-sm text-gray-300">
          <a href="/tracker" className="underline">
            ← Back to Tracker
          </a>
        </div>
        <div className="flex gap-2">
          <CopyButton className="vf-btn" label="Copy header" text={headerText} />
          <PrintButton className="vf-btn vf-btn--primary" />
        </div>
      </div>

      {/* Clinical header */}
      <section className="vf-glass vf-glow p-5">
        <div className="vf-accent h-[2px] w-full opacity-40 mb-3" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xl font-bold">🐾 {name} 🐾</div>
          <div className="flex items-center gap-2">
            {ageBadge}
            <span className="text-sm text-gray-400">
              ID: <code className="text-gray-300">{id}</code>
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 text-sm text-gray-200/90">
          <div>
            📅 <span className="font-medium">{date}</span>
          </div>
          <div>
            📍 <span className="font-medium">Residence/Run: {run}</span>
          </div>
          <div>
            ⚖️ <span className="font-medium">{weight}</span>
          </div>
          <div>
            🌡️❤️🌬️ <span className="font-medium">{`${tempF} °F / ${hrBpm} bpm / ${rrBpm} bpm`}</span>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c} className="px-2 py-1 rounded-full text-xs bg-white/10 border border-white/15">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Labs panel */}
        {Object.keys(labs).length > 0 && (
          <div className="mt-4 overflow-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
            <table className="min-w-full text-xs">
              <thead className="bg-white/10">
                <tr>
                  {["PCV", "HCT", "TS/TP", "BUN", "CREA", "ALT", "ALP", "GLU", "T4", "TP", "ALB"].map((h) => (
                    <th key={h} className="text-left p-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-transparent even:bg-white/5">
                  <td className="p-2">{labs.PCV ?? "—"}</td>
                  <td className="p-2">{labs.HCT ?? "—"}</td>
                  <td className="p-2">{labs.TS ?? labs.TP ?? "—"}</td>
                  <td className="p-2">{labs.BUN ?? "—"}</td>
                  <td className="p-2">{labs.CREA ?? "—"}</td>
                  <td className="p-2">{labs.ALT ?? "—"}</td>
                  <td className="p-2">{labs.ALP ?? "—"}</td>
                  <td className="p-2">{labs.GLU ?? "—"}</td>
                  <td className="p-2">{labs.T4 ?? "—"}</td>
                  <td className="p-2">{labs.TP ?? "—"}</td>
                  <td className="p-2">{labs.ALB ?? "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SUMMARY */}
      {summaryClean && (
        <section className="vf-glass vf-glow p-5 scroll-mt-20">
          <div className="flex items-center justify-between">
            <h2 className="vf-h2">Summary</h2>
            <CopyButton className="vf-btn" label="Copy" text={summaryClean} />
          </div>
          <pre className="whitespace-pre-wrap text-sm mt-2">{summaryClean}</pre>
        </section>
      )}

      {/* TECH NOTES */}
      {S["TECH NOTES"] && (
        <section className="vf-glass vf-glow p-5 scroll-mt-20">
          <div className="flex items-center justify-between">
            <h2 className="vf-h2">Tech Notes</h2>
            <CopyButton className="vf-btn" label="Copy" text={S["TECH NOTES"]!} />
          </div>
          <pre className="whitespace-pre-wrap text-sm mt-2">{S["TECH NOTES"]}</pre>
        </section>
      )}

      {/* PROBLEMS + PLAN */}
      <div className="grid md:grid-cols-2 gap-4">
        {S["PROBLEMS"] && (
          <section className="vf-glass vf-glow p-5 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="vf-h2">Problem List</h2>
              <CopyButton className="vf-btn" label="Copy" text={S["PROBLEMS"]!} />
            </div>
            <pre className="whitespace-pre-wrap text-sm mt-2">{S["PROBLEMS"]}</pre>
          </section>
        )}

        {(S["PLAN"] || medsParsed.length > 0) && (
          <section className="vf-glass vf-glow p-5 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="vf-h2">Plan</h2>
              <CopyButton className="vf-btn" label="Copy" text={planText} />
            </div>

            {S["PLAN"] && <pre className="whitespace-pre-wrap text-sm mt-2">{S["PLAN"]}</pre>}

            {medsParsed.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-semibold mb-1">Medications (parsed)</div>
                <div className="overflow-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.10)" }}>
                  <table className="min-w-full text-xs">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="text-left p-2">Drug</th>
                        <th className="text-left p-2">Dose</th>
                        <th className="text-left p-2">Route</th>
                        <th className="text-left p-2">Freq</th>
                        <th className="text-left p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medsParsed.map((m, i) => (
                        <tr key={i} className="odd:bg-transparent even:bg-white/5">
                          <td className="p-2">{m.drug}</td>
                          <td className="p-2">{m.dose}</td>
                          <td className="p-2">{m.route}</td>
                          <td className="p-2">{m.freq}</td>
                          <td className="p-2">{m.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* AI Generate (enable when ready) */}
      <GenerateSoap
        seed={{
          date: typeof date === "string" ? date : undefined,
          name: name !== "—" ? name : undefined,
          residence: typeof run === "string" ? run : undefined,
          weight: wKg != null ? { kg: Number(wKg) } : wLb != null ? { lb: Number(wLb), oz: Number(wOz || 0) } : undefined,
          vitals: {
            temp: tempF && tempF !== "—" ? String(tempF) : undefined,
            hr: hrBpm && hrBpm !== "—" ? String(hrBpm) : undefined,
            rr: rrBpm && rrBpm !== "—" ? String(rrBpm) : undefined,
          },
          techNotes: S["TECH NOTES"] ?? undefined,
          exam: S["OBJECTIVE"] ?? undefined,
          labs: Object.keys(labs).length ? JSON.stringify(labs) : undefined,
          problems: S["PROBLEMS"] ? S["PROBLEMS"].split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
          planHints: undefined,
          summaryHints: summaryClean || undefined,
          styleVariant: "Lucas",
        }}
      />
    </div>
  );
}
