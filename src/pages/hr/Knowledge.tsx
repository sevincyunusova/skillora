import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, RotateCcw } from 'lucide-react'
import { actions, uid, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import type { DecisionKey, KBCert, KnowledgeBase, Skill, SkillCategory } from '../../lib/types'
import { Btn, ConfirmModal, Empty, Field, Input, Level, Modal, PageHeader, SearchBox, Select, Tabs, Textarea } from '../../components/ui'
import KnowledgeNetwork from '../../components/KnowledgeNetwork'

const CATS: SkillCategory[] = ['technical', 'tools', 'domain', 'soft']
type Tab = 'skills' | 'network' | 'criteria' | 'certs' | 'rules'

function SkillForm({ initial, onClose }: { initial: Skill | null; onClose: () => void }) {
  const db = useDB()
  const { t, lt, lang } = useI18n()
  const toast = useToast()
  const [s, setS] = useState<Skill>(initial ?? { id: '', name: '', category: 'technical', description: '', level: 3, related: [] })
  const [desc, setDesc] = useState(initial ? lt(initial.description) : '')
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    const name = s.name.trim()
    if (name.length < 2) e.name = t('val.required')
    else if (db.skills.some((x) => x.id !== s.id && x.name.toLowerCase() === name.toLowerCase())) e.name = t('val.skillExists')
    if (desc.trim().length < 5) e.desc = t('val.descShort')
    setErr(e)
    if (Object.keys(e).length) return
    const id = initial ? s.id : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5)
    const description = initial && typeof initial.description === 'object' ? { ...initial.description, [lang]: desc.trim() } : { az: desc.trim(), en: desc.trim(), ru: desc.trim() }
    const next: Skill = { ...s, id, name, description }
    actions.saveSkill(next)
    // keep graph symmetric
    db.skills.forEach((o) => { if (o.id !== id) { const has = o.related.includes(id); const want = next.related.includes(o.id); if (has !== want) actions.saveSkill({ ...o, related: want ? [...o.related, id] : o.related.filter((r) => r !== id) }) } })
    toast(initial ? t('toast.skillSaved') : t('toast.skillAdded'))
    onClose()
  }
  return (
    <Modal open wide onClose={onClose} title={initial ? t('kb.editSkill') : t('kb.addSkill')} footer={<><Btn variant="ghost" onClick={onClose}>{t('common.cancel')}</Btn><Btn onClick={save}>{t('common.save')}</Btn></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('common.name')} error={err.name}><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></Field>
          <Field label={t('kb.category')}><Select value={s.category} onChange={(e) => setS({ ...s, category: e.target.value as SkillCategory })}>{CATS.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}</Select></Field>
          <Field label={t('kb.level')}><Select value={s.level} onChange={(e) => setS({ ...s, level: +e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {t(`lvl.${n}`)}</option>)}</Select></Field>
        </div>
        <Field label={t('kb.description')} error={err.desc}><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <Field label={t('kb.related')} hint={t('kb.relatedHint')}>
          <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">{db.skills.filter((o) => o.id !== s.id).map((o) => { const on = s.related.includes(o.id); return <button type="button" key={o.id} onClick={() => setS({ ...s, related: on ? s.related.filter((r) => r !== o.id) : [...s.related, o.id] })} className={`chip transition-colors ${on ? '!border-accent !bg-accent !text-accent-ink' : ''}`}>{o.name}</button> })}</div>
        </Field>
      </div>
    </Modal>
  )
}

export default function Knowledge() {
  const db = useDB()
  const { t, lt } = useI18n()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('skills')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<SkillCategory | ''>('')
  const [form, setForm] = useState<Skill | 'new' | null>(null)
  const [del, setDel] = useState<Skill | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [kb, setKb] = useState<KnowledgeBase>(db.kb)
  const [certForm, setCertForm] = useState<KBCert | 'new' | null>(null)
  const [certDel, setCertDel] = useState<KBCert | null>(null)
  const dirty = JSON.stringify(kb) !== JSON.stringify(db.kb)
  const wsum = Object.values(kb.weights).reduce((a, b) => a + b, 0)
  const selSkill = db.skills.find((s) => s.id === sel)

  const list = db.skills.filter((s) => (!cat || s.category === cat) && (!q || s.name.toLowerCase().includes(q.toLowerCase())))
  const saveKb = () => {
    if (wsum !== 100) { toast(t('kb.weightsMust'), 'error'); return }
    const r = [...kb.rules].filter((x) => x.id !== 'low')
    const ord = ['interview', 'assess', 'reserve']
    const mins = ord.map((k) => r.find((x) => x.id === k)!.min)
    if (!(mins[0] > mins[1] && mins[1] > mins[2] && mins[2] > 0 && mins[0] <= 100)) { toast(t('kb.rulesOrder'), 'error'); return }
    actions.saveKB(kb); toast(t('toast.kbSaved'))
  }

  return (
    <div>
      <PageHeader eyebrow={t('nav.knowledge')} title={t('kb.title')} desc={t('kb.desc')} actions={tab === 'skills' ? <Btn onClick={() => setForm('new')}><Plus size={16} />{t('kb.addSkill')}</Btn> : tab === 'certs' ? <Btn onClick={() => setCertForm('new')}><Plus size={16} />{t('kb.addCert')}</Btn> : (tab === 'criteria' || tab === 'rules') ? <><Btn variant="ghost" onClick={() => setKb(db.kb)} disabled={!dirty}><RotateCcw size={15} />{t('common.reset')}</Btn><Btn onClick={saveKb} disabled={!dirty}><Save size={15} />{t('common.save')}</Btn></> : null} />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[[db.skills.length, 'kb.stat.skills'], [new Set(db.skills.flatMap((s) => s.related.map((r) => (s.id < r ? `${s.id}|${r}` : `${r}|${s.id}`)))).size, 'kb.stat.links'], [db.kb.certs.length, 'kb.stat.certs'], [db.kb.rules.length + db.kb.education.length + db.kb.experienceLevels.length, 'kb.stat.rules']].map(([n, k]) => <div key={k as string} className="bg-surface px-5 py-4"><p className="font-display text-3xl font-bold">{n}</p><p className="eyebrow mt-1 !text-[10px]">{t(k as string)}</p></div>)}
      </div>
      <div className="mb-6"><Tabs value={tab} onChange={setTab} items={(['skills', 'network', 'criteria', 'certs', 'rules'] as Tab[]).map((x) => ({ id: x, label: t(`kb.tab.${x}`) }))} /></div>

      {tab === 'skills' && (
        <div>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]"><SearchBox value={q} onChange={setQ} placeholder={t('kb.search')} />
            <div className="flex flex-wrap gap-1.5"><button onClick={() => setCat('')} className={`chip ${!cat ? '!border-ink !bg-ink !text-bg' : ''}`}>{t('common.all')}</button>{CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? '!border-ink !bg-ink !text-bg' : ''}`}>{t(`cat.${c}`)}</button>)}</div></div>
          {list.length === 0 ? <Empty title={t('common.noResults')} /> : (
            <div className="card divide-y divide-line overflow-hidden">
              {list.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }} className="grid items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-surface2/40 lg:grid-cols-[minmax(150px,1fr)_2fr_auto_auto]">
                  <div><p className="font-semibold">{s.name}</p><span className="chip mt-1 !py-0 text-[11px]">{t(`cat.${s.category}`)}</span></div><p className="text-sm text-mute">{lt(s.description)}</p>
                  <div className="flex items-center gap-2"><Level value={s.level} /><span className="w-16 font-mono text-xs text-mute">{t(`lvl.${s.level}`)}</span></div>
                  <div className="flex gap-0.5"><button className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" onClick={() => setForm(s)} aria-label={t('common.edit')}><Pencil size={15} /></button><button className="rounded-lg p-2 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => setDel(s)} aria-label={t('common.delete')}><Trash2 size={15} /></button></div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'network' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="card p-2 md:p-4"><KnowledgeNetwork skills={db.skills} selected={sel} onSelect={setSel} /><p className="px-3 pb-2 text-center text-xs text-mute">{t('kb.networkHint')}</p></div>
          <aside className="card self-start p-5">
            {selSkill ? (
              <div className="space-y-4">
                <div><p className="eyebrow mb-1">{t(`cat.${selSkill.category}`)}</p><h3 className="font-display text-2xl font-bold">{selSkill.name}</h3><p className="mt-1 text-sm text-mute">{lt(selSkill.description)}</p></div>
                <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm"><span>{t('kb.level')}</span><span className="flex items-center gap-2"><Level value={selSkill.level} /><b className="font-mono text-xs">{t(`lvl.${selSkill.level}`)}</b></span></div>
                <div><p className="eyebrow mb-2">{t('kb.related')}</p><div className="flex flex-wrap gap-1.5">{db.skills.filter((o) => selSkill.related.includes(o.id) || o.related.includes(selSkill.id)).map((o) => <button key={o.id} onClick={() => setSel(o.id)} className="chip hover:bg-surface2">{o.name}</button>)}</div></div>
                <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-center">
                  <div><dt className="eyebrow !text-[10px]">{t('kb.usedByCand')}</dt><dd className="font-display text-2xl font-bold">{db.candidates.filter((c) => c.skills.some((x) => x.skillId === selSkill.id)).length}</dd></div>
                  <div><dt className="eyebrow !text-[10px]">{t('kb.requiredBy')}</dt><dd className="font-display text-2xl font-bold">{db.vacancies.filter((v) => v.requirements.some((r) => r.skillId === selSkill.id)).length}</dd></div>
                </dl>
                <div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => setForm(selSkill)}><Pencil size={13} />{t('common.edit')}</Btn></div>
              </div>
            ) : <div className="py-10 text-center text-sm text-mute"><div className="mx-auto mb-3 h-10 w-10 rotate-45 rounded-md border-2 border-dashed border-brand/60" />{t('kb.selectNode')}</div>}
            <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4 text-xs">{CATS.map((c) => <span key={c} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: { technical: '#747B50', soft: '#82758F', tools: '#B9C63A', domain: '#A8895C' }[c] }} />{t(`cat.${c}`)}</span>)}</div>
          </aside>
        </div>
      )}

      {tab === 'criteria' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">{t('kb.weights')}</h3><p className="text-sm text-mute">{t('kb.weightsDesc')}</p></div><span className={`rounded-full px-3 py-1 font-mono text-sm ${wsum === 100 ? 'bg-accent text-accent-ink' : 'bg-red-500/15 text-red-700 dark:text-red-300'}`}>{wsum}%</span></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(kb.weights) as (keyof KnowledgeBase['weights'])[]).map((k) => (
                <div key={k}><label className="label flex justify-between"><span>{t(`crit.${k}`)}</span><b className="text-ink">{kb.weights[k]}%</b></label><input type="range" min={0} max={60} value={kb.weights[k]} onChange={(e) => setKb({ ...kb, weights: { ...kb.weights, [k]: +e.target.value } })} className="w-full accent-[rgb(var(--brand))]" /></div>
              ))}
            </div>
          </section>
          <section className="card p-5"><h3 className="mb-1 font-display text-lg font-bold">{t('kb.expLevels')}</h3><p className="mb-4 text-sm text-mute">{t('kb.expDesc')}</p>
            <ul className="space-y-3">{kb.experienceLevels.map((l, i) => <li key={l.id} className="rounded-xl border border-line p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{t(`senior.${l.id}`)}</p><p className="text-xs text-mute">{lt(l.description)}</p></div><div className="flex items-center gap-2 text-sm"><Input type="number" min={0} value={l.min} className="!w-16 !py-1.5" aria-label="min" onChange={(e) => setKb({ ...kb, experienceLevels: kb.experienceLevels.map((x, j) => (j === i ? { ...x, min: Math.max(0, +e.target.value) } : x)) })} /><span>→</span><span className="w-12 font-mono text-xs text-mute">{kb.experienceLevels[i + 1] ? kb.experienceLevels[i + 1].min : '∞'} {t('cand.yrs')}</span></div></div></li>)}</ul></section>
          <section className="card p-5"><h3 className="mb-1 font-display text-lg font-bold">{t('kb.eduCriteria')}</h3><p className="mb-4 text-sm text-mute">{t('kb.eduDesc')}</p>
            <ul className="space-y-3">{kb.education.map((e, i) => <li key={e.id} className="flex items-center gap-3"><span className="w-28 text-sm font-medium">{t(`degree.${e.id}`)}</span><input type="range" min={0} max={100} value={e.points} onChange={(ev) => setKb({ ...kb, education: kb.education.map((x, j) => (j === i ? { ...x, points: +ev.target.value } : x)) })} className="flex-1 accent-[rgb(var(--brand))]" aria-label={t(`degree.${e.id}`)} /><b className="w-10 text-right font-mono text-sm">{e.points}</b></li>)}</ul></section>
        </div>
      )}

      {tab === 'certs' && (
        <div className="card divide-y divide-line overflow-hidden">
          {db.kb.certs.map((c) => (
            <div key={c.id} className="grid items-center gap-3 px-5 py-3.5 hover:bg-surface2/40 md:grid-cols-[1.4fr_1fr_1.6fr_auto]">
              <p className="font-semibold">{c.name}</p><p className="text-sm text-mute">{c.issuer}</p>
              <div className="flex flex-wrap gap-1">{c.skills.map((id) => <span key={id} className="chip !py-0 text-[11px]">{db.skills.find((s) => s.id === id)?.name ?? id}</span>)}</div>
              <div className="flex gap-0.5"><button className="rounded-lg p-2 text-mute hover:bg-surface2" onClick={() => setCertForm(c)} aria-label={t('common.edit')}><Pencil size={15} /></button><button className="rounded-lg p-2 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => setCertDel(c)} aria-label={t('common.delete')}><Trash2 size={15} /></button></div>
            </div>
          ))}
          {!db.kb.certs.length && <p className="p-8 text-center text-sm text-mute">{t('common.noItems')}</p>}
        </div>
      )}

      {tab === 'rules' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h3 className="mb-1 font-display text-lg font-bold">{t('kb.thresholds')}</h3><p className="mb-4 text-sm text-mute">{t('kb.thresholdsDesc')}</p>
            <ul className="space-y-4">
              {(['interview', 'assess', 'reserve', 'low'] as DecisionKey[]).map((k) => { const r = kb.rules.find((x) => x.id === k)!; return (
                <li key={k} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{t(`decision.${k}`)}</p><p className="text-xs text-mute">{t(`decision.${k}.desc`)}</p></div>
                    {k !== 'low' ? <div className="flex items-center gap-2 text-sm">≥<Input type="number" min={1} max={100} value={r.min} className="!w-20 !py-1.5" aria-label={k} onChange={(e) => setKb({ ...kb, rules: kb.rules.map((x) => (x.id === k ? { ...x, min: +e.target.value } : x)) })} />%</div> : <span className="font-mono text-sm text-mute">&lt; {kb.rules.find((x) => x.id === 'reserve')!.min}%</span>}</div>
                </li>) })}
            </ul>
          </section>
          <section className="card space-y-4 p-5"><h3 className="font-display text-lg font-bold">{t('kb.constraintRules')}</h3>
            {['mandatory.missing', 'mandatory.below'].map((k) => <div key={k} className="rounded-xl border border-line p-3 text-sm"><p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-brand">IF</p><p>{t(`kb.if.${k}`)}</p><p className="mb-1 mt-2 font-mono text-[11px] uppercase tracking-wider text-brand">THEN</p><p>{t(`kb.then.${k}`)}</p></div>)}
            <p className="text-xs text-mute">{t('kb.constraintNote')}</p>
          </section>
        </div>
      )}

      {form && <SkillForm initial={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {certForm && <CertForm initial={certForm === 'new' ? null : certForm} onClose={() => setCertForm(null)} />}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title={t('kb.deleteSkill')} text={t('kb.deleteSkillText', { name: del?.name ?? '' })} onConfirm={() => { if (del) { actions.deleteSkill(del.id); if (sel === del.id) setSel(null); toast(t('toast.skillDeleted')) } }} />
      <ConfirmModal open={!!certDel} onClose={() => setCertDel(null)} title={t('kb.deleteCert')} text={certDel?.name ?? ''} onConfirm={() => { if (certDel) { const next = { ...db.kb, certs: db.kb.certs.filter((c) => c.id !== certDel.id) }; actions.saveKB(next); setKb((k) => ({ ...k, certs: next.certs })); toast(t('toast.certDeleted')) } }} />
    </div>
  )
}

function CertForm({ initial, onClose }: { initial: KBCert | null; onClose: () => void }) {
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const [c, setC] = useState<KBCert>(initial ?? { id: uid('cert'), name: '', issuer: '', skills: [] })
  const [err, setErr] = useState('')
  const save = () => {
    if (c.name.trim().length < 2) { setErr(t('val.required')); return }
    const certs = initial ? db.kb.certs.map((x) => (x.id === c.id ? c : x)) : [...db.kb.certs, c]
    actions.saveKB({ ...db.kb, certs }); toast(t('toast.certSaved')); onClose()
  }
  return (
    <Modal open onClose={onClose} title={initial ? t('kb.editCert') : t('kb.addCert')} footer={<><Btn variant="ghost" onClick={onClose}>{t('common.cancel')}</Btn><Btn onClick={save}>{t('common.save')}</Btn></>}>
      <div className="space-y-4">
        <Field label={t('common.name')} error={err}><Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
        <Field label={t('cand.issuer')}><Input value={c.issuer} onChange={(e) => setC({ ...c, issuer: e.target.value })} /></Field>
        <Field label={t('kb.certSkills')}><div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">{db.skills.map((s) => { const on = c.skills.includes(s.id); return <button type="button" key={s.id} onClick={() => setC({ ...c, skills: on ? c.skills.filter((x) => x !== s.id) : [...c.skills, s.id] })} className={`chip ${on ? '!border-accent !bg-accent !text-accent-ink' : ''}`}>{s.name}</button> })}</div></Field>
      </div>
    </Modal>
  )
}
