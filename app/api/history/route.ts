import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!; const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export async function GET(req: Request){
  const sb=createClient(url,anon); const sp=new URL(req.url).searchParams;
  const key=(sp.get("name_key")||"").trim(); const limit=Math.min(parseInt(sp.get("limit")||"5",10),20);
  if(!key) return NextResponse.json({rows:[]});
  const {data,error}=await sb.from("v_tracker_history").select("*").eq("name_key",key).order("soap_date",{ascending:false}).limit(limit);
  if(error) return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({rows:data});
}
