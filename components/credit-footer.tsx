'use client'

import { usePathname } from 'next/navigation'

export function CreditFooter() {
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <footer className="mt-auto border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-sm tracking-wide text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
          Thoughtfully crafted & engineered by
          <a
            href="https://shaikhjubair.me" /* Replace with your actual portfolio URL */
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif font-bold text-slate-300 transition-all duration-300 hover:text-[#F26522] hover:animate-pulse hover:drop-shadow-[0_0_8px_rgba(242,101,34,0.8)]"
          >
            Shaikh Jubair
          </a>
        </p>
      </div>
    </footer>
  )
}
