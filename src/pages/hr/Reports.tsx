import { useMemo, useState } from 'react'
import { Download, Printer, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import type { DecisionKey } from '../../lib/types'
import { Btn, Counter, Empty, PageHeader, ScoreBadge, Select } from '../../components/ui'
import { CandidateCell } from '../../components/common'
import { DECISION_COLOR, DecisionBadge, skillName, useRuleText } from '../../components/match'

export default function Reports() {
  const db = useDB()
  const { t, date } = useI18n()
  const toast = useToast()
  const ruleText = useRuleText()
  const [vid, setVid] = useState('')
  const [dec, setDec] = useState<DecisionKey | ''>('')
  const rows = useMemo(() => [...db.decisions].filter((d) => (!vid || d.vacancyId === vid) && (!dec || d.decision === dec)).sort((a, b) => b.date.localeCompare(a.date)), [db.decisions, vid, dec])

  const avg = rows.length ? rows.reduce((a, d) => a + d.score, 0) / rows.length : 0
  const dist = (['interview', 'assess', 'reserve', 'low'] as DecisionKey[]).map((k) => ({ k, name: t(`decision.${k}`), n: rows.filter((d) => d.decision === k).length }))
  const byVac = db.vacancies.map((v) => { const r = rows.filter((d) => d.vacancyId === v.id); return { name: v.title.length > 16 ? v.title.slice(0, 15) + '…' : v.title, avg: r.length ? Math.round(r.reduce((a, d) => a + d.score, 0) / r.length) : 0, n: r.length } }).filter((x) => x.n > 0)
  const byDate = useMemo(() => { const m = new Map<string, number[]>(); [...rows].reverse().forEach((d) => { const k = d.date.slice(0, 10); m.set(k, [...(m.get(k) ?? []), d.score]) }); return [...m.entries()].map(([k, v]) => ({ d: k.slice(5), avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length), n: v.length })) }, [rows])
  const constrained = rows.filter((d) => d.violations.length).length

  const exportCsv = () => {
    const head = ['date', 'candidate', 'vacancy', 'score', 'decision', 'base_decision', 'mandatory_violations', 'decided_by']
    const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`
    const lines = rows.map((d) => [d.date.slice(0, 10), db.candidates.find((c) => c.id === d.candidateId)?.name ?? '', db.vacancies.find((v) => v.id === d.vacancyId)?.title ?? '', d.score, d.decision, d.baseDecision, d.violations.map((s) => skillName(db.skills, s)).join('; '), d.by].map(esc).join(','))
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `skillora-decisions-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href)
    toast(t('rep.csvDone'))
  }
  const tip = { contentStyle: { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 } }

  return (
    <div className="print-area">
      <PageHeader eyebrow={t('nav.reports')} title={t('rep.title')} desc={t('rep.desc')} actions={<div className="no-print flex flex-wrap gap-2"><Btn variant="ghost" onClick={exportCsv} disabled={!rows.length}><Download size={15} />CSV</Btn><Btn onClick={() => window.print()}><Printer size={15} />{t('rep.print')}</Btn></div>} />
      <p className="mb-6 hidden font-mono text-xs print:block">Skillora · {new Date().toLocaleString()} · {vid ? db.vacancies.find((v) => v.id === vid)?.title : t('common.all')}</p>
      <p className="no-print mb-6 text-xs text-mute">{t('rep.pdfHint')}</p>

      <div className="no-print mb-6 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Select value={vid} onChange={(e) => setVid(e.target.value)} aria-label={t('nav.vacancies')}><option value="">{t('rep.allVacancies')}</option>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select>
        <Select value={dec} onChange={(e) => setDec(e.target.value as DecisionKey | '')} aria-label={t('rep.decision')}><option value="">{t('rep.allDecisions')}</option>{(['interview', 'assess', 'reserve', 'low'] as DecisionKey[]).map((k) => <option key={k} value={k}>{t(`decision.${k}`)}</option>)}</Select>
      </div>

      {rows.length === 0 ? <Empty title={t('rep.empty')} text={t('rep.emptyText')} /> : (
        <>
          <div className="mb-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[[rows.length, '', 'rep.stat.total'], [Math.round(avg), '%', 'rep.stat.avg'], [rows.filter((d) => d.decision === 'interview').length, '', 'rep.stat.interview'], [constrained, '', 'rep.stat.constrained']].map(([n, s, k]) => <div key={k as string} className="bg-surface px-5 py-5"><p className="font-display text-4xl font-bold"><Counter value={n as number} suffix={s as string} /></p><p className="eyebrow mt-1">{t(k as string)}</p></div>)}
          </div>
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <section className="card p-5"><h3 className="mb-3 font-display text-base font-bold">{t('rep.chart.dist')}</h3><div className="h-56"><ResponsiveContainer><BarChart data={dist} margin={{ left: -24 }}><CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} /><Tooltip {...tip} cursor={{ fill: 'rgb(var(--surface2))' }} /><Bar dataKey="n" radius={[6, 6, 0, 0]}>{dist.map((x) => <Cell key={x.k} fill={DECISION_COLOR[x.k]} />)}</Bar></BarChart></ResponsiveContainer></div></section>
            <section className="card p-5"><h3 className="mb-3 font-display text-base font-bold">{t('rep.chart.vac')}</h3><div className="h-56"><ResponsiveContainer><BarChart data={byVac} layout="vertical" margin={{ left: 10 }}><CartesianGrid horizontal={false} stroke="rgb(var(--line))" /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} /><Tooltip {...tip} cursor={{ fill: 'rgb(var(--surface2))' }} /><Bar dataKey="avg" fill="#747B50" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></section>
            <section className="card p-5"><h3 className="mb-3 font-display text-base font-bold">{t('rep.chart.time')}</h3><div className="h-56"><ResponsiveContainer><LineChart data={byDate} margin={{ left: -24, right: 8 }}><CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="d" tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} /><Tooltip {...tip} /><Line dataKey="avg" stroke="#82758F" strokeWidth={2.5} dot={{ r: 3.5, fill: '#D5E45A', stroke: '#20221F' }} /></LineChart></ResponsiveContainer></div></section>
          </div>

          <section className="card overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr><th className="th">{t('common.date')}</th><th className="th">{t('cand.name')}</th><th className="th">{t('nav.vacancies')}</th><th className="th">{t('match.overall')}</th><th className="th">{t('rep.decision')}</th><th className="th">{t('rep.reason')}</th><th className="th no-print" /></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((d) => { const c = db.candidates.find((x) => x.id === d.candidateId); const v = db.vacancies.find((x) => x.id === d.vacancyId); if (!c || !v) return null; return (
                  <tr key={d.id} className="align-top hover:bg-surface2/40">
                    <td className="td whitespace-nowrap font-mono text-xs text-mute">{date(d.date)}</td><td className="td"><CandidateCell c={c} /></td><td className="td text-sm text-mute">{v.title}</td><td className="td"><ScoreBadge value={d.score} /></td>
                    <td className="td"><DecisionBadge d={d.decision} size="sm" />{d.violations.length > 0 && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">⚠ {d.violations.map((s) => skillName(db.skills, s)).join(', ')}</p>}</td>
                    <td className="td max-w-[320px] text-xs text-mute"><ul className="space-y-0.5">{d.rules.map((r, i) => <li key={i}>• {ruleText(r)}</li>)}</ul></td>
                    <td className="td no-print"><button className="rounded-lg p-2 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => { actions.deleteDecision(d.id); toast(t('rep.deleted')) }} aria-label={t('common.delete')}><Trash2 size={15} /></button></td>
                  </tr>) })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
