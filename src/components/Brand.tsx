import { Link } from 'react-router-dom'
import { Moon, Sun, Languages } from 'lucide-react'
import { useI18n, LANG_LIST } from '../i18n'
import { useTheme } from '../lib/theme'

export function Logo({ size = 28, to = '/', text = true }: { size?: number; to?: string; text?: boolean }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="Skillora">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#20221F" />
        <path d="M16 5.5l8.6 5v11L16 26.5l-8.6-5v-11z" fill="#D5E45A" />
        <path d="M16 5.5v10.2m0 0l8.6-5m-8.6 5l-8.6-5m8.6 5v10.8" stroke="#20221F" strokeWidth="1.3" fill="none" />
        <circle cx="16" cy="15.7" r="2" fill="#82758F" />
      </svg>
      {text && <span className="font-display text-xl font-bold tracking-tight">Skillora</span>}
    </Link>
  )
}

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n()
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Language">
      {!compact && <Languages size={14} className="ml-2 text-mute" />}
      {LANG_LIST.map((l) => (
        <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase transition-colors ${lang === l ? 'bg-ink text-bg' : 'text-mute hover:text-ink'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  return (
    <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink transition-transform hover:rotate-12 active:scale-90"
      aria-label={t('common.toggleTheme')} title={t('common.toggleTheme')}>
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
