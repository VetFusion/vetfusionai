// ✅ FULL VetFusionAI SOAP Generation API Route
// Supports GPT-3.5 and GPT-4 toggle, Supabase fallback, planOverride, full SOAP output

export const config = {
  runtime: 'nodejs',
};

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ✅ Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ✅ Helper: Get previous SOAPs
async function fetchPreviousSOAPs(animalName) {
  try {
    const { data, error } = await supabase
      .from('master_tracker')
      .select('Full_SOAP')
      .ilike('Name', animalName.trim())
      .order('SOAP_Date', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Supabase fetch error:', error);
      return [];
    }

    return data.map((entry) => entry.Full_SOAP);
  } catch (e) {
    console.error('🔥 Supabase fetch failed:', e);
    return [];
  }
}

export async function POST(req) {
  console.log('📩 /api/generate-soap route hit');

  try {
    const body = await req.json();
    const {
      signalment = 'Unknown signalment',
      history = 'No relevant history provided.',
      clinicalFindings = 'No findings provided.',
      weight = 'N/A',
      location = 'Unknown',
      planOverride = '',
      model = 'gpt-3.5-turbo',
      animalName = '',
      useHistory = true,
    } = body;

    let previousSOAPs = [];
    if (useHistory && animalName) {
      previousSOAPs = await fetchPreviousSOAPs(animalName);
    }

    const pastSOAPText = previousSOAPs.length
      ? previousSOAPs.map((soap, i) => `#${i + 1}:
${soap}`).join('\n\n')
      : 'None available.';

    const prompt = `
You are a medical AI assisting a veterinarian at Delta Rescue — a no-kill, care-for-life sanctuary handling complex internal medicine, geriatrics, and chronic disease.

🎯 OBJECTIVE:
Generate a complete SOAP note in Delta's style using the input below.

🩺 Signalment: ${signalment}
📚 History: ${history}
🔍 Clinical Findings: ${clinicalFindings}
⚖️ Weight: ${weight} kg
📍 Location: ${location}
📜 Previous SOAPs:
${pastSOAPText}

📝 Plan Override: ${planOverride || 'None'}

💡 Instructions:
- Expand on vague input (e.g., "ADR" → "Ain’t Doing Right")
- Include a short **assessment** with differentials
- Build a practical **plan**, including diagnostics, meds (with dosages if weight given), recheck, and technician notes
- If planOverride is included, use that content but still format it cleanly
- Write clearly using emojis, section headers, and line breaks

💊 OUTPUT FORMAT:
📌 **SOAP Note**
- 🩺 Signalment
- 📚 History
- 🔍 Clinical Findings
- 🧠 Assessment (with differentials)
- 📝 Plan (diagnostics, meds, follow-up)
- 🛠️ Tech Notes (fluid given, meds given today)
- ✅ Summary (case status + recheck date if needed)

Write as if going directly into a real patient record.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const soapNote = completion.choices[0].message.content;
    console.log('✅ SOAP note generated.');
    return NextResponse.json({ soapNote });
  } catch (error) {
    console.error('🛑 AI generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'AI generation failed' },
      { status: 500 }
    );
  }
}
