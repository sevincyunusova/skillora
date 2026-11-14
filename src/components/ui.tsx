import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useI18n } from '../i18n'

/* ---------- Magnetic wrapper ---------- */
export function Magnetic({ children, strength = 0.28, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })
  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- 3D tilt card ---------- */
export function Tilt({ children, className = '', max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 160, damping: 16 })
  const sry = useSpring(ry, { stiffness: 160, damping: 16 })
  return (
    <motion.div
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        if (reduce) return
        const r = e.currentTarget.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2)
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2)
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0) }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Animated counter ---------- */
export function Counter({ value, decimals = 0, suffix = '', duration = 1.4 }: { value: number; decimals?: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => {
    if (!inView) return
    if (reduce) { setShown(value); return }
    const c = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [inView, value, duration, reduce])
  return <span ref={ref}>{shown.toFixed(decimals)}{suffix}</span>
}

/* ---------- Animated text reveal ---------- */
export function RevealText({ text, className = '', delay = 0, as: Tag = 'span' }: { text: string; className?: string; delay?: number; as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' }) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  const M = motion[Tag]
  return (
    <M className={className} initial="h" whileInView="v" viewport={{ once: true, margin: '-10%' }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            variants={{ h: { y: reduce ? 0 : '110%', opacity: reduce ? 1 : 0 }, v: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.7, delay: delay + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </M>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="h-page">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-sm text-mute md:text-base">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ name, hue, size = 40 }: { name: string; hue: number; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-charcoal"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `conic-gradient(from ${hue}deg, #D5E45A, #A9B96A, #82758F, #D5E45A)` }}
      aria-hidden
    >
      <span className="grid h-[84%] w-[84%] place-items-center rounded-full bg-surface text-ink">{initials}</span>
    </div>
  )
}

/* ---------- Score ring ---------- */
export function ScoreRing({ value, size = 96, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 85 ? 'rgb(var(--accent))' : value >= 70 ? '#9DAA5A' : value >= 50 ? '#82758F' : '#A06A5A'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-bold leading-none" style={{ fontSize: size * 0.27 }}>{Math.round(value)}<span className="text-mute" style={{ fontSize: size * 0.15 }}>%</span></div>
          {label && <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-mute">{label}</div>}
        </div>
      </div>
    </div>
  )
}

export function ScoreBadge({ value }: { value: number }) {
  const cls = value >= 85 ? 'bg-accent text-accent-ink' : value >= 70 ? 'bg-olive/25 text-ink' : value >= 50 ? 'bg-violet/25 text-ink' : 'bg-red-500/15 text-red-700 dark:text-red-300'
  return <span className={`inline-flex min-w-[3.2rem] items-center justify-center rounded-full px-2.5 py-1 font-mono text-xs font-medium ${cls}`}>{Math.round(value)}%</span>
}

/* ---------- Level pips ---------- */
export function Level({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`h-1.5 w-3.5 rounded-full ${i < value ? 'bg-brand' : 'bg-line'}`} />
      ))}
    </span>
  )
}

export function Bar({ value, className = '', color = 'bg-brand' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-line/70 ${className}`}>
      <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide = false, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-charcoal/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 text-mute hover:bg-surface2 hover:text-ink" aria-label="close"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, text }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; text: string }) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button><button className="btn btn-dark" onClick={() => { onConfirm(); onClose() }}>{t('common.delete')}</button></>}>
      <p className="text-sm text-mute">{text}</p>
    </Modal>
  )
}

/* ---------- Form fields ---------- */
export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-mute">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  )
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`input ${p.className ?? ''}`} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`input pr-8 ${p.className ?? ''}`} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`input min-h-[90px] ${p.className ?? ''}`} />

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-10" aria-label={placeholder} />
    </div>
  )
}

export function Btn({ variant = 'primary', size, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'danger'; size?: 'sm' }) {
  return <button {...p} className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} />
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center gap-2 border-dashed p-10 text-center">
      <div className="h-10 w-10 rotate-45 rounded-md border-2 border-dashed border-brand/60" />
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-mute">{text}</p>}
      {action}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="no-print inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1" role="tablist">
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)}
          className={`relative whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${value === it.id ? 'text-accent-ink' : 'text-mute hover:text-ink'}`}>
          {value === it.id && <motion.span layoutId={`tab-${items.map((i) => i.id).join('')}`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', damping: 28, stiffness: 340 }} />}
          <span className="relative">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Stagger({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial="h" animate="v" variants={{ v: { transition: { staggerChildren: 0.05 } } }}>{children}</motion.div>
}
export const fadeUp = { h: { opacity: 0, y: 14 }, v: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } }

export function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const q = window.matchMedia('(max-width: 767px)')
    const h = () => setM(q.matches)
    q.addEventListener('change', h)
    return () => q.removeEventListener('change', h)
  }, [])
  return m
}

export function useParallax(amount = 40) {
  const y = useMotionValue(0)
  return { y: useTransform(y, (v) => v * amount) }
}
