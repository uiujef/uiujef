'use client'

import { AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
  requireText?: string
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = true,
  requireText,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isConfirmDisabled = requireText ? inputValue.toLowerCase() !== requireText.toLowerCase() : false

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-md transition-opacity duration-300" 
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div 
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="relative p-6 md:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-inner mb-5">
            <AlertTriangle strokeWidth={2} className={`h-6 w-6 ${isDestructive ? 'text-red-400' : 'text-[#F26522]'}`} />
          </div>
          
          <h3 className="mb-2 font-serif text-2xl font-bold tracking-tight text-slate-100">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{message}</p>
        </div>
        
        {requireText && (
          <div className="px-6 pb-2">
            <label className="block text-sm text-slate-400 mb-2 font-medium">
              Type <span className="text-white font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 select-none">"{requireText}"</span> to confirm.
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] transition-colors placeholder-slate-600"
              placeholder={`Type "${requireText}"`}
            />
          </div>
        )}
        
        <div className="flex flex-col gap-3 p-6 pt-0">
          <button
            disabled={isConfirmDisabled}
            onClick={() => {
              onConfirm()
            }}
            className={`w-full rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive 
                ? 'bg-transparent border border-red-900/60 text-red-500 hover:not-disabled:bg-red-950/40 hover:not-disabled:border-red-800 hover:not-disabled:text-red-400' 
                : 'bg-[#F26522] text-white hover:not-disabled:bg-[#F26522]/90 border border-[#F26522]/50'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-lg bg-transparent px-5 py-3 text-sm font-medium text-slate-300 border border-slate-700 transition-colors duration-200 hover:bg-slate-800 hover:text-white"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
