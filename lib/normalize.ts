// lib/normalize.ts

export function toFahrenheitMaybe(raw?: string | number | null): string | null {
  if (raw == null) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!isFinite(n)) return null;

  // Treat plausible °C (20–45) → convert to °F
  if (n >= 20 && n <= 45) return String(Math.round(n * 9/5 + 32));
  // Treat plausible °F (60–120) → keep
  if (n >= 60 && n <= 120) return String(Math.round(n));
  // Otherwise discard (clearly bogus)
  return null;
}

export function normalizeVitals(v?: { temp?: string; hr?: string; rr?: string } | null) {
  const tempF = toFahrenheitMaybe(v?.temp ?? null);
  const hr = v?.hr && isFinite(Number(v.hr)) ? String(Math.round(Number(v.hr))) : undefined;
  const rr = v?.rr && isFinite(Number(v.rr)) ? String(Math.round(Number(v.rr))) : undefined;
  return {
    temp: tempF ?? undefined,
    hr: hr ?? undefined,
    rr: rr ?? undefined,
  };
}

export function normalizeWeight(w?: { lb?: number; oz?: number; kg?: number } | null) {
  if (!w) return undefined;
  // prefer kg if present, else lb/oz
  if (w.kg && isFinite(w.kg)) return { kg: Number(w.kg) };
  if (w.lb || w.oz) return { lb: w.lb ?? 0, oz: w.oz ?? 0 };
  return undefined;
}
