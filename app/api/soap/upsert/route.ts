// app/api/soap/upsert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { soap, trackerRow } = await req.json() as {
      soap: { content: string, animal_name?: string, soap_date?: string } ;
      trackerRow: {
        Name: string;
        SOAP_Date: string; // YYYY-MM-DD
        Ward?: string | null;
        Location?: string | null;
        Area?: string | null;
        Cage?: string | null;
        Snippet?: string | null;
      };
    };

    // 1) Insert full SOAP (adjust table/columns if different)
    const ins1 = await sb.from("soap_notes").insert([{
      animal_name: trackerRow.Name,
      soap_date: trackerRow.SOAP_Date,
      case_summary: soap.content,
    }]).select().single();

    if (ins1.error) return NextResponse.json({ error: ins1.error.message }, { status: 500 });

    // 2) Upsert minimal tracker row (onConflict: Name, SOAP_Date)
    const up = await sb.from("master_tracker").upsert([{
      Name: trackerRow.Name,
      SOAP_Date: trackerRow.SOAP_Date,
      Ward: trackerRow.Ward ?? null,
      Location: trackerRow.Location ?? null,
      Area: trackerRow.Area ?? null,
      Cage: trackerRow.Cage ?? null,
      Snippet: trackerRow.Snippet ?? null,
    }], { onConflict: "Name,SOAP_Date" }).select().single();

    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

    return NextResponse.json({ ok: true, soap_id: ins1.data?.id, tracker: up.data });
  } catch (e: any) {
    console.error("upsert failed", e);
    return NextResponse.json({ error: e?.message || "Upsert failed" }, { status: 500 });
  }
}
