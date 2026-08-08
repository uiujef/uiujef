'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = () => {
    document.cookie = 'admin_auth=; Max-Age=0; path=/'
    window.location.href = '/blackberry'
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all font-bold group"
      >
        <LogOut className="size-5" />
        End Session
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md transition-opacity duration-300" onClick={() => setShowConfirm(false)} />
          <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative p-6 md:p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner mb-5">
                <LogOut className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="mb-2 font-serif text-2xl font-bold tracking-tight text-slate-100">End Session?</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Are you sure you want to log out of the admin panel? You will need your password to log back in.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 p-6 pt-0">
              <button
                onClick={handleLogout}
                className="w-full rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 bg-transparent border border-red-900/60 text-red-500 hover:bg-red-950/40 hover:border-red-800 hover:text-red-400"
              >
                Log Out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-lg bg-transparent px-5 py-3 text-sm font-medium text-slate-300 border border-slate-700 transition-colors duration-200 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
