import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to allow inserts
);

export async function POST(req: Request) {
  const data = await req.json();

  const { data: insertData, error } = await supabase
    .from('MasterTracker')
    .insert([data]);

  if (error) {
    console.error('Supabase Insert Error:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: insertData }, { status: 200 });
}
