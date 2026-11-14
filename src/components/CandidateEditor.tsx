import { useState, type ReactNode } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import type { Candidate, DegreeKey, LangCode, Skill } from '../lib/types'
import { useI18n } from '../i18n'
import { Field, Input, Level, Select, Textarea } from './ui'
import { uid } from '../lib/store'

const YEAR = new Date().getFullYear()
export const DEGREES: DegreeKey[] = ['highschool', 'college', 'bachelor', 'master', 'phd']
export const LANGS: LangCode[] = ['az', 'en', 'ru', 'tr', 'de']

export function emptyCandidate(): Candidate {
  return {
    id: uid('c'), name: '', email: '', phone: '', location: '', title: '', summary: '', hue: Math.floor(Math.random() * 360),
    skills: [], experience: [], education: [], certificates: [], languages: [], github: null, portfolio: '', createdAt: new Date().toISOString().slice(0, 10),
  }
}

export type Errors = Record<string, string>
export function validateCandidate(c: Candidate, t: (k: string, v?: Record<string, string | number>) => string, others: Candidate[]): Errors {
  const e: Errors = {}
  if (c.name.trim().length < 2) e.name = t('val.required')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) e.email = t('val.email')
  else if (others.some((o) => o.id !== c.id && o.email.toLowerCase() === c.email.toLowerCase())) e.email = t('val.emailUsed')
  if (c.phone && !/^[+\d][\d\s()-]{6,}$/.test(c.phone)) e.phone = t('val.phone')
  if (!c.title.trim()) e.title = t('val.required')
  if (c.portfolio && !/^https?:\/\/\S+\.\S+/.test(c.portfolio)) e.portfolio = t('val.url')
  c.experience.forEach((x, i) => {
    if (!x.role.trim() || !x.company.trim()) e[`exp${i}`] = t('val.expFields')
    else if (x.to !== null && x.to < x.from) e[`exp${i}`] = t('val.yearOrder')
    else if (x.from < 1970 || x.from > YEAR) e[`exp${i}`] = t('val.year')
  })
  c.education.forEach((x, i) => { if (!x.school.trim() || !x.field.trim()) e[`edu${i}`] = t('val.eduFields') })
  c.certificates.forEach((x, i) => { if (!x.name.trim()) e[`cert${i}`] = t('val.required') })
  return e
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line pt-5">
      <div className="flex items-center justify-between"><h3 className="font-display text-base font-bold">{title}</h3>{action}</div>
      {children}
    </section>
  )
}
const AddBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className="btn btn-ghost btn-sm"><Plus size={14} />{label}</button>
)

export function SkillsEditor({ skills, value, onChange }: { skills: Skill[]; value: Candidate['skills']; onChange: (s: Candidate['skills']) => void }) {
  const { t } = useI18n()
  const [sid, setSid] = useState('')
  const [lvl, setLvl] = useState(3)
  const avail = skills.filter((s) => !value.some((v) => v.skillId === s.id))
  const add = () => {
    const id = sid || avail[0]?.id
    if (!id) return
    onChange([...value, { skillId: id, level: lvl }])
    setSid('')
  }
  const byCat = (cat: string) => value.filter((v) => skills.find((s) => s.id === v.skillId)?.category === cat)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1"><label className="label">{t('kb.skill')}</label>
          <Select value={sid || avail[0]?.id || ''} onChange={(e) => setSid(e.target.value)} disabled={!avail.length}>
            {avail.map((s) => <option key={s.id} value={s.id}>{s.name} · {t(`cat.${s.category}`)}</option>)}
          </Select>
        </div>
        <div className="w-28"><label className="label">{t('kb.level')}</label>
          <Select value={lvl} onChange={(e) => setLvl(+e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {t(`lvl.${n}`)}</option>)}</Select>
        </div>
        <button type="button" className="btn btn-dark" onClick={add} disabled={!avail.length}><Plus size={15} />{t('common.add')}</button>
      </div>
      {value.length === 0 && <p className="text-sm text-mute">{t('profile.noSkills')}</p>}
      {(['technical', 'tools', 'domain', 'soft'] as const).map((cat) => {
        const list = byCat(cat)
        if (!list.length) return null
        return (
          <div key={cat}>
            <p className="eyebrow mb-1.5">{t(`cat.${cat}`)}</p>
            <div className="flex flex-wrap gap-2">
              {list.map((s) => (
                <span key={s.skillId} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface2/50 py-1 pl-3 pr-1.5 text-sm">
                  {skills.find((x) => x.id === s.skillId)?.name}
                  <select value={s.level} onChange={(e) => onChange(value.map((v) => (v.skillId === s.skillId ? { ...v, level: +e.target.value } : v)))} className="rounded-md bg-transparent font-mono text-xs" aria-label={t('kb.level')}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <Level value={s.level} />
                  <button type="button" onClick={() => onChange(value.filter((v) => v.skillId !== s.skillId))} className="rounded-full p-1 text-mute hover:bg-red-500/15 hover:text-red-600" aria-label={t('common.delete')}><X size={13} /></button>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CandidateEditor({ value, onChange, skills, errors }: { value: Candidate; onChange: (c: Candidate) => void; skills: Skill[]; errors: Errors }) {
  const { t } = useI18n()
  const set = <K extends keyof Candidate>(k: K, v: Candidate[K]) => onChange({ ...value, [k]: v })
  const [editExp, setEditExp] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('cand.name')} error={errors.name}><Input value={value.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label={t('cand.titleField')} error={errors.title}><Input value={value.title} onChange={(e) => set('title', e.target.value)} placeholder="Frontend Developer" /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={value.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label={t('cand.phone')} error={errors.phone}><Input value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+994 50 000 00 00" /></Field>
        <Field label={t('cand.location')}><Input value={value.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label={t('cand.portfolio')} error={errors.portfolio}><Input value={value.portfolio} onChange={(e) => set('portfolio', e.target.value)} placeholder="https://" /></Field>
        <Field label="GitHub"><Input value={value.github?.user ?? ''} onChange={(e) => set('github', e.target.value.trim() ? { user: e.target.value.trim(), repos: value.github?.repos ?? 0, stars: value.github?.stars ?? 0, langs: value.github?.langs ?? [] } : null)} placeholder="username" /></Field>
      </div>
      <Field label={t('cand.summary')}><Textarea value={value.summary} onChange={(e) => set('summary', e.target.value)} /></Field>

      <Section title={t('cand.skills')}><SkillsEditor skills={skills} value={value.skills} onChange={(s) => set('skills', s)} /></Section>

      <Section title={t('cand.experience')} action={<AddBtn label={t('common.add')} onClick={() => { const id = uid('x'); set('experience', [...value.experience, { id, role: '', company: '', from: YEAR - 1, to: null, description: '', skills: [] }]); setEditExp(id) }} />}>
        {value.experience.length === 0 && <p className="text-sm text-mute">{t('common.noItems')}</p>}
        {value.experience.map((x, i) => {
          const upd = (p: Partial<typeof x>) => set('experience', value.experience.map((y) => (y.id === x.id ? { ...y, ...p } : y)))
          const open = editExp === x.id
          return (
            <div key={x.id} className="rounded-xl border border-line p-3">
              {!open ? (
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-semibold">{x.role || '—'} · {x.company || '—'}</p><p className="font-mono text-xs text-mute">{x.from} — {x.to ?? t('cand.present')}</p>{x.description && <p className="mt-1 text-xs text-mute">{x.description}</p>}{errors[`exp${i}`] && <p className="mt-1 text-xs text-red-600">{errors[`exp${i}`]}</p>}</div>
                  <div className="flex gap-1"><button type="button" className="rounded p-1.5 text-mute hover:bg-surface2" onClick={() => setEditExp(x.id)} aria-label={t('common.edit')}><Pencil size={14} /></button><button type="button" className="rounded p-1.5 text-mute hover:bg-red-500/15 hover:text-red-600" onClick={() => set('experience', value.experience.filter((y) => y.id !== x.id))} aria-label={t('common.delete')}><Trash2 size={14} /></button></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t('cand.role')}><Input value={x.role} onChange={(e) => upd({ role: e.target.value })} /></Field>
                    <Field label={t('cand.company')}><Input value={x.company} onChange={(e) => upd({ company: e.target.value })} /></Field>
                    <Field label={t('cand.from')}><Input type="number" value={x.from} onChange={(e) => upd({ from: +e.target.value })} /></Field>
                    <Field label={t('cand.to')} hint={t('cand.toHint')}><Input type="number" value={x.to ?? ''} onChange={(e) => upd({ to: e.target.value === '' ? null : +e.target.value })} /></Field>
                  </div>
                  <Field label={t('cand.descr')}><Textarea value={x.description} onChange={(e) => upd({ description: e.target.value })} /></Field>
                  <Field label={t('cand.usedSkills')}>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.filter((s) => s.category !== 'soft').map((s) => {
                        const on = x.skills.includes(s.id)
                        return <button type="button" key={s.id} onClick={() => upd({ skills: on ? x.skills.filter((q) => q !== s.id) : [...x.skills, s.id] })} className={`chip transition-colors ${on ? '!border-accent !bg-accent !text-accent-ink' : ''}`}>{s.name}</button>
                      })}
                    </div>
                  </Field>
                  <button type="button" className="btn btn-dark btn-sm" onClick={() => setEditExp(null)}><Check size={14} />{t('common.done')}</button>
                </div>
              )}
            </div>
          )
        })}
      </Section>

      <Section title={t('cand.education')} action={<AddBtn label={t('common.add')} onClick={() => set('education', [...value.education, { id: uid('e'), degree: 'bachelor', field: '', school: '', year: YEAR }])} />}>
        {value.education.length === 0 && <p className="text-sm text-mute">{t('common.noItems')}</p>}
        {value.education.map((x, i) => {
          const upd = (p: Partial<typeof x>) => set('education', value.education.map((y) => (y.id === x.id ? { ...y, ...p } : y)))
          return (
            <div key={x.id} className="rounded-xl border border-line p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('cand.degree')}><Select value={x.degree} onChange={(e) => upd({ degree: e.target.value as DegreeKey })}>{DEGREES.map((d) => <option key={d} value={d}>{t(`degree.${d}`)}</option>)}</Select></Field>
                <Field label={t('cand.year')}><Input type="number" value={x.year} onChange={(e) => upd({ year: +e.target.value })} /></Field>
                <Field label={t('cand.field')}><Input value={x.field} onChange={(e) => upd({ field: e.target.value })} /></Field>
                <Field label={t('cand.school')}><Input value={x.school} onChange={(e) => upd({ school: e.target.value })} /></Field>
              </div>
              <div className="mt-2 flex items-center justify-between">{errors[`edu${i}`] ? <p className="text-xs text-red-600">{errors[`edu${i}`]}</p> : <span />}<button type="button" className="btn btn-danger btn-sm" onClick={() => set('education', value.education.filter((y) => y.id !== x.id))}><Trash2 size={13} />{t('common.delete')}</button></div>
            </div>
          )
        })}
      </Section>

      <Section title={t('cand.certs')} action={<AddBtn label={t('common.add')} onClick={() => set('certificates', [...value.certificates, { id: uid('c'), name: '', issuer: '', year: YEAR }])} />}>
        {value.certificates.length === 0 && <p className="text-sm text-mute">{t('common.noItems')}</p>}
        {value.certificates.map((x, i) => {
          const upd = (p: Partial<typeof x>) => set('certificates', value.certificates.map((y) => (y.id === x.id ? { ...y, ...p } : y)))
          return (
            <div key={x.id} className="grid items-end gap-3 rounded-xl border border-line p-3 sm:grid-cols-[2fr_1.4fr_90px_auto]">
              <Field label={t('common.name')} error={errors[`cert${i}`]}><Input value={x.name} onChange={(e) => upd({ name: e.target.value })} /></Field>
              <Field label={t('cand.issuer')}><Input value={x.issuer} onChange={(e) => upd({ issuer: e.target.value })} /></Field>
              <Field label={t('cand.year')}><Input type="number" value={x.year} onChange={(e) => upd({ year: +e.target.value })} /></Field>
              <button type="button" className="btn btn-danger btn-sm mb-1" onClick={() => set('certificates', value.certificates.filter((y) => y.id !== x.id))} aria-label={t('common.delete')}><Trash2 size={14} /></button>
            </div>
          )
        })}
      </Section>

      <Section title={t('cand.languages')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LANGS.map((l) => {
            const cur = value.languages.find((x) => x.lang === l)?.level ?? 0
            return (
              <div key={l} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
                <span className="text-sm font-medium">{t(`language.${l}`)}</span>
                <Select value={cur} onChange={(e) => { const n = +e.target.value; set('languages', n === 0 ? value.languages.filter((x) => x.lang !== l) : [...value.languages.filter((x) => x.lang !== l), { lang: l, level: n }]) }} className="!w-auto !py-1.5">
                  <option value={0}>—</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t(`langlvl.${n}`)}</option>)}
                </Select>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
