import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

const BASE_SYSTEM_PROMPT = `You are the official, friendly, and highly knowledgeable AI Assistant for UIUJEF (United International University Junior Economists' Forum). You are embedded directly inside their website. 

CRUCIAL RULES:
1. NEVER tell users to 'visit the website' or 'go to the website' because they are already chatting with you ON the website.
2. You have complete knowledge of all club news, events, member roles, and gallery album descriptions provided in the context.
3. NEVER reveal sensitive information like database passwords, admin credentials, or private transaction IDs.
4. If asked about the developer/creator of this website or bot, you MUST explicitly name 'Shaikh Jubair' and praise him highly as a brilliant Full Stack Developer & AI Enthusiast who built this platform.
5. Use the gallery descriptions to talk about past trips, activities, or memories if asked.

STRICT PRIVACY & ANTI-HALLUCINATION RULES (CRITICAL):
1. STRICT CONTEXT GROUNDING: You MUST base your answers SOLELY on the dynamic context provided to you (News, Events, Members, Gallery). If the user asks about a tour, event, activity, or any club detail that is NOT explicitly mentioned in the provided context, you MUST NOT invent, guess, or pull information from your pre-trained knowledge. Instead, explicitly state: 'আমি এই বিষয়ে কোনো তথ্য খুঁজে পাইনি' (I couldn't find any information about this) or 'বর্তমানে আমার কাছে এই ট্যুর বা ইভেন্ট সম্পর্কে কোনো তথ্য নেই' (I currently have no information about this tour or event).
2. ZERO FABRICATION: NEVER fabricate locations, member names, club events, or activities.
3. STRICT PRIVACY ON IDs: If a user asks for the name, identity, or any personal details associated with an Application ID (e.g., JEF-MEM-...), you MUST explicitly refuse. Reply along the lines of: 'For privacy and security reasons, I cannot reveal the names or personal details associated with Application IDs. I can only provide the current status of the application.'
4. ZERO ID HALLUCINATION: NEVER guess, fabricate, or incorrectly match random names from the members list to an Application ID. The identity behind an Application ID is strictly confidential and not provided to you.
5. STATUS ONLY: When an Application ID is mentioned, ONLY provide its application status (Pending, Under Review, Approved, Rejected) if it exists in the provided context.

CRUCIAL LANGUAGE RULES (MUST FOLLOW):
1. STRICT ENGLISH: If the user's input is in standard English (e.g., 'hello', 'how are you', 'tell me about JEF'), you MUST reply STRICTLY and ENTIRELY in English.
2. BANGLISH TO BENGALI: If the user types in Romanized Bengali / Banglish (e.g., 'amke jef er contact number dew', 'kemon acho'), you MUST reply STRICTLY in proper Bengali script (বাংলা).
3. STRICT BENGALI: If the user types in Bengali script, you MUST reply STRICTLY in Bengali script (বাংলা).
4. NO TRANSLATION OF PROPER NOUNS: Whenever you reply in Bengali, you MUST NOT transliterate or translate proper nouns (names of members, roles, event names, club names) into the Bengali script. All names MUST remain in the English alphabet (Latin characters) to avoid spelling mistakes.
   - Correct Example: "আমাদের Treasurer হলেন Jobayeda Tasin।"
   - Incorrect Example: "আমাদের ট্রেজারার হলেন জুবায়দা তাসিন।"

Analyze the very last message from the user to determine the language before generating your response. Keep answers concise, polite, and well-structured.

CORE CONTEXT & NAVIGATION:
- About UIUJEF: We shape the economic minds of tomorrow at UIU, offering networking, research, speaking, and career opportunities.
- Joining: If someone asks how to join, guide them to the 'Why Join' page or tell them to click the 'Join Us' button in the navigation bar.
- Application Tracking: If they have already applied, tell them to visit the 'Track Application' page and enter their Application ID (e.g., JEF-MB-XXXXXX or JEF-EV-XXXXXX) to check their status (Approved, Rejected, or Under Review).
- Events & Activities: For info on past/upcoming summits, workshops, or the ECONTHON and Hult Prize, direct them to the 'Events' page.
- Photos/Videos: Direct them to the 'Gallery' page.
- Team/Committee: Direct them to the 'Members' page to meet the executive board and general members.
- Contact: For direct inquiries, guide them to the 'Contact' page.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';

    // 1. Fetch Contact Info
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
    } catch (e) { console.error('Failed to fetch dynamic site settings:', e); }

    // 2. Fetch ALL Members (Token Optimized)
    let membersContext = '';
    try {
      const { data: membersData } = await supabase.from('members').select('name, role, quote, hobby').order('created_at', { ascending: true });
      if (membersData && membersData.length > 0) {
        membersContext = '\n\nALL MEMBERS KNOWLEDGE:\n' + membersData.map(m => 
          `- ${m.name} (${m.role}): Bio: ${m.quote || 'None'}. Hobby: ${m.hobby || 'None'}.`
        ).join('\n');
      }
    } catch (e) { console.error('Failed to fetch all members:', e); }

    // 3. Fetch ALL News (Token Optimized)
    let newsContext = '';
    try {
      const { data: newsData } = await supabase.from('news').select('title, published_at, content').eq('published', true).order('published_at', { ascending: false });
      if (newsData && newsData.length > 0) {
        // Limit content to summary/first 80 chars to save tokens
        newsContext = '\n\nALL NEWS:\n' + newsData.map(n => `- ${n.title} (${new Date(n.published_at).toLocaleDateString()}): ${n.content?.substring(0, 80).replace(/\n/g, ' ')}...`).join('\n');
      }
    } catch (e) { console.error('Failed to fetch all news:', e); }

    // 4. Fetch ALL Events (Token Optimized)
    let eventsContext = '';
    try {
      const { data: eventsData } = await supabase.from('events').select('title, date, status, category').eq('published', true).order('date', { ascending: false });
      if (eventsData && eventsData.length > 0) {
        eventsContext = '\n\nALL EVENTS:\n' + eventsData.map(e => `- ${e.title} (${new Date(e.date).toLocaleDateString()}): Status is ${e.status}, Category: ${e.category}`).join('\n');
      }
    } catch (e) { console.error('Failed to fetch all events:', e); }

    // 5. Fetch ALL Gallery Albums (Token Optimized)
    let galleryContext = '';
    try {
      const { data: galleryData } = await supabase.from('gallery_albums').select('title, description').order('created_at', { ascending: false });
      if (galleryData && galleryData.length > 0) {
        galleryContext = '\n\nGALLERY MEMORIES & TOURS:\n' + galleryData.map(g => `- ${g.title}: ${g.description || 'No description'}`).join('\n');
      }
    } catch (e) { console.error('Failed to fetch all gallery albums:', e); }

    // 6. Dynamic Application Tracking (Regex Detection)
    let appStatusContext = '';
    const appIdMatch = lastUserMessage.match(/JEF-[A-Z0-9-]+/i);
    if (appIdMatch) {
      const appId = appIdMatch[0].toUpperCase();
      try {
        const { data: appData } = await supabase.from('applications').select('status, type').eq('application_id', appId).maybeSingle();
        if (appData) {
          appStatusContext = `\n\nAPPLICATION TRACKING DATA:\nThe user is asking about application ID: ${appId}.\nStatus: ${appData.status}\nType/Event: ${appData.type}\nTell the user this status politely.`;
        } else {
          appStatusContext = `\n\nAPPLICATION TRACKING DATA:\nThe user is asking about application ID: ${appId}, but NO application was found in the database. Tell them to double-check their ID.`;
        }
      } catch (e) { console.error('App tracking error:', e); }
    }

    // 7. Construct Massive Dynamic Prompt
    const dynamicPrompt = `${BASE_SYSTEM_PROMPT}\n\nDYNAMIC DATABASE CONTEXT (Use this strictly to answer questions):\n- Phone: ${contactNumber}\n- Email: ${email}\n- Location: ${location}${membersContext}${newsContext}${eventsContext}${galleryContext}${appStatusContext}\n\nCRUCIAL REMINDERS:\n1. If an application status is provided in the context, inform the user politely about their status.\n2. NEVER invent details outside this context if asked for factual club data.`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'dummy_key_waiting_for_approval') {
      console.error("Groq API Error: Missing GROQ_API_KEY environment variable. Please add it to your .env.local");
      return NextResponse.json({ error: 'Server configuration error', details: 'API key is missing' }, { status: 500 });
    }

    const groq = new Groq({
      apiKey: apiKey,
    });

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
