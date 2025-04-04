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
    const prompt = "Say hi 👋 from VetFusionAI!";

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
