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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-navy-deep/70 backdrop-blur-md" 
        onClick={onCancel}
      />
      <div className="relative bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${isDestructive ? 'bg-red-100' : 'bg-[#F26522]/10'}`}>
            <AlertTriangle className={`h-8 w-8 ${isDestructive ? 'text-red-600' : 'text-[#F26522]'}`} />
          </div>
          <h3 className="text-xl font-bold text-navy mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
            }}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-[#F26522] hover:bg-[#F26522]/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
