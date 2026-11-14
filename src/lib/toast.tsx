import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface T { id: number; kind: Kind; text: string }
const Ctx = createContext<{ push: (text: string, kind?: Kind) => void } | null>(null)
let n = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((text: string, kind: Kind = 'success') => {
    const id = ++n
    setItems((x) => [...x, { id, kind, text }])
    window.setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800)
  }, [])
  const v = useMemo(() => ({ push }), [push])
  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 print:hidden" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((i) => (
            <motion.div key={i.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 pr-2 shadow-lg">
              {i.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-olive" /> : i.kind === 'error' ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" /> : <Info size={18} className="mt-0.5 shrink-0 text-violet" />}
              <p className="flex-1 text-sm text-ink">{i.text}</p>
              <button className="rounded p-1 text-mute hover:text-ink" onClick={() => setItems((x) => x.filter((y) => y.id !== i.id))} aria-label="close"><X size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('ToastProvider missing')
  return c.push
}
