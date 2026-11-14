import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Briefcase, BrainCircuit, GitCompare, Telescope, MessagesSquare, FileBarChart2, Hand, UserRound, FileUp, Search, LogOut, Menu, X, Network, ClipboardList,
} from 'lucide-react'
import { Logo, LangSwitch, ThemeToggle } from './Brand'
import { Avatar } from './ui'
import { useI18n } from '../i18n'
import { actions, useAuth } from '../lib/store'
import { useToast } from '../lib/toast'

const HR_NAV = [
  { to: '/app', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/candidates', key: 'nav.candidates', icon: Users },
  { to: '/app/discovery', key: 'nav.discovery', icon: Telescope },
  { to: '/app/vacancies', key: 'nav.vacancies', icon: Briefcase },
  { to: '/app/matching', key: 'nav.matching', icon: BrainCircuit },
  { to: '/app/compare', key: 'nav.compare', icon: GitCompare },
  { to: '/app/interview', key: 'nav.interview', icon: MessagesSquare },
  { to: '/app/knowledge', key: 'nav.knowledge', icon: Network },
  { to: '/app/reports', key: 'nav.reports', icon: FileBarChart2 },
  { to: '/app/gesture', key: 'nav.gesture', icon: Hand },
]
const CAND_NAV = [
  { to: '/app', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/profile', key: 'nav.profile', icon: UserRound },
  { to: '/app/cv', key: 'nav.cv', icon: FileUp },
  { to: '/app/jobs', key: 'nav.jobs', icon: Search },
  { to: '/app/applications', key: 'nav.applications', icon: ClipboardList },
  { to: '/app/gesture', key: 'nav.gesture', icon: Hand },
]

export default function AppShell() {
  const user = useAuth()!
  const { t } = useI18n()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const items = user.role === 'hr' ? HR_NAV : CAND_NAV

  const links = (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}
          className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'text-accent-ink' : 'text-mute hover:bg-surface2 hover:text-ink'}`}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-accent" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />}
              <it.icon size={17} className="relative" />
              <span className="relative">{t(it.key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const side = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1"><Logo to="/app" /></div>
      <div className="flex-1 overflow-y-auto">{links}</div>
      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex items-center gap-3 px-1">
          <Avatar name={user.name} hue={user.role === 'hr' ? 200 : 74} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="eyebrow !text-[10px]">{t(user.role === 'hr' ? 'role.hr' : 'role.candidate')}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2"><LangSwitch compact /><ThemeToggle /></div>
        <button className="btn btn-ghost w-full" onClick={() => { actions.logout(); toast(t('toast.loggedOut'), 'info'); nav('/') }}><LogOut size={15} />{t('nav.logout')}</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface/70 lg:block print:hidden">{side}</aside>

      <header className="app-header sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo to="/app" />
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-line" aria-label="Menu"><Menu size={18} /></button>
      </header>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-line bg-surface lg:hidden" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full p-2 text-mute" aria-label="close"><X size={18} /></button>
              {side}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-10 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
