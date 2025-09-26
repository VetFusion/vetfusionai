// app/api/generate-soap/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function kgToLbOz(kg?: number | string) {
  const k = typeof kg === "string" ? Number(kg) : kg;
  if (!k || !isFinite(k)) return null;
  const totalLb = k * 2.20462;
  const lb = Math.floor(totalLb);
  const oz = Math.round((totalLb - lb) * 16);
  return { lb, oz, kg: +k.toFixed(2) };
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

function buildDeltaV2025Prompt(input: {
  animalName: string; dateISO: string; location?: string; signalment?: string;
  history?: string; clinicalFindings?: string; weightKg?: string;
  planOverride?: string; previousSOAPs?: string[];
}) {
  const { animalName, dateISO, location, signalment, history, clinicalFindings, weightKg, planOverride, previousSOAPs } = input;

  let weightHeader = "—";
  const w = kgToLbOz(weightKg ?? "");
  if (w) { const ozPad = String(w.oz); weightHeader = `${w.lb} lb ${ozPad} oz (${w.kg.toFixed(2)} kg)`; }

  const prior = (previousSOAPs ?? []).filter(Boolean).map((t, i) => `#${i + 1}: ${t?.slice(0, 1500)}`).join("\n\n");
  const planNote = planOverride?.trim() ? `\nClinician Plan Override (verbatim; do not alter):\n"""${planOverride.trim()}"""\n` : "";

  return `
You are a veterinary scribe for DELTA Rescue. Output ONE SOAP that matches this template EXACTLY, including headings, icons, and ordering. 
NEVER invent data; if unknown, write “—”. If weight available, keep header "Weight: __ lb __ oz (__ kg)". 
Include explicit dose math (mg/kg and mL) ONLY when weight is provided; otherwise show drug text verbatim without math.

🐾 [PATIENT FIRST NAME IN ALL CAPS] 🐾
DELTA RESCUE VETERINARY SOAP
🏢 Nonprofit Owner: DELTA Rescue • [Address] • [Phone/Email]
📅 Date/Time: ${dateISO}    •    📍 Location/Run: ${location || "—"}    •    🆔 ID/Microchip: on file
👤 Decision-Maker: DELTA Team
Chief Complaint: [—]    •    VCPR: ☐ Established ☐ Confirmed (Date: —)
Vaccines: [—]
🐾 Species/Breed: [—]    •    ♂️/♀️ Sex: [—]    •    🎂 Age: [— y — m]    •    🎨 Color: [—]
⚖️ Weight: ${weightHeader}    •    🌡️❤️🌬️ TPR: [— °F / — bpm / — bpm]
🍩 BCS: [—/9]    •    💧 Hydration: [—%]    •    👅⏱️ CRT: [— s]
Other Vitals: [—]
Intake Condition: [—]
🚫 Allergies: [—]    •    🍽️ Diet/Environment: [—]
🫁 ASA (if sed/GA): [—]

🧩 Master Problem List
① [Problem] • Onset: [—] • Severity: 🟢/🟠/🔴 • Status: ⬆️/➡️/⬇️/✅
② [Problem] • Onset: [—] • Severity: 🟢/🟠/🔴 • Status: ⬆️/➡️/⬇️/✅
③ [Problem] • Onset: [—] • Severity: 🟢/🟠/🔴 • Status: ⬆️/➡️/⬇️/✅
Chronic Conditions: [—]
Prior Treatments/Consults: [—]

💊 Current Medications
• [Drug] — [__ mg/kg], Route: [__], Frequency: [__], Start–Stop: [__], Source: ☐ In-House ☐ External Pharmacy
• ☐ None Ongoing
Dispensed Today: [—]

🗣️ S — Subjective
• Appetite: [—]
• Energy: [—]
• Elimination: [—]
• Behavior: [—]
• Environmental History: [—]
• Reported By: [—]
• Caregiver Notes: [—]
• Consent: Via DELTA Protocol (High-Risk Procedure? ☐ Yes [Details: —])

🔍 O — Objective
🩺 Focused Physical Exam:
• Pain: [—/10] • BCS/MM: [—/9] • Hydration: [—%]
• Eyes: N/A/Abn (—) • Ears: N/A/Abn (—) • Oral: N/A/Abn (—)
• Cardio: N/A/Abn (—) • Resp: N/A/Abn (—) • Abd: N/A/Abn (—)
• Neuro: N/A/Abn (—) • MSK: N/A/Abn (—) • Wounds: N/A/Abn (—)
Initial Intake Exam Reference: [—]
🧪 Diagnostics & Procedures: [—]
Procedure Details: [—]
📸 Imaging: [—]
📊 Data & Trends: [Weights: —; TPRs: —; Labs: —]

🧠 A — Assessment
① Problem: [—] — Tentative Dx: [—]; ddx {—}; Brief Pathophys: [—]; Risk: 🟢/🟠/🔴
② Problem: [—] — Tentative Dx: [—]; ddx {—}; Brief Pathophys: [—]; Risk: 🟢/🟠/🔴
③ Problem: [—] — Tentative Dx: [—]; ddx {—}; Brief Pathophys: [—]; Risk: 🟢/🟠/🔴
Stability: [Stable/Evolving/Decompensating]
Prognosis: 🟢 Good / 🟠 Guarded / 🔴 Poor

🧭 P — Plan
① Problem: ✅ Dx Today {—} • Labs {—} • Tx {—} • 📅 Recheck {—}
② Problem: ✅ {—} • Labs {—} • Tx {—}
③ Problem: ✅ {—} • Labs {—} • Tx {—}
Antimicrobial Stewardship: Indication {—} • Culture? ☐ Y ☐ N • Duration {—}
Analgesia Ladder: [—]
Enrichment & Handling: [—]
Disposition: ☐ Continue Inpatient ☐ Return to Shelter [Location: —]
Declined Care: ☐ [—]

🔁 Daily Progress & Disposition
• Date/Time: [—] • Change: Better/Same/Worse • Rationale: [—]
• Current Location: [—]

🧑‍⚕️ Tech Notes
• [—]

📋 Summary
• [—]
• External Data: [—]
• Audit Trail/Amendments: [—]

INPUT CONTEXT (verbatim, do not add new facts):
Name: ${animalName}
Signalment: ${signalment || "—"}
Tech Notes (history): ${history || "—"}
Clinical Findings: ${clinicalFindings || "—"}
${planNote}
Prior SOAPs (if any): 
${prior || "—"}
`;
}

function requiresSections(soap: string) {
  const must = [
    "DELTA RESCUE VETERINARY SOAP",
    "Master Problem List",
    "Current Medications",
    "S — Subjective",
    "O — Objective",
    "A — Assessment",
    "P — Plan",
    "Daily Progress & Disposition",
    "Tech Notes",
    "Summary",
  ];
  return must.filter((m) => !soap.includes(m));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      animalName = "UNKNOWN",
      signalment = "",
      history = "",
      clinicalFindings = "",
      weight = "",
      location = "",
      planOverride = "",
      useHistory = true,
      previousSOAPs = [],
      layout = "delta-v2025-09",
    } = body || {};

    const dateISO = todayISO();

    const prompt =
      layout === "delta-v2025-09"
        ? buildDeltaV2025Prompt({
            animalName,
            dateISO,
            location,
            signalment,
            history,
            clinicalFindings,
            weightKg: weight || "",
            planOverride,
            previousSOAPs: useHistory ? previousSOAPs : [],
          })
        : `Reformat succinct SOAP for ${animalName} with classic S/O/A/P. Avoid missing data invention. Context:\n${JSON.stringify(
            { signalment, history, clinicalFindings, location, weight },
            null,
            2
          )}`;

    const first = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    let soap = first.choices[0]?.message?.content?.trim() || "";

    const missing = requiresSections(soap);
    if (layout === "delta-v2025-09" && missing.length) {
      const repair = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: prompt + `\n\nYou omitted required sections: ${missing.join(", ")}.\nRegenerate the SOAP USING THE EXACT TEMPLATE and include EVERY missing section.`,
        }],
      });
      soap = repair.choices[0]?.message?.content?.trim() || soap;
    }

    if (!soap.startsWith("🐾")) {
      soap = `🐾 ${(animalName || "UNKNOWN").toUpperCase()} 🐾\n` + soap;
    }

    return NextResponse.json({ soapNote: soap }, { status: 200 });
  } catch (e: any) {
    console.error("generate-soap error:", e);
    return NextResponse.json({ error: e?.message || "generation failed" }, { status: 500 });
  }
}
