import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const text = chat.choices[0]?.message?.content;
    return NextResponse.json({ text });
  } catch (error) {
    console.error('[generate-soap]', error);
    return NextResponse.json({ text: '❌ Failed to generate SOAP.', error });
  }
}
