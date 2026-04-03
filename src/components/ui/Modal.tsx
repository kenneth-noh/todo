import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl max-h-[92svh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        <div className="h-safe-bottom" />
      </div>
    </div>
  )
}
