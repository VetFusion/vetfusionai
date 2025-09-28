import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!; const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export async function GET(req: Request) {
  const sb = createClient(url, anon); const sp = new URL(req.url).searchParams;
  const q=(sp.get("q")||"").trim(), from=sp.get("from")||"", to=sp.get("to")||"", ward=(sp.get("ward")||"").trim();
  const due=sp.get("due")==="1"; const sort=(sp.get("sort")||"date") as "date"|"name"; const dir=(sp.get("dir")||"desc") as "asc"|"desc";
  const limit=Math.min(parseInt(sp.get("limit")||"200",10),1000); const format=(sp.get("format")||"json") as "json"|"csv";
  let qy = sb.from("v_tracker_latest_per_animal").select("*");
  if(q) qy=qy.ilike("name",`%${q}%`); if(from) qy=qy.gte("soap_date",from); if(to) qy=qy.lte("soap_date",to);
  if(ward) qy=qy.ilike("ward",`${ward}%`); if(due) qy=qy.gt("days_since",30);
  qy=qy.order(sort==="name"?"name":"soap_date",{ascending:dir==="asc"}).limit(limit);
  const {data,error}=await qy; if(error) return NextResponse.json({error:error.message},{status:400});
  if(format==="csv"){const cols=["soap_date","name","ward","area","cage","location","days_since","soap_id","name_key"];
    const csv=[cols.join(","),...(data??[] as any[]).map(r=>cols.map(h=>{const s=String(r[h]??"");return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}).join(","))].join("\n");
    return new NextResponse(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=tracker.csv"}});}
  return NextResponse.json({rows:data});
}
