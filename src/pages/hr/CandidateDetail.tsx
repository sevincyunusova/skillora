import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, GitBranch, Globe, Mail, MapPin, Phone, Pencil, Trash2, Award, GraduationCap, Briefcase, Star, GitFork, BrainCircuit, GitCompare, MessagesSquare, Languages } from 'lucide-react'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { candidateYears, computeMatch } from '../../lib/matching'
import { Avatar, Bar, ConfirmModal, Level, ScoreBadge, Select } from '../../components/ui'
import { DecisionBadge, MatchSummary, skillName } from '../../components/match'
import { CandidateFormModal } from './Candidates'
import { DEGREES } from '../../components/CandidateEditor'

export default function CandidateDetail() {
  const { id } = useParams()
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const nav = useNavigate()
  const c = db.candidates.find((x) => x.id === id)
  const [vid, setVid] = useState(db.vacancies.find((v) => v.status === 'active')?.id ?? db.vacancies[0]?.id ?? '')
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const all = useMemo(() => (c ? db.vacancies.map((v) => computeMatch(c, v, db.skills, db.kb)).sort((a, b) => b.total - a.total) : []), [c, db])
  if (!c) return <Navigate to="/app/candidates" replace />
  const sn = (sid: string) => skillName(db.skills, sid)
  const sel = all.find((m) => m.vacancyId === vid)
  const cat = (k: string) => c.skills.filter((s) => db.skills.find((x) => x.id === s.skillId)?.category === k)
  const apps = db.applications.filter((a) => a.candidateId === c.id)
  const bestEdu = [...c.education].sort((a, b) => DEGREES.indexOf(b.degree) - DEGREES.indexOf(a.degree))[0]

  return (
    <div>
      <Link to="/app/candidates" className="mb-5 inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft size={15} />{t('nav.candidates')}</Link>

      <header className="card mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <Avatar name={c.name} hue={c.hue} size={84} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold">{c.name}</h1>
          <p className="text-mute">{c.title}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-mute">
            <span className="inline-flex items-center gap-1.5"><Mail size={14} />{c.email}</span>
            {c.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} />{c.phone}</span>}
            {c.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{c.location}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/compare?c=${c.id}`} className="btn btn-ghost btn-sm"><GitCompare size={14} />{t('nav.compare')}</Link>
          <Link to={`/app/interview?c=${c.id}&v=${vid}`} className="btn btn-ghost btn-sm"><MessagesSquare size={14} />{t('nav.interview')}</Link>
          <button className="btn btn-ghost btn-sm" onClick={() => setEdit(true)}><Pencil size={14} />{t('common.edit')}</button>
          <button className="btn btn-danger btn-sm" onClick={() => setDel(true)}><Trash2 size={14} />{t('common.delete')}</button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          {c.summary && <section className="card p-6"><p className="eyebrow mb-2">{t('cand.summary')}</p><p className="text-sm leading-relaxed">{c.summary}</p>
            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-center">
              <div><dt className="eyebrow !text-[10px]">{t('cand.experience')}</dt><dd className="font-display text-2xl font-bold">{candidateYears(c)}<span className="text-sm text-mute"> {t('cand.yrs')}</span></dd></div>
              <div><dt className="eyebrow !text-[10px]">{t('cand.skills')}</dt><dd className="font-display text-2xl font-bold">{c.skills.length}</dd></div>
              <div><dt className="eyebrow !text-[10px]">{t('cand.degree')}</dt><dd className="font-display text-lg font-bold">{bestEdu ? t(`degree.${bestEdu.degree}`) : '—'}</dd></div>
            </dl></section>}

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-bold">{t('cand.skills')}</h2>
            <div className="space-y-5">
              {(['technical', 'tools', 'domain', 'soft'] as const).map((k) => cat(k).length > 0 && (
                <div key={k}>
                  <p className="eyebrow mb-2">{t(`cat.${k}`)}</p>
                  <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {cat(k).sort((a, b) => b.level - a.level).map((s) => (
                      <div key={s.skillId}><div className="mb-1 flex justify-between text-sm"><span>{sn(s.skillId)}</span><span className="font-mono text-xs text-mute">{s.level}/5 · {t(`lvl.${s.level}`)}</span></div><Bar value={s.level * 20} color={k === 'soft' ? 'bg-violet' : 'bg-brand'} /></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Briefcase size={18} className="text-brand" />{t('cand.experience')}</h2>
            <ol className="relative space-y-5 border-l border-line pl-6">
              {[...c.experience].sort((a, b) => b.from - a.from).map((x) => (
                <li key={x.id} className="relative"><span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-surface" />
                  <p className="font-semibold">{x.role} <span className="font-normal text-mute">· {x.company}</span></p><p className="font-mono text-xs text-mute">{x.from} — {x.to ?? t('cand.present')}</p>
                  {x.description && <p className="mt-1 text-sm text-mute">{x.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">{x.skills.map((s) => <span key={s} className="chip !py-0 text-[11px]">{sn(s)}</span>)}</div></li>
              ))}
              {!c.experience.length && <p className="text-sm text-mute">{t('common.noItems')}</p>}
            </ol>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><GraduationCap size={18} className="text-brand" />{t('cand.education')}</h2>
              <ul className="space-y-3">{c.education.map((e) => <li key={e.id}><p className="text-sm font-semibold">{t(`degree.${e.degree}`)} · {e.field}</p><p className="text-xs text-mute">{e.school}, {e.year}</p></li>)}{!c.education.length && <li className="text-sm text-mute">{t('common.noItems')}</li>}</ul></section>
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Award size={18} className="text-brand" />{t('cand.certs')}</h2>
              <ul className="space-y-3">{c.certificates.map((e) => <li key={e.id}><p className="text-sm font-semibold">{e.name}</p><p className="text-xs text-mute">{e.issuer}, {e.year}</p></li>)}{!c.certificates.length && <li className="text-sm text-mute">{t('common.noItems')}</li>}</ul></section>
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Languages size={18} className="text-brand" />{t('cand.languages')}</h2>
              <ul className="space-y-2">{c.languages.map((l) => <li key={l.lang} className="flex items-center justify-between text-sm"><span>{t(`language.${l.lang}`)}</span><span className="flex items-center gap-2"><Level value={l.level} /><span className="font-mono text-xs text-mute">{t(`langlvl.${l.level}`)}</span></span></li>)}{!c.languages.length && <li className="text-sm text-mute">{t('common.noItems')}</li>}</ul></section>
            <section className="card p-6"><h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Globe size={18} className="text-brand" />{t('cand.portfolioGithub')}</h2>
              <div className="space-y-3 text-sm">
                {c.portfolio ? <a href={c.portfolio} target="_blank" rel="noreferrer" className="block truncate underline underline-offset-4">{c.portfolio}</a> : <p className="text-mute">{t('cand.noPortfolio')}</p>}
                {c.github ? (
                  <div className="rounded-xl border border-line p-3">
                    <a href={`https://github.com/${c.github.user}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold"><GitBranch size={16} />@{c.github.user}</a>
                    {(c.github.repos > 0 || c.github.stars > 0) && <div className="mt-2 flex gap-4 text-xs text-mute"><span className="inline-flex items-center gap-1"><GitFork size={13} />{c.github.repos} {t('cand.repos')}</span><span className="inline-flex items-center gap-1"><Star size={13} />{c.github.stars}</span></div>}
                    {c.github.langs.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.github.langs.map((l) => <span key={l} className="chip !py-0 text-[11px]">{l}</span>)}</div>}
                  </div>
                ) : <p className="text-mute">{t('cand.noGithub')}</p>}
              </div></section>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">{t('cand.fit')}</h2>
              <Select value={vid} onChange={(e) => setVid(e.target.value)} className="!w-auto max-w-[200px]" aria-label={t('nav.vacancies')}>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select></div>
            {sel && <motion.div key={vid} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><MatchSummary m={sel} skills={db.skills} compact /></motion.div>}
            <Link to={`/app/matching?c=${c.id}&v=${vid}`} className="btn btn-primary mt-6 w-full"><BrainCircuit size={16} />{t('cand.runEngine')}</Link>
          </section>
          <section className="card p-5">
            <h3 className="mb-3 font-display text-base font-bold">{t('cand.allVacancies')}</h3>
            <ul className="space-y-1">
              {all.map((m) => { const v = db.vacancies.find((x) => x.id === m.vacancyId)!; return (
                <li key={m.vacancyId}><button onClick={() => setVid(m.vacancyId)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface2 ${vid === m.vacancyId ? 'bg-surface2' : ''}`}>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{v.title}</span><span className="text-xs text-mute">{v.company}</span></span><DecisionBadge d={m.decision} size="sm" /><ScoreBadge value={m.total} /></button></li>) })}
            </ul>
            {apps.length > 0 && <p className="mt-3 border-t border-line pt-3 text-xs text-mute">{t('cand.applied', { n: apps.length })}</p>}
          </section>
        </aside>
      </div>

      {edit && <CandidateFormModal initial={c} onClose={() => setEdit(false)} />}
      <ConfirmModal open={del} onClose={() => setDel(false)} title={t('cand.delete')} text={t('cand.deleteText', { name: c.name })} onConfirm={() => { actions.deleteCandidate(c.id); toast(t('toast.candDeleted')); nav('/app/candidates') }} />
    </div>
  )
}
