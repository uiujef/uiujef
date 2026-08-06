'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, ArrowRight, ChevronLeft } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME
    const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (
      validUsername && validPassword &&
      username === validUsername &&
      password === validPassword
    ) {
      // Set simple cookie
      document.cookie = "admin_auth=true; path=/; max-age=86400" // 1 day expiry
      router.push('/blackberry/dashboard')
    } else {
      setError('Invalid credentials. Access denied.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center p-4 relative">
      {/* Back to Home Button */}
      <div className="absolute top-8 left-4 md:left-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-2xl">
            <Lock className="size-8 text-[#F26522]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Classified Access</h1>
          <p className="text-white/50 text-sm">Please authenticate to continue to the administrative terminal.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#F26522]/50 focus:ring-1 focus:ring-[#F26522]/50 transition-all"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#F26522]/50 focus:ring-1 focus:ring-[#F26522]/50 transition-all"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full group relative flex items-center justify-center gap-2 bg-[#F26522] text-white font-bold px-6 py-4 rounded-xl overflow-hidden transition-all hover:bg-[#F26522]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Authenticate</span>
                  <ArrowRight className="size-4 relative z-10 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-white/30">
          UIUJEF Internal Systems &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
