import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Plus, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { candidateYears, computeMatch } from '../../lib/matching'
import { Empty, Field, PageHeader, ScoreRing, Select } from '../../components/ui'
import { CandidateCell } from '../../components/common'
import { DecisionBadge, skillName } from '../../components/match'
import { DEGREES } from '../../components/CandidateEditor'

const COLORS = ['#747B50', '#82758F', '#C2D12E']

export default function Compare() {
  const db = useDB()
  const { t } = useI18n()
  const [sp] = useSearchParams()
  const [vid, setVid] = useState(db.vacancies.find((v) => v.status === 'active')?.id ?? db.vacancies[0]?.id ?? '')
  const [ids, setIds] = useState<string[]>(() => { const c = sp.get('c'); const base = c ? [c] : []; for (const x of ['c9', 'c2', 'c14']) if (base.length < 2 && !base.includes(x) && db.candidates.some((y) => y.id === x)) base.push(x); return base.slice(0, 3) })
  const [pick, setPick] = useState('')
  const vacancy = db.vacancies.find((v) => v.id === vid)

  const matches = useMemo(() => (vacancy ? ids.map((id) => db.candidates.find((c) => c.id === id)).filter(Boolean).map((c) => ({ c: c!, m: computeMatch(c!, vacancy, db.skills, db.kb) })) : []), [ids, vacancy, db])
  const best = matches.length ? matches.reduce((a, b) => (b.m.total > a.m.total ? b : a)) : null
  const free = db.candidates.filter((c) => !ids.includes(c.id))
  const rank = (c: typeof db.candidates[0]) => Math.max(-1, ...c.education.map((e) => DEGREES.indexOf(e.degree)))

  if (!vacancy) return <Empty title={t('common.noData')} />
  const radar = ['technical', 'experience', 'education', 'soft', 'certs', 'languages'].map((k) => {
    const row: Record<string, string | number> = { k: t(`crit.${k}`) }
    matches.forEach(({ c, m }) => { row[c.name] = m.criteria.find((x) => x.key === k)!.score })
    return row
  })

  return (
    <div>
      <PageHeader eyebrow={t('nav.compare')} title={t('cmp.title')} desc={t('cmp.desc')} />
      <div className="card mb-6 grid gap-4 p-5 md:grid-cols-[1fr_1.3fr] md:items-end">
        <Field label={t('nav.vacancies')}><Select value={vid} onChange={(e) => setVid(e.target.value)}>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select></Field>
        <div>
          <p className="label">{t('cmp.selected', { n: ids.length })}</p>
          <div className="flex flex-wrap items-center gap-2">
            {ids.map((id) => { const c = db.candidates.find((x) => x.id === id); return c && <span key={id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface2/50 py-1 pl-3 pr-1.5 text-sm">{c.name}<button onClick={() => setIds(ids.filter((x) => x !== id))} className="rounded-full p-1 text-mute hover:text-red-600" aria-label={t('common.delete')}><X size={13} /></button></span> })}
            {ids.length < 3 && (
              <span className="inline-flex items-center gap-1">
                <Select value={pick} onChange={(e) => { if (e.target.value) { setIds([...ids, e.target.value]); setPick('') } }} className="!w-48 !py-1.5" aria-label={t('cmp.add')}><option value="">+ {t('cmp.add')}</option>{free.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              </span>
            )}
          </div>
        </div>
      </div>

      {matches.length < 2 ? <Empty title={t('cmp.pickTwo')} text={t('cmp.pickTwoText')} action={<Plus className="text-brand" />} /> : (
        <div className="space-y-6">
          <div className={`grid gap-4 ${matches.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {matches.map(({ c, m }, i) => {
              const isBest = best?.c.id === c.id
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`card relative overflow-hidden p-5 ${isBest ? 'border-accent ring-2 ring-accent/60' : ''}`}>
                  {isBest && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-ink"><Crown size={12} />{t('cmp.best')}</span>}
                  <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: COLORS[i] }} />
                  <CandidateCell c={c} />
                  <div className="mt-5 flex items-center gap-4"><ScoreRing value={m.total} size={92} stroke={8} /><div className="space-y-2"><DecisionBadge d={m.decision} />{m.violations.length > 0 && <p className="text-xs text-red-600 dark:text-red-400">⚠ {t('cmp.mandatoryGaps', { n: m.violations.length })}</p>}</div></div>
                </motion.div>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card p-5"><h3 className="mb-2 font-display text-lg font-bold">{t('match.profile')}</h3>
              <div className="h-80"><ResponsiveContainer><RadarChart data={radar} outerRadius="70%"><PolarGrid stroke="rgb(var(--line))" /><PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: 'rgb(var(--mute))' }} />
                {matches.map(({ c }, i) => <Radar key={c.id} name={c.name} dataKey={c.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.18} strokeWidth={2} />)}
                <Legend wrapperStyle={{ fontSize: 12 }} /><Tooltip contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} /></RadarChart></ResponsiveContainer></div></section>
            <section className="card p-5"><h3 className="mb-2 font-display text-lg font-bold">{t('cmp.byCriterion')}</h3>
              <div className="h-80"><ResponsiveContainer><BarChart data={radar} margin={{ left: -18 }}><CartesianGrid vertical={false} stroke="rgb(var(--line))" /><XAxis dataKey="k" tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} interval={0} /><YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--mute))' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgb(var(--surface2))' }} contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 }} />
                {matches.map(({ c }, i) => <Bar key={c.id} dataKey={c.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer></div></section>
          </div>

          <section className="card overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr><th className="th">{t('cmp.skillReq')}</th>{matches.map(({ c }, i) => <th key={c.id} className="th"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{c.name.split(' ')[0]}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {vacancy.requirements.map((r) => (
                  <tr key={r.skillId}><td className="td font-medium">{skillName(db.skills, r.skillId)}{r.mandatory && <b className="text-red-500">*</b>}<span className="ml-2 font-mono text-xs text-mute">≥{r.level}</span></td>
                    {matches.map(({ c }) => { const l = c.skills.find((s) => s.skillId === r.skillId)?.level ?? 0; const ok = l >= r.level; return <td key={c.id} className="td"><span className={`inline-flex min-w-[2.2rem] justify-center rounded-md px-2 py-1 font-mono text-xs ${l === 0 ? 'bg-red-500/15 text-red-700 dark:text-red-300' : ok ? 'bg-accent/70 text-accent-ink' : 'bg-violet/25'}`}>{l || '—'}</span></td> })}</tr>
                ))}
                <tr className="bg-surface2/40"><td className="td font-semibold">{t('cand.experience')}</td>{matches.map(({ c }) => <td key={c.id} className="td">{candidateYears(c)} {t('cand.yrs')} <span className="text-xs text-mute">(≥{vacancy.minExperience})</span></td>)}</tr>
                <tr><td className="td font-semibold">{t('cand.education')}</td>{matches.map(({ c }) => { const e = [...c.education].sort((a, b) => DEGREES.indexOf(b.degree) - DEGREES.indexOf(a.degree))[0]; return <td key={c.id} className="td text-sm">{e ? `${t(`degree.${e.degree}`)}` : '—'}<span className="block text-xs text-mute">{e?.field}{rank(c) >= DEGREES.indexOf(vacancy.minEducation) ? ' ✓' : ''}</span></td> })}</tr>
                <tr className="bg-surface2/40"><td className="td font-semibold">{t('cand.certs')}</td>{matches.map(({ c }) => <td key={c.id} className="td text-sm">{c.certificates.length ? c.certificates.map((x) => x.name).join(', ') : '—'}</td>)}</tr>
                <tr><td className="td font-semibold">{t('match.strengths')}</td>{matches.map(({ m }) => <td key={m.candidateId} className="td align-top"><div className="flex flex-wrap gap-1">{m.strengths.slice(0, 5).map((s) => <span key={s.skillId} className="chip !py-0 text-[11px]">{skillName(db.skills, s.skillId)}</span>)}{!m.strengths.length && '—'}</div></td>)}</tr>
                <tr className="bg-surface2/40"><td className="td font-semibold">{t('match.missing')} / {t('match.improve')}</td>{matches.map(({ m }) => <td key={m.candidateId} className="td align-top"><div className="flex flex-wrap gap-1">{[...m.missing, ...m.improve].slice(0, 6).map((s) => <span key={s.skillId} className={`chip !py-0 text-[11px] ${s.have === 0 ? 'border-red-500/40' : 'border-violet/50'}`}>{skillName(db.skills, s.skillId)}</span>)}{!m.missing.length && !m.improve.length && '—'}</div></td>)}</tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}
