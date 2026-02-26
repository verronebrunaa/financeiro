"use client"
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

type Toast = { id: string; title?: string; message: string; variant?: 'info' | 'success' | 'error' }

type ToastContext = {
  show: (t: Omit<Toast, 'id'>) => void
}

const ctx = createContext<ToastContext | null>(null)

export function useToast() {
  const c = useContext(ctx)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((s) => [{ id, ...t }, ...s])
    // auto remove
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4500)
  }, [])

  const remove = useCallback((id: string) => setToasts((s) => s.filter((x) => x.id !== id)), [])

  return (
    <ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-xs w-full p-3 rounded-lg shadow-lg border ${t.variant === 'error' ? 'bg-red-50 border-red-200' : t.variant === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {t.title && <div className="font-bold text-sm text-slate-800 mb-0.5">{t.title}</div>}
                <div className="text-sm text-slate-700">{t.message}</div>
              </div>
              <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ctx.Provider>
  )
}
