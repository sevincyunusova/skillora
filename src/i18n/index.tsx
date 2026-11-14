import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, LText } from '../lib/types'
import { dict } from './dict'

const KEY = 'skillora.lang'
const LANGS: Lang[] = ['az', 'en', 'ru']
const IDX: Record<Lang, number> = { az: 0, en: 1, ru: 2 }

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  lt: (v: LText) => string
  date: (iso: string) => string
}
const I18n = createContext<Ctx | null>(null)

function initial(): Lang {
  try {
    const s = localStorage.getItem(KEY)
    if (s && LANGS.includes(s as Lang)) return s as Lang
  } catch { /* */ }
  return 'az'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* */ }
  }, [])
  const value = useMemo<Ctx>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const e = dict[key]
      let s = e ? e[IDX[lang]] || e[1] : key
      if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]))
      return s
    }
    const lt = (v: LText) => (typeof v === 'string' ? v : v[lang])
    const M: Record<Lang, string[]> = {
      az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    }
    const date = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      return `${String(d.getDate()).padStart(2, '0')} ${M[lang][d.getMonth()]} ${d.getFullYear()}`
    }
    return { lang, setLang, t, lt, date }
  }, [lang, setLang])
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export function useI18n() {
  const c = useContext(I18n)
  if (!c) throw new Error('I18nProvider missing')
  return c
}
export const LANG_LIST = LANGS
