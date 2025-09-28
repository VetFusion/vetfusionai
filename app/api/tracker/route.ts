import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request) {
  const supabase = createClient(url, anon);
  const { searchParams } = new URL(req.url);

  const q     = (searchParams.get("q") || "").trim();
  const from  = searchParams.get("from") || "";
  const to    = searchParams.get("to") || "";
  const ward  = (searchParams.get("ward") || "").trim();
  const due   = searchParams.get("due") === "1";           // >30d only
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 1000);

  const sort  = (searchParams.get("sort") || "date") as "date"|"name"|"ward";
  const dir   = (searchParams.get("dir")  || "desc") as "asc"|"desc";
  const format= (searchParams.get("format") || "json") as "json"|"csv";

  let query = supabase.from("v_tracker_latest_per_animal").select("*");

  if (q)    query = query.ilike("name", `%${q}%`);
  if (from) query = query.gte("soap_date", from);
  if (to)   query = query.lte("soap_date", to);
  if (ward) query = query.ilike("location", `${ward}%`);
  if (due)  query = query.gt("days_since", 30);

  // sort mapping
  const sortCol = sort === "name" ? "name"
                : sort === "ward" ? "ward"
                : "soap_date"; // date
  query = query.order(sortCol, { ascending: dir === "asc" });

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (format === "csv") {
    const headers = ["soap_date","name","ward","area","cage","location","days_since","soap_id"];
    const lines = [
      headers.join(","),
      ...((data ?? []) as any[]).map(r =>
        headers.map(h => {
          const v = r[h] ?? "";
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
        }).join(",")
      )
    ].join("\n");
    return new NextResponse(lines, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=tracker.csv",
      },
    });
  }

  return NextResponse.json({ rows: data });
}
