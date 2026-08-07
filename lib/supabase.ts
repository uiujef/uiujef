import { createClient } from '@supabase/supabase-js'

// 💡 FIX: || '' সরিয়ে দেওয়া হলো যাতে ফাঁকা ভ্যালু না যায়
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 💡 FIX: ব্রাউজারের কনসোলে চেক করার জন্য লগ বসানো হলো
if (typeof window !== 'undefined') {
  console.log("Supabase URL Check:", supabaseUrl ? "✅ Found" : "❌ Missing!")
}

if (!supabaseUrl || !supabaseAnonKey) {
  // 💡 FIX: শুধু ওয়ার্নিং নয়, বরং কড়া এরর থ্রো করবে যাতে আমরা ধরতে পারি
  throw new Error('Supabase environment variables are missing! Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  }
})