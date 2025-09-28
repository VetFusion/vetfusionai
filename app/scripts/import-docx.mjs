import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import mammoth from "mammoth"; 
import { createClient } from "@supabase/supabase-js";

const ROOT = process.argv[2]; // folder path, e.g., "/Users/ryanwhitney/Google Drive/soapsandlabs"
const DRY = process.argv.includes("--dry");
if (!ROOT) {
  console.error("Usage: node scripts/import-docx.mjs <folder> [--dry]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATE_RX = [
  /(\d{4}-\d{2}-\d{2})/,
  /\b(\d{1,2}[-_ ]\d{1,2}[-_ ]\d{2,4})\b/,
  /(\d{4}[-_ ]\d{1,2}[-_ ]\d{1,2})/
];
const LOC_RX = /\b(MR|BR|ICU|JH|KR|MC)[-_ ]?(\d{1,3})?\b/i;

function toISO(raw) {
  if (!raw) return null;
  let s = raw.replace(/[ _]/g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    if (yy.length === 2) yy = String(2000 + Number(yy));
    return `${yy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return null;
}

function parseFromFilename(file) {
  const base = path.basename(file).replace(/\.docx$/i, "");
  let foundDate = null;
  for (const rx of DATE_RX) {
    const hit = base.match(rx);
    if (hit) { foundDate = hit[1] || hit[0]; break; }
  }
  const iso = toISO(foundDate);
  const left = foundDate ? base.split(foundDate)[0] : base;
  const loc = left.match(LOC_RX);
  const area = loc ? loc[1].toUpperCase() : null;
  const cage = loc && loc[2] ? Number(loc[2]) : null;
  const name = left.replace(LOC_RX, "").replace(/[_-]+/g, " ").trim().toUpperCase();
  return { name: name || "UNKNOWN", isoDate: iso, area, cage };
}

async function docxToText(file) {
  const { value } = await mammoth.extractRawText({ path: file });
  return (value || "").trim();
}

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

async function importOne(file) {
  const full = await docxToText(file);
  if (!full) { console.warn("Empty docx:", file); return; }

  const { name, isoDate, area, cage } = parseFromFilename(file);
  const soapDate = isoDate || new Date().toISOString().slice(0, 10);
  const summary = full.slice(0, 600).replace(/\s+/g, " ").trim();
  const hash = sha256(full.replace(/\s+/g, " ").trim());

  if (DRY) {
    console.log("[DRY]", { name, soapDate, location: area ? (cage ? `${area}-${cage}` : area) : "Unspecified", chars: full.length });
    return;
  }

  const { data: exists } = await supabase
    .from("soap_notes")
    .select("id").eq("source_hash", hash).limit(1);
  if (exists && exists.length) return;

  const ins1 = await supabase.from("soap_notes").upsert([{
    animal_name: name,
    soap_date: soapDate,
    full_soap: full.slice(0, 99999),
    case_summary: summary,
    source_path: `Drive:${file}`,
    source_hash: hash
  }], { onConflict: "animal_name,soap_date" });
  if (ins1.error) { console.error("soap_notes error", ins1.error.message); return; }

  const location = area ? (cage ? `${area}-${cage}` : area) : "Unspecified";
  const ins2 = await supabase.from("master_tracker").upsert([{
    name, location, soap_date: soapDate,
    case_summary: summary.slice(0, 999),
    full_soap: full.slice(0, 9999),
    source_path: `Drive:${file}`,
    source_hash: hash
  }], { onConflict: "name,soap_date" });
  if (ins2.error) console.error("master_tracker error", ins2.error.message);
}

async function walk(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) { await walk(p); continue; }
    if (!/\.docx$/i.test(it.name)) continue;
    try { await importOne(p); } catch (e) { console.error("❌", p, e?.message || e); }
    await new Promise(r => setTimeout(r, 80));
  }
}

await walk(ROOT);
console.log(DRY ? "✅ Dry run complete" : "✅ Import complete");
