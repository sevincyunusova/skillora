import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Circle, FileText, GraduationCap, Briefcase, ArrowUpRight } from 'lucide-react'
import { useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { candidateYears, computeMatch } from '../../lib/matching'
import { completeness, useMe } from '../../lib/useMe'
import { Avatar, Counter, Level, ScoreRing } from '../../components/ui'
import { StatusChip } from '../../components/common'
import { JobCard } from '../../components/JobCard'
import { skillName } from '../../components/match'

export default function CandDashboard() {
  const me = useMe()
  const db = useDB()
  const { t, date } = useI18n()
  const comp = useMemo(() => (me ? completeness(me) : null), [me])
  const recs = useMemo(() => {
    if (!me) return []
    const applied = new Set(db.applications.filter((a) => a.candidateId === me.id).map((a) => a.vacancyId))
    return db.vacancies.filter((v) => v.status === 'active' && !applied.has(v.id)).map((v) => ({ v, m: computeMatch(me, v, db.skills, db.kb) })).sort((a, b) => b.m.total - a.m.total).slice(0, 3)
  }, [me, db])
  if (!me || !comp) return <p className="text-mute">{t('common.noData')}</p>
  const apps = db.applications.filter((a) => a.candidateId === me.id).sort((a, b) => b.date.localeCompare(a.date))
  const top = [...me.skills].sort((a, b) => b.level - a.level).slice(0, 8)
  const bestEdu = me.education[0]

  return (
    <div>
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card relative overflow-hidden p-6 md:p-8">
          <div className="hairgrid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(135deg,transparent,black)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={me.name} hue={me.hue} size={88} />
            <div className="min-w-0"><p className="eyebrow mb-1">{t('cdash.hello')}</p><h1 className="font-display text-3xl font-bold md:text-4xl">{me.name}</h1><p className="mt-1 text-mute">{me.title} · {me.location}</p>
              <div className="mt-4 flex flex-wrap gap-2"><Link to="/app/profile" className="btn btn-primary btn-sm">{t('cdash.editProfile')}</Link><Link to="/app/cv" className="btn btn-ghost btn-sm"><FileText size={14} />{t('nav.cv')}</Link></div></div>
          </div>
        </div>
        <div className="card flex items-center gap-6 p-6">
          <ScoreRing value={comp.percent} size={112} stroke={10} label={t('cdash.complete')} />
          <ul className="grid flex-1 gap-1 text-xs">{comp.items.filter((i) => !i[1]).slice(0, 4).map(([k]) => <li key={k} className="flex items-center gap-2 text-mute"><Circle size={10} />{t(`cdash.todo.${k}`)}</li>)}{comp.percent === 100 && <li className="flex items-center gap-2 font-semibold"><Check size={14} className="text-olive" />{t('cdash.allDone')}</li>}</ul>
        </div>
      </div>

      <div className="mb-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[[me.skills.length, 'cdash.stat.skills'], [candidateYears(me), 'cdash.stat.years'], [apps.length, 'cdash.stat.apps'], [apps.filter((a) => a.status === 'interview').length, 'cdash.stat.interviews']].map(([n, k]) => <div key={k as string} className="bg-surface p-6"><p className="font-display text-4xl font-bold"><Counter value={n as number} /></p><p className="eyebrow mt-2">{t(k as string)}</p></div>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold">{t('cand.skills')}</h2><Link to="/app/profile" className="text-xs font-semibold text-brand hover:underline">{t('common.edit')}</Link></div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{top.map((s) => <div key={s.skillId} className="flex items-center justify-between text-sm"><span>{skillName(db.skills, s.skillId)}</span><Level value={s.level} /></div>)}</div></section>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Briefcase size={17} className="text-brand" />{t('cand.experience')}</h2>
              <ul className="space-y-3">{me.experience.slice(0, 3).map((x) => <li key={x.id}><p className="text-sm font-semibold">{x.role}</p><p className="text-xs text-mute">{x.company} · {x.from}—{x.to ?? t('cand.present')}</p></li>)}{!me.experience.length && <li className="text-sm text-mute">{t('common.noItems')}</li>}</ul></section>
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><GraduationCap size={17} className="text-brand" />{t('cand.education')}</h2>
              <ul className="space-y-3">{me.education.map((x) => <li key={x.id}><p className="text-sm font-semibold">{t(`degree.${x.degree}`)} · {x.field}</p><p className="text-xs text-mute">{x.school}, {x.year}</p></li>)}{!bestEdu && <li className="text-sm text-mute">{t('common.noItems')}</li>}</ul>
              <p className="mt-4 border-t border-line pt-3 text-xs text-mute">CV: {me.cvFile ? <b className="text-ink">{me.cvFile}</b> : t('cdash.noCv')}</p></section>
          </div>
        </div>

        <section className="card self-start">
          <header className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-display text-lg font-bold">{t('cdash.myApps')}</h2><Link to="/app/applications" className="text-xs font-semibold text-brand hover:underline">{t('common.viewAll')}</Link></header>
          {apps.length === 0 ? <p className="p-6 text-sm text-mute">{t('apps.empty')}</p> : (
            <ul className="divide-y divide-line">{apps.slice(0, 5).map((a) => { const v = db.vacancies.find((x) => x.id === a.vacancyId); return v && <li key={a.id} className="flex items-center gap-3 px-5 py-3.5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{v.title}</p><p className="text-xs text-mute">{v.company} · {date(a.date)}</p></div><StatusChip s={a.status} /></li> })}</ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow mb-1">{t('cdash.recEyebrow')}</p><h2 className="font-display text-2xl font-bold">{t('cdash.recTitle')}</h2></div><Link to="/app/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{t('common.viewAll')}<ArrowUpRight size={14} /></Link></div>
        {recs.length === 0 ? <p className="text-sm text-mute">{t('cdash.noRecs')}</p> : <div className="grid gap-4 md:grid-cols-3">{recs.map(({ v }, i) => <motion.div key={v.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><JobCard v={v} me={me} /></motion.div>)}</div>}
      </section>
    </div>
  )
}
