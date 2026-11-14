import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useDB } from '../lib/store'
import { useI18n } from '../i18n'
import { computeMatch } from '../lib/matching'
import type { Candidate, DegreeKey } from '../lib/types'
import { CriteriaBars, DecisionBadge, skillName, useRuleText } from './match'
import { ScoreRing, Select } from './ui'

export default function MatchDemo() {
  const db = useDB()
  const { t } = useI18n()
  const ruleText = useRuleText()
  const active = db.vacancies.filter((v) => v.status === 'active').slice(0, 5)
  const [vid, setVid] = useState(active[0]?.id ?? '')
  const vacancy = db.vacancies.find((v) => v.id === vid) ?? active[0]
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [years, setYears] = useState(4)
  const [degree, setDegree] = useState<DegreeKey>('bachelor')

  const cand = useMemo<Candidate | null>(() => {
    if (!vacancy) return null
    const lv = (id: string, req: number) => levels[`${vacancy.id}:${id}`] ?? Math.max(0, req - 1)
    return {
      id: 'demo', name: 'Demo', email: '', phone: '', location: '', title: '', summary: '', hue: 70,
      skills: vacancy.requirements.map((r) => ({ skillId: r.skillId, level: lv(r.skillId, r.level) })).filter((s) => s.level > 0),
      experience: [{ id: 'x', role: vacancy.title, company: 'Demo', from: new Date().getFullYear() - years, to: null, description: '', skills: vacancy.requirements.map((r) => r.skillId) }],
      education: [{ id: 'e', degree, field: 'Computer Science', school: 'Demo', year: 2020 }],
      certificates: [], languages: vacancy.languages.map((l) => ({ lang: l.lang, level: Math.min(5, l.level) })), github: null, portfolio: '', createdAt: '',
    }
  }, [vacancy, levels, years, degree])

  const m = useMemo(() => (cand && vacancy ? computeMatch(cand, vacancy, db.skills, db.kb) : null), [cand, vacancy, db.skills, db.kb])
  if (!vacancy || !m || !cand) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
      <div className="card space-y-5 p-5 md:p-7">
        <div>
          <p className="eyebrow mb-2">{t('demo.vacancy')}</p>
          <div className="flex flex-wrap gap-2">
            {active.map((v) => (
              <button key={v.id} onClick={() => setVid(v.id)} className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${v.id === vid ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:bg-surface2'}`}>{v.title}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">{t('demo.candidate')}</p>
          <div className="space-y-3.5">
            {vacancy.requirements.map((r) => {
              const val = levels[`${vacancy.id}:${r.skillId}`] ?? Math.max(0, r.level - 1)
              return (
                <div key={r.skillId} className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-sm">
                  <span className="truncate font-medium">{skillName(db.skills, r.skillId)}{r.mandatory && <b className="text-red-500">*</b>}</span>
                  <input type="range" min={0} max={5} value={val} onChange={(e) => setLevels((p) => ({ ...p, [`${vacancy.id}:${r.skillId}`]: +e.target.value }))} className="accent-[rgb(var(--brand))]" aria-label={skillName(db.skills, r.skillId)} />
                  <span className="text-right font-mono text-xs text-mute">{val} / {r.level}</span>
                </div>
              )
            })}
            <div className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-sm">
              <span className="font-medium">{t('demo.years')}</span>
              <input type="range" min={0} max={12} value={years} onChange={(e) => setYears(+e.target.value)} className="accent-[rgb(var(--brand))]" aria-label={t('demo.years')} />
              <span className="text-right font-mono text-xs text-mute">{years} / {vacancy.minExperience}</span>
            </div>
            <div className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm">
              <span className="font-medium">{t('demo.degree')}</span>
              <Select value={degree} onChange={(e) => setDegree(e.target.value as DegreeKey)} aria-label={t('demo.degree')}>
                {(['highschool', 'college', 'bachelor', 'master', 'phd'] as DegreeKey[]).map((d) => <option key={d} value={d}>{t(`degree.${d}`)}</option>)}
              </Select>
            </div>
          </div>
          <p className="mt-4 text-xs text-mute">{t('demo.hint')}</p>
        </div>
      </div>

      <div className="card relative overflow-hidden p-5 md:p-7">
        <div className="flex items-center gap-5">
          <ScoreRing key={vacancy.id} value={m.total} size={116} stroke={10} label={t('match.overall')} />
          <div>
            <p className="eyebrow mb-1.5">{t('match.recommended')}</p>
            <AnimatePresence mode="wait"><motion.div key={m.decision} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><DecisionBadge d={m.decision} /></motion.div></AnimatePresence>
            {m.violations.length > 0 && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{t('demo.constraint', { n: m.violations.length })}</p>}
          </div>
        </div>
        <div className="mt-6"><CriteriaBars criteria={m.criteria} /></div>
        <div className="mt-6 space-y-1.5 border-t border-line pt-4 text-xs text-mute">
          {m.rules.map((r, i) => <p key={i}>→ {ruleText(r)}</p>)}
        </div>
        <Link to="/login" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">{t('demo.cta')}<ArrowUpRight size={15} /></Link>
      </div>
    </div>
  )
}
