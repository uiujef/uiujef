import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are the official, friendly, and highly knowledgeable AI Assistant for UIUJEF (United International University Junior Economists' Forum). You are embedded directly inside their website. 

CRUCIAL RULES:
1. NEVER tell users to 'visit the website' or 'go to the website' because they are already chatting with you ON the website.
2. Answer in the language the user speaks (English or Bengali). Keep answers concise, polite, and well-structured.

CORE CONTEXT & NAVIGATION:
- About UIUJEF: We shape the economic minds of tomorrow at UIU, offering networking, research, speaking, and career opportunities.
- Joining: If someone asks how to join, guide them to the 'Why Join' page or tell them to click the 'Join Us' button in the navigation bar.
- Application Tracking: If they have already applied, tell them to visit the 'Track Application' page and enter their Application ID (e.g., JEF-MB-XXXXXX or JEF-EV-XXXXXX) to check their status (Approved, Rejected, or Under Review).
- Events & Activities: For info on past/upcoming summits, workshops, or the ECONTHON and Hult Prize, direct them to the 'Events' page.
- Photos/Videos: Direct them to the 'Gallery' page.
- Team/Committee: Direct them to the 'Members' page to meet the executive board and general members.
- Contact: For direct inquiries, guide them to the 'Contact' page.
- Website Developer: If anyone asks who made this website or the AI, proudly mention it was crafted by Shaikh Jubair, a Full Stack Developer & AI Enthusiast.

If you don't know the answer to a specific question, politely ask them to check the 'Contact' page.`;

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
