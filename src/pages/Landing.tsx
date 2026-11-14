import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight, BrainCircuit, FileUp, Gavel, Hand, Menu, MessagesSquare, Network, FileBarChart2, X, ChevronDown } from 'lucide-react'
import { Logo, LangSwitch, ThemeToggle } from '../components/Brand'
import { Counter, Magnetic, RevealText, Tilt, useIsMobile } from '../components/ui'
import MatchDemo from '../components/MatchDemo'
import { useI18n } from '../i18n'
import { useTheme } from '../lib/theme'
import { useAuth, useDB } from '../lib/store'
import { story } from '../three/StoryScene'

gsap.registerPlugin(ScrollTrigger)
const StoryCanvas = lazy(() => import('../three/StoryScene'))

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))

function Nav() {
  const { t } = useI18n()
  const user = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24)
    h()
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  const go = (id: string) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
  const links = [['story', 'landing.nav.story'], ['demo', 'landing.nav.demo'], ['features', 'landing.nav.features'], ['stats', 'landing.nav.stats']]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? 'border-b border-line bg-bg/80 backdrop-blur-xl' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map(([id, k]) => <button key={id} onClick={() => go(id)} className="rounded-full px-4 py-2 text-sm font-medium text-mute transition-colors hover:text-ink">{t(k)}</button>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LangSwitch compact /><ThemeToggle />
          <Link to={user ? '/app' : '/login'} className="btn btn-dark btn-sm">{user ? t('landing.nav.open') : t('landing.nav.login')}</Link>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {open && (
        <div className="space-y-1 border-t border-line px-5 pb-5 pt-3 md:hidden">
          {links.map(([id, k]) => <button key={id} onClick={() => go(id)} className="block w-full rounded-xl px-3 py-3 text-left text-base font-medium hover:bg-surface2">{t(k)}</button>)}
          <div className="flex items-center justify-between pt-3"><LangSwitch compact /><ThemeToggle /></div>
          <Link to={user ? '/app' : '/login'} className="btn btn-primary mt-3 w-full">{user ? t('landing.nav.open') : t('landing.nav.login')}</Link>
        </div>
      )}
    </header>
  )
}

const STAGE_META = [
  { icon: Network, key: 'collect' },
  { icon: FileUp, key: 'evaluate' },
  { icon: BrainCircuit, key: 'match' },
  { icon: Gavel, key: 'decide' },
]

export default function Landing() {
  const { t } = useI18n()
  const { theme } = useTheme()
  const db = useDB()
  const nav = useNavigate()
  const mobile = useIsMobile()
  const reduce = !!useReducedMotion()
  const wrap = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const heroText = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const rail = useRef<(HTMLSpanElement | null)[]>([])
  const canvasBox = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      story.px = (e.clientX / window.innerWidth) * 2 - 1
      story.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => { window.removeEventListener('mousemove', h); story.s = 0; story.px = 0; story.py = 0 }
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: hero.current, start: 'top top', end: 'bottom top', scrub: true,
        onUpdate: (self) => {
          story.s = 0.6 * self.progress
          if (heroText.current) gsap.set(heroText.current, { opacity: 1 - clamp(self.progress * 1.5), y: self.progress * -60 })
        },
      })
      const upd = (p: number) => {
        const s = Math.min(4, 0.6 + (p / 0.84) * 3.4)
        if (p > 0) story.s = s
        panels.current.forEach((el, k) => {
          if (!el) return
          const d = s - (k + 1)
          const o = clamp((0.64 - Math.abs(d)) / 0.26)
          gsap.set(el, { opacity: o, y: d * -46, filter: `blur(${(1 - o) * 6}px)`, visibility: o < 0.01 ? 'hidden' : 'visible' })
          const r = rail.current[k]
          if (r) gsap.set(r, { scaleY: 0.35 + o * 0.65, opacity: 0.35 + o * 0.65 })
        })
      }
      ScrollTrigger.create({ trigger: storyRef.current, start: 'top top', end: 'bottom bottom', onUpdate: (self) => upd(self.progress), onRefresh: (self) => upd(self.progress) })
      ScrollTrigger.create({
        trigger: wrap.current, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => setActive(self.isActive),
      })
      // fade the fixed canvas while the story section scrolls away
      ScrollTrigger.create({
        trigger: storyRef.current, start: 'bottom bottom', end: 'bottom 30%', scrub: true,
        onUpdate: (self) => { if (canvasBox.current) canvasBox.current.style.opacity = String(1 - self.progress) },
      })
      // generic reveal for non-story blocks
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { opacity: 0, y: reduce ? 0 : 36, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
    }, wrap)
    return () => ctx.revert()
  }, [reduce])

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  const relations = db.skills.reduce((a, s) => a + s.related.length, 0)
  const weights = Object.values(db.kb.weights)
  const rulesMin = db.kb.rules.filter((r) => r.enabled).map((r) => r.min)

  const readout: string[][] = [
    [`${db.skills.length}`, 'landing.s1.m1', `${relations}`, 'landing.s1.m2'],
    [`${db.candidates.length}`, 'landing.s2.m1', '6', 'landing.s2.m2'],
    [`${db.vacancies.filter((v) => v.status === 'active').length}`, 'landing.s3.m1', weights.join(' / '), 'landing.s3.m2'],
    [`${rulesMin.filter((m) => m > 0).join(' / ')}%`, 'landing.s4.m1', `${db.decisions.length}`, 'landing.s4.m2'],
  ]
  const side = ['right', 'left', 'center', 'right'] as const

  return (
    <div ref={wrap} className="relative">
      <Nav />

      {/* fixed 3D layer */}
      <div ref={canvasBox} className="pointer-events-none fixed inset-0 z-0" style={{ opacity: 1 }} aria-hidden>
        <div className={`absolute inset-0 ${mobile ? 'opacity-70' : ''}`}>
          <Suspense fallback={null}>
            <StoryCanvas active={active} dark={theme === 'dark'} mobile={mobile} reduce={reduce} />
          </Suspense>
        </div>
      </div>

      {/* HERO */}
      <section ref={hero} className="relative z-10 flex min-h-screen items-center">
        <div className="hairgrid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />
        <div ref={heroText} className="mx-auto w-full max-w-7xl px-5 pt-24 md:px-8">
          <div className="max-w-2xl">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eyebrow mb-5 flex items-center gap-2">
              <span className="h-px w-8 bg-brand" />{t('landing.hero.eyebrow')}
            </motion.p>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] sm:text-5xl lg:text-[3.9rem]">
              <RevealText text={t('landing.hero.title1')} as="span" delay={0.15} />
              <br />
              <span className="relative inline-block">
                <RevealText text={t('landing.hero.title2')} as="span" delay={0.5} />
                <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="absolute -bottom-0.5 left-0 -z-10 h-[0.32em] w-full origin-left bg-accent/80" />
              </span>
            </h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-6 max-w-md text-base text-mute md:text-lg">{t('landing.hero.sub')}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic><button className="btn btn-primary px-7 py-3.5 text-base" onClick={() => nav('/login')}>{t('landing.hero.cta1')}<ArrowRight size={17} /></button></Magnetic>
              <Magnetic><button className="btn btn-ghost px-7 py-3.5 text-base" onClick={() => go('story')}>{t('landing.hero.cta2')}</button></Magnetic>
            </motion.div>
            <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
              {[[db.skills.length, 'landing.hero.k1'], [db.candidates.length, 'landing.hero.k2'], [6, 'landing.hero.k3']].map(([n, k]) => (
                <div key={k as string}><dt className="font-display text-2xl font-bold">{n}</dt><dd className="eyebrow mt-0.5 !text-[10px]">{t(k as string)}</dd></div>
              ))}
            </motion.dl>
          </div>
        </div>
        <button onClick={() => go('story')} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-mute md:flex" aria-label={t('landing.hero.scroll')}>
          <span className="eyebrow !text-[10px]">{t('landing.hero.scroll')}</span><ChevronDown size={16} className="animate-bounce" />
        </button>
      </section>

      {/* CINEMATIC STORY — pinned scenes driven by ScrollTrigger */}
      <section ref={storyRef} id="story" className="relative z-10" style={{ height: reduce ? '420vh' : '560vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex" aria-hidden>
            {STAGE_META.map((m, k) => (
              <div key={m.key} className="flex items-center justify-end gap-3">
                <span className="eyebrow !text-[10px]">{t(`landing.${m.key}.tag`)}</span>
                <span ref={(el) => { rail.current[k] = el }} className="h-8 w-[3px] origin-center rounded-full bg-brand" />
              </div>
            ))}
          </div>
          {STAGE_META.map((m, k) => {
            const Icon = m.icon
            const pos = side[k]
            return (
              <div key={m.key} ref={(el) => { panels.current[k] = el }} className={`absolute inset-0 flex px-5 md:px-16 ${mobile ? 'items-end pb-10' : pos === 'center' ? 'items-end justify-center pb-14' : 'items-center'} ${!mobile && pos === 'right' ? 'justify-end' : ''}`} style={{ opacity: 0, visibility: 'hidden' }}>
                <div className={`${mobile ? 'w-full rounded-3xl border border-line bg-bg/75 p-5 backdrop-blur-md' : pos === 'center' ? 'w-full max-w-3xl rounded-3xl border border-line bg-bg/70 p-7 backdrop-blur-md' : 'max-w-md rounded-3xl border border-line bg-bg/60 p-6 backdrop-blur-md'}`}>
                  <p className="eyebrow mb-3 flex items-center gap-2"><Icon size={14} className="text-brand" />0{k + 1} / 04 — {t(`landing.${m.key}.tag`)}</p>
                  <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{t(`landing.${m.key}.title`)}</h2>
                  <p className="mt-3 text-sm text-mute md:text-base">{t(`landing.${m.key}.text`)}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
                    {[0, 2].map((o) => (
                      <div key={o}><dt className="font-display text-xl font-bold md:text-2xl">{readout[k][o]}</dt><dd className="eyebrow mt-0.5 !text-[10px]">{t(readout[k][o + 1])}</dd></div>
                    ))}
                  </dl>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* skill marquee — real knowledge-base entries */}
      <div className="relative z-10 overflow-hidden border-y border-line bg-ink py-4 text-bg" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {[...db.skills, ...db.skills].map((s, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-xl font-bold"><span>{s.name}</span><span className="text-accent">✦</span></span>
          ))}
        </div>
      </div>

      {/* INTERACTIVE DEMO */}
      <section id="demo" className="relative z-10 bg-bg px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="mb-12 grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
            <div><p className="eyebrow mb-3">{t('landing.demo.eyebrow')}</p><h2 className="font-display text-3xl font-bold md:text-5xl">{t('landing.demo.title')}</h2></div>
            <p className="max-w-md text-mute md:justify-self-end">{t('landing.demo.text')}</p>
          </div>
          <div data-reveal><MatchDemo /></div>
        </div>
      </section>

      {/* FEATURES — asymmetric bento */}
      <section id="features" className="relative z-10 bg-surface2/50 px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="mb-12 max-w-2xl"><p className="eyebrow mb-3">{t('landing.feat.eyebrow')}</p><h2 className="font-display text-3xl font-bold md:text-5xl">{t('landing.feat.title')}</h2></div>
          <div className="grid auto-rows-[minmax(190px,auto)] gap-4 md:grid-cols-6">
            <Tilt className="md:col-span-3 md:row-span-2"><Link to="/login" data-reveal className="card group relative flex h-full flex-col justify-between overflow-hidden bg-ink p-7 text-bg">
              <svg className="absolute -right-10 -top-6 h-64 w-64 opacity-70 transition-transform duration-700 group-hover:rotate-12" viewBox="0 0 200 200" aria-hidden>
                {[[40, 60], [100, 30], [160, 70], [70, 120], [130, 130], [100, 80], [40, 150], [165, 160]].map(([x, y], i, a) => a.slice(i + 1, i + 3).map(([x2, y2], j) => <line key={`${i}${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#D5E45A" strokeOpacity=".4" />))}
                {[[40, 60], [100, 30], [160, 70], [70, 120], [130, 130], [100, 80], [40, 150], [165, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4} fill={i % 3 === 0 ? '#D5E45A' : i % 3 === 1 ? '#82758F' : '#747B50'} />)}
              </svg>
              <Network className="text-accent" size={26} />
              <div><h3 className="font-display text-2xl font-bold">{t('landing.f1.title')}</h3><p className="mt-2 max-w-sm text-sm text-bg/70">{t('landing.f1.text')}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">{t('landing.f.open')}<ArrowUpRight size={15} /></span></div>
            </Link></Tilt>
            <Tilt className="md:col-span-3"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-5 p-6">
              <div className="flex items-start justify-between"><BrainCircuit className="text-brand" size={24} /><div className="flex h-10 items-end gap-1" aria-hidden>{[40, 20, 15, 10, 5, 10].map((w, i) => <span key={i} className="w-3 rounded-sm bg-brand/80" style={{ height: `${w * 2.4}%`, opacity: 1 - i * 0.1 }} />)}</div></div>
              <div><h3 className="font-display text-xl font-bold">{t('landing.f2.title')}</h3><p className="mt-1.5 text-sm text-mute">{t('landing.f2.text')}</p></div>
            </Link></Tilt>
            <Tilt className="md:col-span-2"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-5 bg-accent p-6 text-accent-ink">
              <Gavel size={24} /><div><h3 className="font-display text-xl font-bold">{t('landing.f3.title')}</h3><p className="mt-1.5 text-sm opacity-80">{t('landing.f3.text')}</p></div>
            </Link></Tilt>
            <Tilt className="md:col-span-1"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-4 p-5">
              <FileUp className="text-violet" size={22} /><div><h3 className="font-display text-base font-bold">{t('landing.f4.title')}</h3><p className="mt-1 text-xs text-mute">{t('landing.f4.text')}</p></div>
            </Link></Tilt>
            <Tilt className="md:col-span-2"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-4 p-6">
              <MessagesSquare className="text-brand" size={22} /><div><h3 className="font-display text-lg font-bold">{t('landing.f5.title')}</h3><p className="mt-1 text-sm text-mute">{t('landing.f5.text')}</p></div>
            </Link></Tilt>
            <Tilt className="md:col-span-2"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-4 bg-violet/20 p-6">
              <Hand className="text-violet" size={22} /><div><h3 className="font-display text-lg font-bold">{t('landing.f6.title')}</h3><p className="mt-1 text-sm text-mute">{t('landing.f6.text')}</p></div>
            </Link></Tilt>
            <Tilt className="md:col-span-2"><Link to="/login" data-reveal className="card flex h-full flex-col justify-between gap-4 p-6">
              <FileBarChart2 className="text-olive" size={22} /><div><h3 className="font-display text-lg font-bold">{t('landing.f7.title')}</h3><p className="mt-1 text-sm text-mute">{t('landing.f7.text')}</p></div>
            </Link></Tilt>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="relative z-10 bg-bg px-5 py-24 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
            {[
              [db.candidates.length, '', 'landing.st.cand', 0],
              [db.vacancies.length, '', 'landing.st.vac', 0],
              [db.skills.length + db.kb.certs.length, '', 'landing.st.kb', 0],
              [db.decisions.length, '', 'landing.st.dec', 0],
            ].map(([n, sfx, k]) => (
              <div key={k as string} className="bg-surface p-8">
                <div className="font-display text-5xl font-bold"><Counter value={n as number} suffix={sfx as string} /></div>
                <p className="eyebrow mt-3">{t(k as string)}</p>
              </div>
            ))}
          </div>
          <div data-reveal className="relative mt-16 overflow-hidden rounded-3xl bg-ink p-8 text-bg md:p-14">
            <div className="hairgrid pointer-events-none absolute inset-0 opacity-[0.08]" />
            <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
              <div><h2 className="font-display text-3xl font-bold md:text-5xl">{t('landing.cta.title')}</h2><p className="mt-4 max-w-lg text-bg/70">{t('landing.cta.text')}</p></div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Magnetic><Link to="/login" className="btn btn-primary px-7 py-3.5 text-base">{t('landing.hero.cta1')}<ArrowRight size={17} /></Link></Magnetic>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line bg-bg px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2"><Logo /><p className="max-w-sm text-xs text-mute">{t('landing.foot.topic')}</p></div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-mute">
            <Link to="/login" className="hover:text-ink">{t('landing.nav.login')}</Link>
            <button onClick={() => go('demo')} className="hover:text-ink">{t('landing.nav.demo')}</button>
            <LangSwitch compact /><ThemeToggle />
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl text-xs text-mute">© 2024 Skillora · {t('landing.foot.rights')}</p>
      </footer>
    </div>
  )
}
