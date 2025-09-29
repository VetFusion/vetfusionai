// app/api/soap/with-context/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildDeltaPrompt, type SoapInput, cleanLines } from "../../../../lib/soap-utils";
import { supabaseServer } from "../../../../lib/supabaseServer";

/* ---------- Model ---------- */
export const runtime = "nodejs";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const supportsTemp = (m: string) => !/^gpt-5/i.test(m);

/* ---------- Helpers ---------- */
function toFahrenheitMaybe(raw?: string | number | null): string | null {
  if (raw == null) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!isFinite(n)) return null;
  if (n >= 20 && n <= 45) return String(Math.round(n * 9 / 5 + 32)); // °C → °F
  if (n >= 60 && n <= 120) return String(Math.round(n));            // plausible °F
  return null;
}
function normalizeVitals(v?: { temp?: string; hr?: string; rr?: string } | null) {
  const tempF = toFahrenheitMaybe(v?.temp ?? null);
  const hr = v?.hr && isFinite(Number(v.hr)) ? String(Math.round(Number(v.hr))) : undefined;
  const rr = v?.rr && isFinite(Number(v.rr)) ? String(Math.round(Number(v.rr))) : undefined;
  return { temp: tempF ?? undefined, hr: hr ?? undefined, rr: rr ?? undefined };
}
function normalizeWeight(w?: { lb?: number; oz?: number; kg?: number } | null) {
  if (!w) return undefined;
  if (w.kg && isFinite(w.kg)) return { kg: Number(w.kg) };
  if (w.lb || w.oz) return { lb: w.lb ?? 0, oz: w.oz ?? 0 };
  return undefined;
}

type Prior = { case_summary: string; soap_date?: string | null };
const SEC_RE = /(^|\n)\s*([A-Z ]{4,}|🐾|Tech Notes|Subjective|Objective|Assessment|Plan|Summary)\s*:?\s*\n/gim;

function extractSections(src: string) {
  const text = cleanLines(src);
  const marks: { key: string; at: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = SEC_RE.exec(text))) {
    const raw = m[0].toUpperCase();
    const key =
      /TECH NOTES/.test(raw) ? "TECH NOTES" :
      /SUBJECTIVE/.test(raw) ? "SUBJECTIVE" :
      /OBJECTIVE/.test(raw) ? "OBJECTIVE" :
      /ASSESSMENT/.test(raw) ? "ASSESSMENT" :
      /PLAN/.test(raw) ? "PLAN" :
      /SUMMARY/.test(raw) ? "SUMMARY" : "OTHER";
    marks.push({ key, at: m.index + m[0].length });
  }
  if (marks.length === 0) return { SUMMARY: text };
  const out: Record<string, string> = {};
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].at;
    const end = i + 1 < marks.length ? marks[i + 1].at - 1 : text.length;
    const body = text.slice(start, end).trim();
    if (body) out[marks[i].key] = body;
  }
  return out;
}

function continuityEnvelope(base: string, priors: Prior[]) {
  if (!priors.length) return base;
  // Build a concise carry-forward summary
  const snippets = priors.slice(0, 3).map((p, i) => {
    const S = extractSections(p.case_summary || "");
    const problems = (S["ASSESSMENT"] || S["PROBLEMS"] || "").split("\n").slice(0, 12).join("\n");
    const plan = (S["PLAN"] || "").split("\n").slice(0, 12).join("\n");
    return [
      `#${i + 1} ${p.soap_date || ""}`.trim(),
      problems ? `Problems:\n${problems}` : "",
      plan ? `Plan:\n${plan}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n---\n\n");

  return `${base}

Continuity Rules (IMPORTANT):
- Carry forward ongoing appropriate medications and stable problems from prior notes unless stopping is explicitly justified.
- If stopping/altering ongoing meds, briefly justify (improved signs, adverse effects, new dx).
- Correct invalid vitals (e.g., "22" → interpret as °C→°F if plausible; otherwise omit).
- Keep EXACT header & section order; one SOAP only; no duplicate boilerplate.

PRIOR SNAPSHOTS (most recent first):
"""
${snippets}
"""
`.trim();
}

/* ---------- Handler ---------- */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const body = await req.json() as {
      input: SoapInput;
      prior?: string | null;
      lookup?: { by: "name_key" | "soap_id" | "name"; value: string } | null;
    };

    // Normalize seed
    const input: SoapInput = {
      ...body.input,
      vitals: normalizeVitals(body.input?.vitals ?? null),
      weight: normalizeWeight(body.input?.weight ?? null),
    };

    // Fetch priors
    const priors: Prior[] = [];
    if (body.prior) priors.push({ case_summary: body.prior });

    if (!body.prior && body.lookup?.value) {
      const sb = supabaseServer();
      if (body.lookup.by === "soap_id") {
        const { data } = await sb.from("soap_notes")
          .select("case_summary, soap_date")
          .eq("id", body.lookup.value)
          .maybeSingle();
        if (data?.case_summary) priors.push(data);
      } else if (body.lookup.by === "name_key") {
        const { data } = await sb.from("soap_notes")
          .select("case_summary, soap_date")
          .eq("name_key", body.lookup.value)
          .order("soap_date", { ascending: false })
          .limit(3);
        (data ?? []).forEach((d) => d?.case_summary && priors.push(d));
      } else {
        const { data } = await sb.from("soap_notes")
          .select("case_summary, soap_date")
          .ilike("animal_name", body.lookup.value)
          .order("soap_date", { ascending: false })
          .limit(3);
        (data ?? []).forEach((d) => d?.case_summary && priors.push(d));
      }
    }

    // Build continuity prompt
    let prompt = buildDeltaPrompt(input);
    prompt = continuityEnvelope(prompt, priors);

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      ...(supportsTemp(MODEL) ? { temperature: 0.5 } : {}),
    };

    const out = await openai.chat.completions.create(params);
    const soap = out.choices[0]?.message?.content?.trim();
    if (!soap) return NextResponse.json({ error: "No content from model" }, { status: 502 });

    return NextResponse.json({ model: MODEL, soap, usedPriorCount: priors.length });
  } catch (err: any) {
    console.error("SOAP with context failed:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate SOAP" }, { status: 500 });
  }
}
