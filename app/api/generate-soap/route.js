import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { prompt } = await req.json();

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return NextResponse.json({ text: chat.choices[0]?.message?.content });
  } catch (error) {
    console.error('SOAP generation error:', error);
    return NextResponse.json({ text: '❌ Error generating SOAP' });
  }
}
