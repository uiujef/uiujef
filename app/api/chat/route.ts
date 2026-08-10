import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are a helpful, enthusiastic, and knowledgeable AI assistant for UIUJEF (United International University Junior Economists' Forum).
Your goal is to answer questions about the forum, its events, summits, membership, and general economics topics.
Always be polite and keep your answers concise. If you don't know the answer, direct the user to contact the executive panel or visit the UIUJEF website.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'dummy_key_waiting_for_approval') {
      console.error("Groq API Error: Missing GROQ_API_KEY environment variable. Please add it to your .env.local");
      return NextResponse.json({ error: 'Server configuration error', details: 'API key is missing' }, { status: 500 });
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Format messages for Groq API
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.1-8b-instant', // Latest supported Groq model
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseContent = completion.choices[0]?.message?.content || 'I am currently unavailable. Please try again later.';

    return NextResponse.json({ message: responseContent });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
