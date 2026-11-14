import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, LogIn, UserRound, Briefcase } from 'lucide-react'
import { Logo, LangSwitch, ThemeToggle } from '../components/Brand'
import { Field, Input, Magnetic } from '../components/ui'
import { useI18n } from '../i18n'
import { actions, useAuth, DEMO_USERS } from '../lib/store'
import { useToast } from '../lib/toast'

function Crystal() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D5E45A" /><stop offset="1" stopColor="#747B50" /></linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#82758F" /><stop offset="1" stopColor="#20221F" /></linearGradient>
      </defs>
      <g transform="translate(200 200)">
        <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}>
          <polygon points="0,-140 121,-70 121,70 0,140 -121,70 -121,-70" fill="none" stroke="#D5E45A" strokeOpacity=".25" />
          <polygon points="0,-100 87,-50 87,50 0,100 -87,50 -87,-50" fill="url(#g2)" fillOpacity=".55" stroke="#D5E45A" strokeOpacity=".4" />
        </motion.g>
        <motion.g animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}>
          <polygon points="0,-62 54,-31 54,31 0,62 -54,31 -54,-31" fill="url(#g1)" />
          <path d="M0 -62 V62 M-54 -31 L54 31 M54 -31 L-54 31" stroke="#20221F" strokeOpacity=".4" />
        </motion.g>
        {[[-140, -20], [130, 40], [20, 150], [-60, -130]].map(([x, y], i) => <motion.circle key={i} cx={x} cy={y} r={5} fill={i % 2 ? '#82758F' : '#D5E45A'} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.4 }} />)}
      </g>
    </svg>
  )
}

export default function Login() {
  const { t } = useI18n()
  const user = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState<{ email?: string; pw?: string; form?: string }>({})
  if (user) return <Navigate to="/app" replace />

  const attempt = (e: string, p: string) => {
    const u = actions.login(e, p)
    if (!u) { setErr({ form: t('login.invalid') }); return }
    toast(t('toast.welcome', { name: u.name }))
    nav('/app', { replace: true })
  }
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const n: typeof err = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) n.email = t('val.email')
    if (!pw) n.pw = t('val.required')
    setErr(n)
    if (Object.keys(n).length) return
    attempt(email, pw)
  }
  const demo = (i: number) => { setErr({}); attempt(DEMO_USERS[i].email, DEMO_USERS[i].password) }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink p-10 text-bg lg:flex lg:flex-col lg:justify-between">
        <div className="hairgrid absolute inset-0 opacity-[0.08]" />
        <Link to="/" className="relative inline-flex items-center gap-2 text-sm text-bg/70 hover:text-bg"><ArrowLeft size={16} />{t('login.back')}</Link>
        <div className="relative mx-auto aspect-square w-full max-w-[420px]"><Crystal /></div>
        <div className="relative max-w-md"><p className="font-display text-3xl font-bold leading-tight">{t('landing.hero.title1')} {t('landing.hero.title2')}</p><p className="mt-3 text-sm text-bg/60">{t('landing.foot.topic')}</p></div>
      </div>

      <div className="flex flex-col px-5 py-6 md:px-12">
        <div className="flex items-center justify-between"><div className="lg:hidden"><Logo /></div><div className="ml-auto flex items-center gap-3"><LangSwitch compact /><ThemeToggle /></div></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="hidden lg:block"><Logo /></div>
          <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-mute">{t('login.sub')}</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label={t('login.email')} error={err.email}><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Field>
            <Field label={t('login.password')} error={err.pw}>
              <div className="relative">
                <Input type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink" aria-label={t('login.togglePw')}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </Field>
            {err.form && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">{err.form}</p>}
            <Magnetic className="w-full"><button type="submit" className="btn btn-primary w-full py-3"><LogIn size={16} />{t('login.submit')}</button></Magnetic>
          </form>

          <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-line" /><span className="eyebrow">{t('login.quick')}</span><span className="h-px flex-1 bg-line" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => demo(0)} className="card group p-4 text-left transition-colors hover:border-brand"><Briefcase size={18} className="mb-3 text-brand" /><p className="font-display font-bold">{t('login.demoHr')}</p><p className="mt-0.5 break-all font-mono text-[11px] text-mute">hr@skillora.demo</p></button>
            <button onClick={() => demo(1)} className="card group p-4 text-left transition-colors hover:border-brand"><UserRound size={18} className="mb-3 text-violet" /><p className="font-display font-bold">{t('login.demoCand')}</p><p className="mt-0.5 break-all font-mono text-[11px] text-mute">candidate@skillora.demo</p></button>
          </div>
          <p className="mt-6 text-xs text-mute">{t('login.pwHint')}: <span className="font-mono text-ink">Skillora123</span></p>
        </div>
      </div>
    </div>
  )
}
