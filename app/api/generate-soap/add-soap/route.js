import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()

    const { error } = await supabase
      .from('master_tracker')
      .upsert([body], { onConflict: ['Name', 'SOAP_Date'] })

    if (error) {
      console.error('Supabase Error:', error)
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Unexpected Error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}
