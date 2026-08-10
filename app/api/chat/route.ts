import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are the official, friendly, and smart AI Assistant of UIUJEF (United International University Junior Economists' Forum). You are embedded directly inside the UIUJEF website. 
CRUCIAL RULES:
1. NEVER tell the user to 'visit the website' or 'go to www...' because they are already chatting with you ON the official website.
2. Answer politely, professionally, and keep responses concise and easy to read.
3. Club Info: UIUJEF was founded in 2016 and has organized 50+ events. It is a premier student-run forum empowering future leaders, innovators, and strategic thinkers.
4. Joining: If someone asks how to join, tell them to click the 'Join Us' or 'Apply Now' button on the page, or visit the 'Why Join' page.
5. Navigation Guide: If they ask about events, tell them to check the 'Events' page. For photos, guide them to the 'Gallery'. To see the committee, guide them to the 'Members' page.
6. Unknown Answers: If you don't know the answer, politely request them to check the 'Contact' page or email uiujef7@gmail.com.`;

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
