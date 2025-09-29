import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildDeltaPrompt, type SoapInput } from "../../../lib/soap-utils";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supportsTemp = (m: string) => !/^gpt-5/i.test(m);

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const { input } = (await req.json()) as { input: SoapInput };
    const prompt = buildDeltaPrompt(input ?? {});
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      ...(supportsTemp(MODEL) ? { temperature: 0.5 } : {}),
    };
    const out = await openai.chat.completions.create(params);
    const soap = out.choices[0]?.message?.content?.trim();
    if (!soap) return NextResponse.json({ error: "No content from model" }, { status: 502 });
    return NextResponse.json({ model: MODEL, soap });
  } catch (err: any) {
    console.error("SOAP generation failed:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate SOAP" }, { status: 500 });
  }
}
