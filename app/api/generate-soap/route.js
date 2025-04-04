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
    const prompt = `
    You are assisting a highly skilled veterinarian at Delta Rescue — a no-kill, care-for-life animal sanctuary handling advanced internal medicine, emergencies, geriatrics, and chronic disease.
    
    🧠 GOAL:
    Create a new SOAP note that builds on the provided clinical inputs AND the patient’s historical SOAP notes. You are writing for real medical use — be smart, thorough, and medically sound.
    
    ✍️ FORMAT:
    Return a complete SOAP note in this style:
    - 🩺 Signalment
    - 📚 History
    - 🔍 Clinical Findings
    - 🧠 Assessment (with differentials)
    - 📝 Plan (including diagnostics, weight-based meds, recheck, education)
    
    🎯 INSTRUCTIONS:
    - If input fields are vague, assume plausible clinical defaults.
    - Expand shorthand terms like “ADR” or “HBC”.
    - If weight is provided, use it to calculate mg/kg dosages.
    - If previousSOAPs are provided, build on chronic history, meds, trends, or diagnostics.
    
    🩺 Signalment: {{signalment}}
    📚 History: {{history}}
    🔍 Clinical Findings: {{clinicalFindings}}
    🐾 Patient Weight: {{weight}}
    
    Return a fully formatted Delta-style SOAP note.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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
