import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Play, Save, RotateCcw, MessagesSquare } from 'lucide-react'
import { actions, toRecord, useAuth, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { runPipeline, STAGES, type PipeLog, type StageId } from '../../lib/pipeline'
import type { MatchResult } from '../../lib/types'
import { Btn, Field, Modal, PageHeader, ScoreBadge, ScoreRing, Select } from '../../components/ui'
import { CandidateCell } from '../../components/common'
import { DecisionBadge, MatchSummary } from '../../components/match'
import { RadarChart, PolarAngleAxis, PolarGrid, Radar, ResponsiveContainer } from 'recharts'

type Status = 'idle' | 'running' | 'done'

export default function Matching() {
  const db = useDB()
  const user = useAuth()!
  const { t } = useI18n()
  const toast = useToast()
  const [sp] = useSearchParams()
  const [vid, setVid] = useState(sp.get('v') || db.vacancies.find((v) => v.status === 'active')?.id || db.vacancies[0]?.id || '')
  const [cid, setCid] = useState(sp.get('c') || 'all')
  const [status, setStatus] = useState<Status>('idle')
  const [stage, setStage] = useState<StageId | null>(null)
  const [stageState, setStageState] = useState<Record<StageId, { status: 'pending' | 'running' | 'done'; progress: number }>>({ retrieval: { status: 'pending', progress: 0 }, evaluation: { status: 'pending', progress: 0 }, rules: { status: 'pending', progress: 0 }, decision: { status: 'pending', progress: 0 } })
  const [logs, setLogs] = useState<PipeLog[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [open, setOpen] = useState<MatchResult | null>(null)
  const runId = useRef(0)
  const logEnd = useRef<HTMLDivElement>(null)
  const vacancy = db.vacancies.find((v) => v.id === vid)

  useEffect(() => { logEnd.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [logs])
  useEffect(() => () => { runId.current++ }, [])

  const reset = () => {
    runId.current++
    setStatus('idle'); setStage(null); setLogs([]); setResults([])
    setStageState({ retrieval: { status: 'pending', progress: 0 }, evaluation: { status: 'pending', progress: 0 }, rules: { status: 'pending', progress: 0 }, decision: { status: 'pending', progress: 0 } })
  }
  useEffect(reset, [vid, cid]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async () => {
    if (!vacancy) return
    const cands = cid === 'all' ? db.candidates : db.candidates.filter((c) => c.id === cid)
    if (!cands.length) return
    const my = ++runId.current
    setStatus('running'); setLogs([]); setResults([])
    setStageState({ retrieval: { status: 'pending', progress: 0 }, evaluation: { status: 'pending', progress: 0 }, rules: { status: 'pending', progress: 0 }, decision: { status: 'pending', progress: 0 } })
    const res = await runPipeline(cands, vacancy, db.skills, db.kb, (e) => {
      if (my !== runId.current) return
      setStage(e.stage)
      setStageState((s) => ({ ...s, [e.stage]: { status: e.status === 'done' ? 'done' : 'running', progress: e.status === 'done' ? 1 : Math.max(s[e.stage].progress, e.progress) } }))
      if (e.log) setLogs((l) => [...l, e.log!])
    }, 1, () => my !== runId.current)
    if (my !== runId.current) return
    setResults(res); setStatus('done')
  }

  const saveOne = (m: MatchResult) => { actions.saveDecision(toRecord(m, user.name)); toast(t('toast.decisionSaved')) }
  const saveAll = () => { results.forEach((m) => actions.saveDecision(toRecord(m, user.name))); toast(t('match.savedAll', { n: results.length })) }

  const fmtLog = (l: PipeLog) => {
    const vars: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(l.vars)) vars[k] = typeof v === 'string' && (v.startsWith('crit.') || v.startsWith('decision.')) ? t(v) : v
    return t(l.key, vars)
  }

  return (
    <div>
      <PageHeader eyebrow={t('nav.matching')} title={t('match.title')} desc={t('match.desc')} />

      <div className="card mb-6 grid items-end gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
        <Field label={t('nav.vacancies')}><Select value={vid} onChange={(e) => setVid(e.target.value)} disabled={status === 'running'}>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title} — {v.company}{v.status === 'closed' ? ` (${t('vac.closed')})` : ''}</option>)}</Select></Field>
        <Field label={t('nav.candidates')}><Select value={cid} onChange={(e) => setCid(e.target.value)} disabled={status === 'running'}><option value="all">{t('match.allCandidates', { n: db.candidates.length })}</option>{db.candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <div className="flex gap-2">
          <Btn onClick={run} disabled={status === 'running' || !vacancy}>{status === 'running' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}{t(status === 'done' ? 'match.rerun' : 'match.start')}</Btn>
          {status !== 'idle' && <Btn variant="ghost" onClick={reset} aria-label={t('common.reset')}><RotateCcw size={15} /></Btn>}
        </div>
      </div>

      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-[320px_1fr]">
            <ol className="bg-surface p-5">
              {STAGES.map((s, i) => {
                const st = stageState[s]
                return (
                  <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < STAGES.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line"><motion.span className="absolute inset-x-0 top-0 bg-brand" animate={{ height: st.status === 'done' ? '100%' : `${st.progress * 100}%` }} /></span>}
                    <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-mono transition-colors ${st.status === 'done' ? 'border-accent bg-accent text-accent-ink' : st.status === 'running' ? 'border-brand bg-surface' : 'border-line bg-surface text-mute'}`}>
                      {st.status === 'done' ? <Check size={15} /> : st.status === 'running' ? <span className="stage-dot h-2.5 w-2.5 rounded-full bg-brand" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-1"><p className={`text-sm font-semibold ${st.status === 'pending' ? 'text-mute' : ''}`}>{t(`stage.${s}`)}</p><p className="text-xs text-mute">{t(`stage.${s}.desc`)}</p></div>
                  </li>
                )
              })}
            </ol>
            <div className="min-h-[260px] bg-ink p-5 font-mono text-[12.5px] leading-relaxed text-bg/85">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-bg/50"><span>skillora.engine ▸ {stage ? t(`stage.${stage}`) : '…'}</span><span>{status === 'running' ? t('match.running') : t('match.complete')}</span></div>
              <div ref={logEnd} className="max-h-[300px] space-y-1 overflow-y-auto pr-2">
                {logs.map((l, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}><span className="text-accent">[{String(STAGES.indexOf(l.stage) + 1).padStart(2, '0')}]</span> {fmtLog(l)}</motion.p>
                ))}
                {status === 'running' && <span className="inline-block h-3.5 w-2 animate-pulse bg-accent align-middle" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'done' && results.length === 1 && vacancy && (() => {
        const m = results[0]
        const c = db.candidates.find((x) => x.id === m.candidateId)!
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="card p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><CandidateCell c={c} sub={vacancy.title} /><div className="flex gap-2"><Link to={`/app/interview?c=${c.id}&v=${vacancy.id}`} className="btn btn-ghost btn-sm"><MessagesSquare size={14} />{t('nav.interview')}</Link><Btn size="sm" onClick={() => saveOne(m)}><Save size={14} />{t('match.saveDecision')}</Btn></div></div>
              <MatchSummary m={m} skills={db.skills} />
            </section>
            <section className="card p-6"><h3 className="mb-2 font-display text-lg font-bold">{t('match.profile')}</h3>
              <div className="h-72"><ResponsiveContainer><RadarChart data={m.criteria.map((x) => ({ k: t(`crit.${x.key}`), v: x.score }))} outerRadius="72%"><PolarGrid stroke="rgb(var(--line))" /><PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: 'rgb(var(--mute))' }} /><Radar dataKey="v" stroke="#747B50" fill="#D5E45A" fillOpacity={0.5} /></RadarChart></ResponsiveContainer></div></section>
          </motion.div>
        )
      })()}

      {status === 'done' && results.length > 1 && vacancy && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><h2 className="font-display text-lg font-bold">{t('match.ranking')} — {vacancy.title}</h2><Btn size="sm" onClick={saveAll}><Save size={14} />{t('match.saveAll')}</Btn></header>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
            <thead><tr><th className="th w-10">#</th><th className="th">{t('cand.name')}</th><th className="th">{t('match.overall')}</th><th className="th">{t('match.recommended')}</th><th className="th">{t('match.mandatoryShort')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-line">
              {results.map((m, i) => { const c = db.candidates.find((x) => x.id === m.candidateId)!; return (
                <motion.tr key={m.candidateId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="hover:bg-surface2/40">
                  <td className="td font-mono text-xs text-mute">{i + 1}</td><td className="td"><CandidateCell c={c} /></td><td className="td"><ScoreBadge value={m.total} /></td>
                  <td className="td"><DecisionBadge d={m.decision} size="sm" /></td>
                  <td className="td text-xs">{m.violations.length ? <span className="text-red-600 dark:text-red-400">⚠ {m.violations.length}</span> : <span className="text-olive">✓</span>}</td>
                  <td className="td text-right"><Btn variant="ghost" size="sm" onClick={() => setOpen(m)}>{t('match.details')}</Btn></td>
                </motion.tr>) })}
            </tbody></table></div>
        </motion.section>
      )}

      <Modal open={!!open} wide onClose={() => setOpen(null)} title={open ? db.candidates.find((c) => c.id === open.candidateId)?.name ?? '' : ''} footer={open && <Btn onClick={() => { saveOne(open); setOpen(null) }}><Save size={14} />{t('match.saveDecision')}</Btn>}>
        {open && <MatchSummary m={open} skills={db.skills} />}
      </Modal>
      {status === 'idle' && (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line p-12 text-center"><ScoreRing value={0} size={84} /><p className="mt-4 max-w-md text-sm text-mute">{t('match.idle')}</p></div>
      )}
    </div>
  )
}
