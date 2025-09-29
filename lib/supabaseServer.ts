// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!service) {
  console.warn("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY; /api lookups may be blocked by RLS.");
}

export const supabaseServer = () =>
  createClient(url, service!, { auth: { persistSession: false } });
