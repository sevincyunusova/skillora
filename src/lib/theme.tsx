import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
const KEY = 'skillora.theme'
const Ctx = createContext<{ theme: Theme; toggle: () => void } | null>(null)

function initial(): Theme {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'dark' || s === 'light') return s
  } catch { /* */ }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initial)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  const toggle = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-anim')
    setTheme((t) => {
      const n = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(KEY, n) } catch { /* */ }
      return n
    })
    window.setTimeout(() => root.classList.remove('theme-anim'), 500)
  }, [])
  const v = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
export function useTheme() {
  const c = useContext(Ctx)
  if (!c) throw new Error('ThemeProvider missing')
  return c
}
