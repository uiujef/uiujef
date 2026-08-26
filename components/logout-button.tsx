'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    document.cookie = 'admin_auth=; Max-Age=0; path=/'
    window.location.href = '/blackberry'
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowConfirm(false)} />
      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="relative p-6 md:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 border border-red-100 mb-5">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">End Session?</h3>
          <p className="text-sm leading-relaxed text-slate-500">
            Are you sure you want to log out of the admin panel? You will need your password to log back in.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 p-6 pt-0">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 shadow-sm"
          >
            Log Out
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="w-full rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 border border-slate-200 transition-colors duration-200 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all font-medium group border border-transparent hover:border-red-100"
      >
        <LogOut className="size-5" />
        End Session
      </button>

      {mounted && showConfirm && createPortal(modalContent, document.body)}
    </>
  )
}
