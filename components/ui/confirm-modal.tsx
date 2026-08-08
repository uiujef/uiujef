'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
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
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md transition-opacity duration-300" 
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div 
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-navy-deep/20 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="relative p-8 text-center bg-gradient-to-b from-gray-50/50 to-white">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm mb-6 ${isDestructive ? 'bg-red-50 text-red-500 shadow-red-500/10' : 'bg-[#F26522]/10 text-[#F26522] shadow-[#F26522]/10'}`}>
            <AlertTriangle strokeWidth={2.5} className="h-7 w-7" />
          </div>
          
          <h3 className="mb-3 font-serif text-2xl font-bold tracking-tight text-navy">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>
        
        <div className="flex flex-col gap-3 p-6 pt-2">
          <button
            onClick={() => {
              onConfirm()
            }}
            className={`w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
              isDestructive 
                ? 'bg-red-600 shadow-red-600/20 hover:bg-red-500 hover:shadow-red-500/30' 
                : 'bg-[#F26522] shadow-[#F26522]/20 hover:bg-[#FF7A3D] hover:shadow-[#F26522]/30'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-2xl bg-gray-100 px-5 py-3.5 text-sm font-medium text-navy transition-colors duration-200 hover:bg-gray-200"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
