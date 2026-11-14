import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Eye, Users, Power, X, BrainCircuit } from 'lucide-react'
import { actions, uid, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { computeMatch } from '../../lib/matching'
import type { JobType, SeniorityKey, Vacancy, DegreeKey } from '../../lib/types'
import { Btn, ConfirmModal, Empty, Field, Input, Modal, PageHeader, ScoreBadge, Select, Tabs, Textarea, Tilt } from '../../components/ui'
import { CandidateCell } from '../../components/common'
import { DecisionBadge, skillName } from '../../components/match'
import { VacancyBody } from '../../components/VacancyParts'
import { DEGREES, LANGS } from '../../components/CandidateEditor'

const JOB_TYPES: JobType[] = ['full-time', 'part-time', 'contract', 'internship', 'remote']
const LEVELS: SeniorityKey[] = ['junior', 'mid', 'senior', 'lead']

function emptyVacancy(): Vacancy {
  return { id: uid('v'), title: '', company: '', description: '', type: 'full-time', seniority: 'mid', location: 'Bakı', minExperience: 2, minEducation: 'bachelor', fields: [], requirements: [], certs: [], languages: [], status: 'active', createdAt: new Date().toISOString().slice(0, 10), salary: '' }
}

function VacancyForm({ initial, onClose }: { initial: Vacancy | null; onClose: () => void }) {
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const isNew = !initial
  const [v, setV] = useState<Vacancy>(initial ?? emptyVacancy())
  const [err, setErr] = useState<Record<string, string>>({})
  const [sid, setSid] = useState('')
  const [lvl, setLvl] = useState(3)
  const avail = db.skills.filter((s) => !v.requirements.some((r) => r.skillId === s.id))
  const set = <K extends keyof Vacancy>(k: K, val: Vacancy[K]) => setV((p) => ({ ...p, [k]: val }))

  const save = () => {
    const e: Record<string, string> = {}
    if (v.title.trim().length < 3) e.title = t('val.required')
    if (!v.company.trim()) e.company = t('val.required')
    if (v.description.trim().length < 20) e.description = t('val.descMin')
    if (!v.requirements.length) e.requirements = t('val.reqMin')
    if (v.minExperience < 0 || v.minExperience > 40) e.minExperience = t('val.year')
    setErr(e)
    if (Object.keys(e).length) { toast(t('toast.fixErrors'), 'error'); return }
    actions.saveVacancy(v)
    toast(isNew ? t('toast.vacAdded') : t('toast.vacSaved'))
    onClose()
  }
  return (
    <Modal open wide onClose={onClose} title={isNew ? t('vac.add') : t('vac.edit')} footer={<><Btn variant="ghost" onClick={onClose}>{t('common.cancel')}</Btn><Btn onClick={save}>{t('common.save')}</Btn></>}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('vac.titleField')} error={err.title}><Input value={v.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label={t('vac.company')} error={err.company}><Input value={v.company} onChange={(e) => set('company', e.target.value)} /></Field>
          <Field label={t('vac.type')}><Select value={v.type} onChange={(e) => set('type', e.target.value as JobType)}>{JOB_TYPES.map((x) => <option key={x} value={x}>{t(`jobtype.${x}`)}</option>)}</Select></Field>
          <Field label={t('vac.seniority')}><Select value={v.seniority} onChange={(e) => { const k = e.target.value as SeniorityKey; setV((p) => ({ ...p, seniority: k, minExperience: db.kb.experienceLevels.find((l) => l.id === k)?.min ?? p.minExperience })) }}>{LEVELS.map((x) => <option key={x} value={x}>{t(`senior.${x}`)}</option>)}</Select></Field>
          <Field label={t('cand.location')}><Input value={v.location} onChange={(e) => set('location', e.target.value)} /></Field>
          <Field label={t('vac.salary')}><Input value={v.salary} onChange={(e) => set('salary', e.target.value)} placeholder="2000–3000 AZN" /></Field>
          <Field label={t('vac.minExp')} error={err.minExperience}><Input type="number" min={0} value={v.minExperience} onChange={(e) => set('minExperience', +e.target.value)} /></Field>
          <Field label={t('vac.minEdu')}><Select value={v.minEducation} onChange={(e) => set('minEducation', e.target.value as DegreeKey)}>{DEGREES.map((d) => <option key={d} value={d}>{t(`degree.${d}`)}</option>)}</Select></Field>
          <Field label={t('vac.fields')} hint={t('vac.fieldsHint')}><Input value={v.fields.join(', ')} onChange={(e) => set('fields', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Field>
          <Field label={t('common.status')}><Select value={v.status} onChange={(e) => set('status', e.target.value as Vacancy['status'])}><option value="active">{t('vac.active')}</option><option value="closed">{t('vac.closed')}</option></Select></Field>
        </div>
        <Field label={t('vac.description')} error={err.description}><Textarea value={v.description} onChange={(e) => set('description', e.target.value)} /></Field>

        <div className="border-t border-line pt-5">
          <h3 className="mb-3 font-display text-base font-bold">{t('vac.requirements')}</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[150px] flex-1"><label className="label">{t('kb.skill')}</label><Select value={sid || avail[0]?.id || ''} onChange={(e) => setSid(e.target.value)}>{avail.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
            <div className="w-36"><label className="label">{t('vac.minLevel')}</label><Select value={lvl} onChange={(e) => setLvl(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {t(`lvl.${n}`)}</option>)}</Select></div>
            <Btn variant="dark" onClick={() => { const id = sid || avail[0]?.id; if (id) { set('requirements', [...v.requirements, { skillId: id, level: lvl, mandatory: false }]); setSid('') } }} disabled={!avail.length}><Plus size={15} />{t('common.add')}</Btn>
          </div>
          {err.requirements && <p className="mt-1 text-xs text-red-600">{err.requirements}</p>}
          <ul className="mt-3 space-y-2">
            {v.requirements.map((r) => (
              <li key={r.skillId} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="min-w-[110px] flex-1 font-medium">{skillName(db.skills, r.skillId)}</span>
                <Select value={r.level} onChange={(e) => set('requirements', v.requirements.map((x) => (x.skillId === r.skillId ? { ...x, level: +e.target.value } : x)))} className="!w-auto !py-1.5" aria-label={t('vac.minLevel')}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {t(`lvl.${n}`)}</option>)}</Select>
                <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={r.mandatory} onChange={(e) => set('requirements', v.requirements.map((x) => (x.skillId === r.skillId ? { ...x, mandatory: e.target.checked } : x)))} className="accent-[rgb(var(--brand))]" />{t('vac.mandatory')}</label>
                <button onClick={() => set('requirements', v.requirements.filter((x) => x.skillId !== r.skillId))} className="rounded p-1 text-mute hover:text-red-600" aria-label={t('common.delete')}><X size={15} /></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-2">
          <div><h3 className="mb-2 font-display text-base font-bold">{t('cand.certs')}</h3>
            <div className="flex flex-wrap gap-1.5">{db.kb.certs.map((c) => { const on = v.certs.includes(c.id); return <button key={c.id} onClick={() => set('certs', on ? v.certs.filter((x) => x !== c.id) : [...v.certs, c.id])} className={`chip transition-colors ${on ? '!border-accent !bg-accent !text-accent-ink' : ''}`}>{c.name}</button> })}</div></div>
          <div><h3 className="mb-2 font-display text-base font-bold">{t('cand.languages')}</h3>
            <div className="space-y-2">{LANGS.map((l) => { const cur = v.languages.find((x) => x.lang === l)?.level ?? 0; return (
              <div key={l} className="flex items-center justify-between gap-2 text-sm"><span>{t(`language.${l}`)}</span>
                <Select value={cur} onChange={(e) => { const n = +e.target.value; set('languages', n === 0 ? v.languages.filter((x) => x.lang !== l) : [...v.languages.filter((x) => x.lang !== l), { lang: l, level: n }]) }} className="!w-auto !py-1.5"><option value={0}>—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t(`langlvl.${n}`)}</option>)}</Select></div>) })}</div></div>
        </div>
      </div>
    </Modal>
  )
}

export default function Vacancies() {
  const db = useDB()
  const { t, date } = useI18n()
  const toast = useToast()
  const [tab, setTab] = useState<'all' | 'active' | 'closed'>('all')
  const [form, setForm] = useState<Vacancy | 'new' | null>(null)
  const [view, setView] = useState<Vacancy | null>(null)
  const [del, setDel] = useState<Vacancy | null>(null)
  const list = db.vacancies.filter((v) => tab === 'all' || v.status === tab)

  const ranked = useMemo(() => {
    if (!view) return []
    const ids = new Set(db.applications.filter((a) => a.vacancyId === view.id).map((a) => a.candidateId))
    return db.candidates.filter((c) => ids.has(c.id)).map((c) => computeMatch(c, view, db.skills, db.kb)).sort((a, b) => b.total - a.total)
  }, [view, db])
  const liveView = view ? db.vacancies.find((v) => v.id === view.id) ?? null : null

  return (
    <div>
      <PageHeader eyebrow={t('nav.vacancies')} title={t('vac.title')} desc={t('vac.desc')} actions={<Btn onClick={() => setForm('new')}><Plus size={16} />{t('vac.add')}</Btn>} />
      <div className="mb-6"><Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: t('common.all') }, { id: 'active', label: t('vac.active') }, { id: 'closed', label: t('vac.closed') }]} /></div>

      {list.length === 0 ? <Empty title={t('common.noResults')} /> : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((v, i) => {
            const n = db.applications.filter((a) => a.vacancyId === v.id).length
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Tilt max={3}>
                  <article className="card flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="eyebrow mb-1">{v.company} · {v.location}</p><h3 className="font-display text-xl font-bold leading-snug">{v.title}</h3></div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${v.status === 'active' ? 'bg-accent text-accent-ink' : 'bg-surface2 text-mute'}`}>{t(v.status === 'active' ? 'vac.active' : 'vac.closed')}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-mute">{v.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="chip">{t(`jobtype.${v.type}`)}</span><span className="chip">{t(`senior.${v.seniority}`)}</span>
                      {v.requirements.slice(0, 3).map((r) => <span key={r.skillId} className="chip border-brand/40">{skillName(db.skills, r.skillId)}{r.mandatory && '*'}</span>)}
                      {v.requirements.length > 3 && <span className="chip text-mute">+{v.requirements.length - 3}</span>}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-mute"><Users size={14} />{n} · {date(v.createdAt)}</span>
                      <div className="flex gap-0.5">
                        <button className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" onClick={() => setView(v)} aria-label={t('common.view')}><Eye size={16} /></button>
                        <button className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" onClick={() => setForm(v)} aria-label={t('common.edit')}><Pencil size={16} /></button>
                        <button className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" onClick={() => { actions.saveVacancy({ ...v, status: v.status === 'active' ? 'closed' : 'active' }); toast(t('toast.vacSaved')) }} aria-label={t('vac.toggle')} title={t('vac.toggle')}><Power size={16} /></button>
                        <button className="rounded-lg p-2 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => setDel(v)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </article>
                </Tilt>
              </motion.div>
            )
          })}
        </div>
      )}

      {form && <VacancyForm initial={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      <Modal open={!!liveView} wide onClose={() => setView(null)} title={liveView?.title ?? ''} footer={liveView && <><Link to={`/app/matching?v=${liveView.id}`} className="btn btn-primary"><BrainCircuit size={16} />{t('vac.runMatching')}</Link></>}>
        {liveView && (
          <div className="space-y-6">
            <VacancyBody v={liveView} />
            <div>
              <p className="eyebrow mb-2">{t('vac.applicants', { n: ranked.length })}</p>
              {ranked.length ? (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {ranked.map((m) => { const c = db.candidates.find((x) => x.id === m.candidateId)!; return (
                    <li key={m.candidateId} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"><div className="min-w-[180px] flex-1"><CandidateCell c={c} /></div><DecisionBadge d={m.decision} size="sm" /><ScoreBadge value={m.total} /></li>) })}
                </ul>
              ) : <p className="text-sm text-mute">{t('vac.noApplicants')}</p>}
            </div>
          </div>
        )}
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title={t('vac.delete')} text={t('vac.deleteText', { name: del?.title ?? '' })} onConfirm={() => { if (del) { actions.deleteVacancy(del.id); toast(t('toast.vacDeleted')) } }} />
    </div>
  )
}
