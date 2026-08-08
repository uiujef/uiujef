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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">End Session?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to log out of the admin panel? You will need your password to log back in.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
