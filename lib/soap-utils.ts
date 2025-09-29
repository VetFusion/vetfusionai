// lib/soap-utils.ts

/* =========================
   Types
   ========================= */
export type SoapInput = {
  date?: string;
  name?: string;
  species?: string;
  sexStatus?: string;
  residence?: string; // "Ward-Area" or free text
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

/* =========================
   Small utilities
   ========================= */
export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function lbOzToKg(lb?: number, oz?: number) {
  if (lb == null && oz == null) return null;
  const totalLb = (lb ?? 0) + (oz ?? 0) / 16;
  const kg = totalLb * 0.45359237;
  return Number.isFinite(kg) ? Number(kg.toFixed(2)) : null;
}

export function kgToLbOz(kg?: number) {
  if (kg == null) return null;
  const totalLb = kg / 0.45359237;
  const lb = Math.floor(totalLb);
  const oz = Math.round((totalLb - lb) * 16);
  return { lb, oz };
}

export function fmtWeightDual(input?: { lb?: number; oz?: number; kg?: number } | null) {
  if (!input) return "___ lb ___ oz (___ kg)";
  const kg =
    input.kg ??
    lbOzToKg(input.lb ?? undefined, input.oz ?? undefined);

  if (kg == null) return "___ lb ___ oz (___ kg)";

  const o = kgToLbOz(kg)!;
  return `${o.lb} lb ${o.oz} oz (${kg} kg)`;
}

export function fmtVitals(vitals?: { temp?: string; hr?: string; rr?: string } | null) {
  const t = vitals?.temp ?? "___°F";
  const hr = vitals?.hr ?? "___";
  const rr = vitals?.rr ?? "___";
  return `${t} • ❤️ HR: ${hr} • 💨 RR: ${rr}`;
}

export function cleanLines(s?: string | null) {
  if (!s) return "";
  return String(s)
    .replace(/\r/g, "")
    .split("\n")
    .map((ln) => ln.trimEnd())
    .join("\n")
    .trim();
}

const circNums = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"] as const;
export function bulletPlan(items?: string[]) {
  if (!items || items.length === 0) {
    return `  ① Diagnostics
  ② Therapeutics
  ③ Monitoring / recheck`;
  }
  return items
    .map((p, i) => `  ${circNums[i] ?? "•"} ${p}`)
    .join("\n");
}

/* =========================
   Prompt Builder
   ========================= */
export function buildDeltaPrompt(input: SoapInput) {
  const kg =
    input?.weight?.kg ??
    lbOzToKg(input?.weight?.lb ?? undefined, input?.weight?.oz ?? undefined);

  const style = input.styleVariant ?? "Default";
  const capsName = (input.name || "PATIENT").toUpperCase();

  // Weight header (always shows both units if we have a weight)
  const weightHeader =
    kg != null
      ? (() => {
          const o = kgToLbOz(kg)!;
          return `${o.lb} lb ${o.oz} oz (${kg} kg)`;
        })()
      : "___ lb ___ oz (___ kg)";

  // Plan block (uses circled numerals when hints are provided)
  const planBlock = bulletPlan(input.planHints);

  // Core prompt — strict, copy/paste-ready, no extra commentary
  const prompt = `
You are the Delta Rescue veterinary scribe. Generate ONE copy-paste-ready SOAP using the EXACT format below.
If a field is unknown, write “—”. Do NOT invent data. Keep the exact emoji and section order.

🐾 ${capsName} 🐾
DELTA RESCUE VETERINARY SOAP
📅 Date: ${input.date || "_____"} • 📍 Residence/Run: ${input.residence || "_____"}
🐾 Species: ${input.species || "_____"} • Sex/Status: ${input.sexStatus || "_____"}
⚖️ Weight: ${weightHeader}
🌡️ T: ${input.vitals?.temp ?? "___°F"} • ❤️ HR: ${input.vitals?.hr ?? "___"} • 💨 RR: ${input.vitals?.rr ?? "___"}

Tech Notes:
${cleanLines(input.techNotes) || "(none provided)"}

Subjective:
- Chief complaint / presenting concerns.

Objective:
- Focused physical exam findings relevant to problems.
${input.exam ? `- Exam: ${cleanLines(input.exam)}` : ""}
${input.labs ? `- Labs: ${cleanLines(input.labs)}` : ""}
${input.imaging ? `- Imaging: ${cleanLines(input.imaging)}` : ""}

Assessment:
- Problem list with brief ddx/rationale.
${
  input.problems?.length
    ? input.problems.map((p, i) => `- ${i + 1}. ${p}`).join("\n")
    : ""
}

Plan:
${planBlock}

Summary:
${cleanLines(input.summaryHints) || "One concise, caregiver-facing paragraph. Use helpful emojis (✅ stable, ⚠️ caution, ❤️ comfort, 🧪 labs, 🦴 imaging)."}

Formatting & House Rules:
- Keep EXACT section order and emoji shown above; no headings beyond those provided.
- Show weight in both lb/oz and kg when weight is available; otherwise placeholders.
- For medications in the Plan: include mg/kg and mL when weight is known; be explicit with concentration if you can infer it.
- Avoid hedging language and filler; be clinically crisp and readable by staff.
- Style variant (tone only; format unchanged): ${style}.
- Always extrapolate, don't leave anything blank.

Return ONLY the SOAP text — no preamble or trailing commentary.
`.trim();

  return prompt;
}
