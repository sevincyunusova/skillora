import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, ListPlus, Printer, Trash2, CheckSquare, Square } from 'lucide-react'
import { actions, uid, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { computeMatch } from '../../lib/matching'
import { generalQuestion, questionFor, type QKind } from '../../data/questions'
import { Btn, Empty, Field, Input, PageHeader, Select } from '../../components/ui'
import { CandidateCell } from '../../components/common'
import { skillName } from '../../components/match'

interface Q { id: string; skillId: string; kind: QKind | 'general'; text: string }

export default function Interview() {
  const db = useDB()
  const { t, lang, date } = useI18n()
  const toast = useToast()
  const [sp] = useSearchParams()
  const [cid, setCid] = useState(sp.get('c') || db.candidates[0]?.id || '')
  const [vid, setVid] = useState(sp.get('v') || db.vacancies.find((v) => v.status === 'active')?.id || db.vacancies[0]?.id || '')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const c = db.candidates.find((x) => x.id === cid)
  const v = db.vacancies.find((x) => x.id === vid)

  const { groups, qs } = useMemo(() => {
    if (!c || !v) return { groups: [], qs: [] as Q[] }
    const m = computeMatch(c, v, db.skills, db.kb)
    const cat = (id: string) => db.skills.find((s) => s.id === id)?.category ?? 'technical'
    const sn = (id: string) => skillName(db.skills, id)
    const make = (id: string, kind: QKind): Q => ({ id: `${id}:${kind}:${lang}`, skillId: id, kind, text: questionFor(id, sn(id), cat(id), kind, lang) })
    const gap = m.missing.map((g) => make(g.skillId, 'gap'))
    const imp = m.improve.map((g) => make(g.skillId, 'improve'))
    const ver = m.strengths.slice(0, 4).map((s) => make(s.skillId, 'verify'))
    const gen: Q[] = [0, 1, 2].map((i) => ({ id: `general:${i}:${lang}`, skillId: 'general', kind: 'general', text: generalQuestion(i, lang) }))
    return { groups: [{ k: 'gap', items: gap }, { k: 'improve', items: imp }, { k: 'verify', items: ver }, { k: 'general', items: gen }].filter((g) => g.items.length), qs: [...gap, ...imp, ...ver, ...gen] }
  }, [c, v, db.skills, db.kb, lang])

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const chosen = qs.filter((q) => sel.has(q.id))
  const copy = async (texts: string[]) => {
    const body = texts.map((x, i) => `${i + 1}. ${x}`).join('\n')
    try { await navigator.clipboard.writeText(body); toast(t('int.copied', { n: texts.length })) } catch {
      const ta = document.createElement('textarea'); ta.value = body; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('int.copied', { n: texts.length })) } catch { toast(t('int.copyFail'), 'error') } ta.remove()
    }
  }
  const create = () => {
    if (!chosen.length) { toast(t('int.selectFirst'), 'error'); return }
    if (!c || !v) return
    actions.saveInterviewList({ id: uid('il'), name: name.trim() || `${c.name} — ${v.title}`, candidateId: c.id, vacancyId: v.id, questions: chosen.map((q) => ({ id: q.id, skillId: q.skillId, text: q.text })), createdAt: new Date().toISOString() })
    setName(''); toast(t('int.created'))
  }

  return (
    <div>
      <PageHeader eyebrow={t('nav.interview')} title={t('int.title')} desc={t('int.desc')} />
      <div className="card mb-6 grid gap-4 p-5 md:grid-cols-2">
        <Field label={t('nav.candidates')}><Select value={cid} onChange={(e) => { setCid(e.target.value); setSel(new Set()) }}>{db.candidates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label={t('nav.vacancies')}><Select value={vid} onChange={(e) => { setVid(e.target.value); setSel(new Set()) }}>{db.vacancies.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select></Field>
      </div>

      {!c || !v ? <Empty title={t('common.noData')} /> : (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><CandidateCell c={c} sub={v.title} />
              <div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => setSel(new Set(qs.map((q) => q.id)))}>{t('int.selectAll')}</Btn><Btn variant="ghost" size="sm" onClick={() => setSel(new Set())}>{t('int.clear')}</Btn></div></div>
            {groups.map((g) => (
              <section key={g.k} className="card overflow-hidden">
                <header className="border-b border-line bg-surface2/40 px-5 py-3"><h3 className="font-display text-base font-bold">{t(`int.group.${g.k}`)}</h3><p className="text-xs text-mute">{t(`int.group.${g.k}.desc`)}</p></header>
                <ul className="divide-y divide-line">
                  {g.items.map((q) => { const on = sel.has(q.id); return (
                    <li key={q.id}><button onClick={() => toggle(q.id)} className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface2/40 ${on ? 'bg-accent/15' : ''}`} aria-pressed={on}>
                      {on ? <CheckSquare size={18} className="mt-0.5 shrink-0 text-brand" /> : <Square size={18} className="mt-0.5 shrink-0 text-mute" />}
                      <span><span className="block text-sm">{q.text}</span>{q.skillId !== 'general' && <span className="chip mt-1.5 !py-0 text-[11px]">{skillName(db.skills, q.skillId)}</span>}</span></button></li>) })}
                </ul>
              </section>
            ))}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <section className="card p-5">
              <h3 className="font-display text-lg font-bold">{t('int.selected', { n: chosen.length })}</h3>
              {chosen.length === 0 ? <p className="mt-2 text-sm text-mute">{t('int.selectFirst')}</p> : <ol className="mt-3 max-h-64 list-decimal space-y-2 overflow-y-auto pl-5 text-sm">{chosen.map((q) => <li key={q.id}>{q.text}</li>)}</ol>}
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('int.listName')} aria-label={t('int.listName')} />
                <div className="flex flex-wrap gap-2"><Btn onClick={create}><ListPlus size={15} />{t('int.create')}</Btn><Btn variant="ghost" onClick={() => chosen.length ? copy(chosen.map((q) => q.text)) : toast(t('int.selectFirst'), 'error')}><Copy size={15} />{t('int.copy')}</Btn></div>
              </div>
            </section>
            <section className="card p-5 print-area">
              <h3 className="mb-3 font-display text-lg font-bold">{t('int.lists', { n: db.interviewLists.length })}</h3>
              {db.interviewLists.length === 0 ? <p className="text-sm text-mute">{t('int.noLists')}</p> : (
                <ul className="space-y-3">
                  {db.interviewLists.map((l) => { const lc = db.candidates.find((x) => x.id === l.candidateId); return (
                    <li key={l.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{l.name}</p><p className="font-mono text-[11px] text-mute">{lc?.name ?? '—'} · {date(l.createdAt)} · {l.questions.length}</p></div>
                        <div className="no-print flex gap-0.5"><button className="rounded p-1.5 text-mute hover:bg-surface2" onClick={() => copy(l.questions.map((q) => q.text))} aria-label={t('int.copy')}><Copy size={14} /></button><button className="rounded p-1.5 text-mute hover:bg-surface2" onClick={() => window.print()} aria-label={t('common.print')}><Printer size={14} /></button><button className="rounded p-1.5 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => { actions.deleteInterviewList(l.id); toast(t('int.deleted')) }} aria-label={t('common.delete')}><Trash2 size={14} /></button></div></div>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-mute">{l.questions.map((q) => <li key={q.id}>{q.text}</li>)}</ol>
                    </li>) })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
