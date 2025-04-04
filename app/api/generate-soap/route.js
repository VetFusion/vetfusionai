export const config = {
  runtime: 'nodejs',
};

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  console.log("📩 /api/generate-soap route hit");

  try {
    const body = await req.json();
    const {
      signalment = "Unknown signalment",
      history = "No relevant history provided.",
      clinicalFindings = "No findings provided.",
      weight = "N/A",
      location = "Unknown",
      planOverride = "",
    } = body;

    const prompt = `
You are a medical AI assisting a veterinarian at Delta Rescue — a no-kill, care-for-life sanctuary handling complex internal medicine, geriatrics, and chronic disease.

🎯 OBJECTIVE:
Generate a complete SOAP note in Delta's style using the input below.

🩺 Signalment: ${signalment}
📚 History: ${history}
🔍 Clinical Findings: ${clinicalFindings}
⚖️ Weight: ${weight} kg
📍 Location: ${location}
📋 Plan Override: ${planOverride || "None"}

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

Write as if going directly into a real patient record.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const soapNote = completion.choices[0].message.content;
    console.log("✅ SOAP note generated.");
    return NextResponse.json({ soapNote });

  } catch (error) {
    console.error("🛑 AI generation failed:", error);
    return NextResponse.json(
      { error: error.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
