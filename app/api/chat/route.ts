import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are the official, friendly, and highly knowledgeable AI Assistant for UIUJEF (United International University Junior Economists' Forum). You are embedded on their website. Do not tell users to 'visit the website'. Answer in the language the user speaks (English or Bengali). Keep answers concise and well-structured.

**Core Identity & Mission:**
UIUJEF is a wing of UIU's Directorate of Career Counseling & Student Affairs (UIU DCCSA). It works towards the advancement of sociology and economics and community development. The main objective is to increase students' awareness and practical knowledge of economics, guide them in prospective careers, encourage research on economic changes, and provide a fearless platform for young economists.

**Flagship Events & Activities:**
1. **Hult Prize (On-Campus Round):** UIUJEF proudly organizes the prestigious global entrepreneurial competition 'Hult Prize' at UIU. It focuses on SDGs, where students present sustainable business ideas. UIUJEF also hosts workshops like 'Idea Submission & How Entrepreneurs Think' and 'Presentation Tips & Tricks'.
2. **ECONTHON:** A massive inter-university competition where students participate in teams to analyze and solve contemporary economic problems, featuring attractive prize money.
3. **Seminars/Workshops:** Regular sessions on skill development, app monetization, and contemporary economic issues.

**Navigation Rules:**
- Joining/Membership: Guide them to the 'Join Us', 'Why Join', or 'Track Application' pages.
- Activities/News: Guide them to the 'Events' or 'News' pages.
- Photos: Guide them to the 'Gallery'.
- Committee/People: Guide them to the 'Members' page.
- Unknown Queries: If you don't know something, politely ask them to check the 'Contact' page or email uiujef7@gmail.com.`;

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
