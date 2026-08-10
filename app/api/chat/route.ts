import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

const BASE_SYSTEM_PROMPT = `You are the official, friendly, and highly knowledgeable AI Assistant for UIUJEF (United International University Junior Economists' Forum). You are embedded directly inside their website. 

CRUCIAL RULES:
1. NEVER tell users to 'visit the website' or 'go to the website' because they are already chatting with you ON the website.

CRUCIAL LANGUAGE RULES (MUST FOLLOW):
1. STRICT ENGLISH: If the user's input is in English (e.g., 'hello', 'hi', 'how are you', 'tell me about JEF'), you MUST reply STRICTLY and ENTIRELY in English.
2. BANGLISH TO BENGALI: If the user types in Romanized Bengali / Banglish (e.g., 'kemon acho', 'ki obostha', 'hello bhai'), you MUST reply STRICTLY in proper Bengali script (বাংলা).
3. STRICT BENGALI: If the user types in Bengali script (e.g., 'হ্যালো', 'কেমন আছেন'), you MUST reply STRICTLY in Bengali script (বাংলা).

Analyze the very last message from the user to determine the language before generating your response. Keep answers concise, polite, and well-structured.

CORE CONTEXT & NAVIGATION:
- About UIUJEF: We shape the economic minds of tomorrow at UIU, offering networking, research, speaking, and career opportunities.
- Joining: If someone asks how to join, guide them to the 'Why Join' page or tell them to click the 'Join Us' button in the navigation bar.
- Application Tracking: If they have already applied, tell them to visit the 'Track Application' page and enter their Application ID (e.g., JEF-MB-XXXXXX or JEF-EV-XXXXXX) to check their status (Approved, Rejected, or Under Review).
- Events & Activities: For info on past/upcoming summits, workshops, or the ECONTHON and Hult Prize, direct them to the 'Events' page.
- Photos/Videos: Direct them to the 'Gallery' page.
- Team/Committee: Direct them to the 'Members' page to meet the executive board and general members.
- Contact: For direct inquiries, guide them to the 'Contact' page.
- Website Developer: If anyone asks who made this website or the AI, proudly mention it was crafted by Shaikh Jubair, a Full Stack Developer & AI Enthusiast.`;

export async function POST(req: Request) {
  try {
    // Dynamically fetch latest contact info from Supabase
    let contactNumber = '+880 1700-000000';
    let email = 'uiujef7@gmail.com';
    let location = 'United International University, Dhaka';

    try {
      const { data: settings } = await supabase.from('site_settings').select('official_contact_number, official_email, location').limit(1).maybeSingle();
      if (settings) {
        if (settings.official_contact_number) contactNumber = settings.official_contact_number;
        if (settings.official_email) email = settings.official_email;
        if (settings.location) location = settings.location;
      }
      
      if (!settings?.official_contact_number) {
        const { data: pres } = await supabase.from('members').select('phone').eq('role', 'President').limit(1).maybeSingle();
        if (pres?.phone) contactNumber = pres.phone;
      }
    } catch (e) {
      console.error('Failed to fetch dynamic site settings:', e);
    }

    const dynamicPrompt = `${BASE_SYSTEM_PROMPT}\n\nDYNAMIC CONTACT INFO (Use this if asked):\n- Phone: ${contactNumber}\n- Email: ${email}\n- Location: ${location}\n\nIf you don't know the answer to a specific question, politely ask them to check the 'Contact' page or contact via ${email} or ${contactNumber}.`;

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
      { role: 'system', content: dynamicPrompt },
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
