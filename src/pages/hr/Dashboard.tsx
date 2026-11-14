import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Users, Briefcase, Inbox, Gauge } from 'lucide-react'
import { Bar as RBar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDB, useAuth } from '../../lib/store'
import { useI18n } from '../../i18n'
import { computeMatch } from '../../lib/matching'
import { Counter, Stagger, fadeUp, ScoreBadge, Tilt } from '../../components/ui'
import { CandidateCell, StatusChip } from '../../components/common'
import { DecisionBadge, DECISION_COLOR } from '../../components/match'
import type { DecisionKey } from '../../lib/types'

export default function HrDashboard() {
  const db = useDB()
  const user = useAuth()!
  const { t, date } = useI18n()

  const data = useMemo(() => {
    const active = db.vacancies.filter((v) => v.status === 'active')
    const matrix = db.candidates.map((c) => {
      const all = active.map((v) => computeMatch(c, v, db.skills, db.kb))
      const best = [...all].sort((a, b) => b.total - a.total)[0]
      return { c, best }
    })
    const top = matrix.filter((m) => m.best).sort((a, b) => b.best.total - a.best.total).slice(0, 5)
    const apps = [...db.applications].sort((a, b) => b.date.localeCompare(a.date))
    const appScore = (cid: string, vid: string) => {
      const c = db.candidates.find((x) => x.id === cid)
      const v = db.vacancies.find((x) => x.id === vid)
      return c && v ? computeMatch(c, v, db.skills, db.kb).total : 0
    }
    const avg = apps.length ? apps.reduce((a, x) => a + appScore(x.candidateId, x.vacancyId), 0) / apps.length : 0
    const perVac = active.map((v) => {
      const as = db.applications.filter((a) => a.vacancyId === v.id)
      const sc = as.map((a) => appScore(a.candidateId, v.id))
      return { v, count: as.length, avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : 0 }
    })
    const dist: Record<DecisionKey, number> = { interview: 0, assess: 0, reserve: 0, low: 0 }
    db.decisions.forEach((d) => { dist[d.decision]++ })
    return { active, top, apps, avg, perVac, dist, appScore }
  }, [db])

  const newApps = db.applications.filter((a) => a.status === 'new').length
  const cname = (id: string) => db.candidates.find((c) => c.id === id)
  const vname = (id: string) => db.vacancies.find((v) => v.id === id)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'dash.morning' : hour < 18 ? 'dash.afternoon' : 'dash.evening'

  const stats = [
    { icon: Users, label: 'dash.stat.cand', value: db.candidates.length, suffix: '', to: '/app/candidates' },
    { icon: Briefcase, label: 'dash.stat.vac', value: data.active.length, suffix: '', to: '/app/vacancies' },
    { icon: Inbox, label: 'dash.stat.new', value: newApps, suffix: '', to: '/app/candidates' },
    { icon: Gauge, label: 'dash.stat.avg', value: Math.round(data.avg), suffix: '%', to: '/app/reports' },
  ]
  const pie = (Object.keys(data.dist) as DecisionKey[]).map((k) => ({ k, name: t(`decision.${k}`), value: data.dist[k] })).filter((x) => x.value > 0)

  return (
    <div>
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow mb-2">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="h-page">{t(greet)}, {user.name.split(' ')[0]}.</h1>
          <p className="mt-3 max-w-xl text-mute">{t('dash.brief', { n: newApps, v: data.active.length, i: data.dist.interview })}</p>
        </div>
        <div className="flex gap-3 lg:justify-end">
          <Link to="/app/matching" className="btn btn-primary">{t('dash.runMatching')}<ArrowUpRight size={16} /></Link>
          <Link to="/app/vacancies" className="btn btn-ghost">{t('dash.newVacancy')}</Link>
        </div>
      </div>

      <Stagger className="mb-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <Link to={s.to} className="group relative block h-full bg-surface p-6 transition-colors hover:bg-surface2/60">
              <s.icon size={18} className="text-brand" />
              <div className="mt-6 font-display text-5xl font-bold tabular-nums"><Counter value={s.value} suffix={s.suffix} /></div>
              <p className="eyebrow mt-2">{t(s.label)}</p>
              <ArrowUpRight size={16} className="absolute right-5 top-5 text-mute opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </motion.div>
        ))}
      </Stagger>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-lg font-bold">{t('dash.recentApps')}</h2><Link to="/app/candidates" className="text-xs font-semibold text-brand hover:underline">{t('common.viewAll')}</Link></header>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr><th className="th">{t('cand.name')}</th><th className="th">{t('nav.vacancies')}</th><th className="th">{t('dash.match')}</th><th className="th">{t('common.status')}</th><th className="th">{t('common.date')}</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.apps.slice(0, 7).map((a) => {
                  const c = cname(a.candidateId), v = vname(a.vacancyId)
                  if (!c || !v) return null
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-surface2/40">
                      <td className="td"><CandidateCell c={c} /></td>
                      <td className="td text-mute">{v.title}</td>
                      <td className="td"><ScoreBadge value={data.appScore(c.id, v.id)} /></td>
                      <td className="td"><StatusChip s={a.status} /></td>
                      <td className="td font-mono text-xs text-mute">{date(a.date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">{t('dash.decisionMix')}</h2>
          {pie.length ? (
            <div className="relative mt-2 h-52">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none">{pie.map((p) => <Cell key={p.k} fill={DECISION_COLOR[p.k]} />)}</Pie>
                  <Tooltip contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-3xl font-bold">{db.decisions.length}</p><p className="eyebrow !text-[10px]">{t('dash.decisions')}</p></div></div>
            </div>
          ) : <p className="py-10 text-center text-sm text-mute">{t('common.noData')}</p>}
          <ul className="mt-2 space-y-2">
            {pie.map((p) => <li key={p.k} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: DECISION_COLOR[p.k] }} />{p.name}</span><b className="font-mono">{p.value}</b></li>)}
          </ul>
        </section>

        <section className="card">
          <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-lg font-bold">{t('dash.topCandidates')}</h2><Link to="/app/discovery" className="text-xs font-semibold text-brand hover:underline">{t('nav.discovery')}</Link></header>
          <ul className="divide-y divide-line">
            {data.top.map((m, i) => (
              <li key={m.c.id}>
                <Tilt max={2}>
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-5 font-mono text-xs text-mute">{i + 1}</span>
                    <div className="min-w-0 flex-1"><CandidateCell c={m.c} sub={vname(m.best.vacancyId)?.title} /></div>
                    <ScoreBadge value={m.best.total} />
                  </div>
                </Tilt>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">{t('dash.activeVac')}</h2>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <BarChart data={data.perVac.map((p) => ({ name: p.v.title.length > 14 ? p.v.title.slice(0, 13) + '…' : p.v.title, avg: Math.round(p.avg), count: p.count }))} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgb(var(--surface2))' }} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} />
                <RBar dataKey="avg" name={t('dash.avgMatch')} fill="#747B50" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card xl:col-span-2">
          <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-lg font-bold">{t('dash.recentDecisions')}</h2><Link to="/app/reports" className="text-xs font-semibold text-brand hover:underline">{t('nav.reports')}</Link></header>
          <ul className="divide-y divide-line">
            {[...db.decisions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((d) => {
              const c = cname(d.candidateId), v = vname(d.vacancyId)
              if (!c || !v) return null
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
                  <div className="min-w-[200px] flex-1"><CandidateCell c={c} sub={v.title} /></div>
                  <ScoreBadge value={d.score} />
                  <DecisionBadge d={d.decision} size="sm" />
                  <span className="font-mono text-xs text-mute">{date(d.date)}</span>
                </li>
              )
            })}
            {!db.decisions.length && <li className="px-5 py-8 text-center text-sm text-mute">{t('common.noData')}</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
