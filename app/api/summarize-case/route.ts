import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { name, soapText } = await req.json();

    const prompt = `You are an AI assistant for veterinarians. Summarize the following SOAP notes for the animal named "${name}" into a clinical summary. Highlight chronic problems, trends, treatments, weight changes, and current status. Keep it medically clear and concise:

---

${soapText}

---

Return a professional, paragraph-style summary suitable for handoff or medical records.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content;
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("🛑 Summary generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize case." },
      { status: 500 }
    );
  }
}
