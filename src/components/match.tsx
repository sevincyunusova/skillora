import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, Gavel, ArrowRight } from 'lucide-react'
import type { DecisionKey, MatchResult, RuleFired, Skill, CriterionResult } from '../lib/types'
import { useI18n } from '../i18n'
import { Bar, ScoreRing, Level } from './ui'

export const DECISION_STYLE: Record<DecisionKey, string> = {
  interview: 'bg-accent text-accent-ink',
  assess: 'bg-olive/30 text-ink',
  reserve: 'bg-violet/30 text-ink',
  low: 'bg-red-500/15 text-red-700 dark:text-red-300',
}
export const DECISION_COLOR: Record<DecisionKey, string> = {
  interview: '#D5E45A', assess: '#9DAA5A', reserve: '#82758F', low: '#B5705F',
}

export const skillName = (skills: Skill[], id: string) => skills.find((s) => s.id === id)?.name ?? id

export function DecisionBadge({ d, size = 'md' }: { d: DecisionKey; size?: 'sm' | 'md' }) {
  const { t } = useI18n()
  return <span className={`inline-flex items-center rounded-full font-semibold ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3.5 py-1 text-xs'} ${DECISION_STYLE[d]}`}>{t(`decision.${d}`)}</span>
}

export function useRuleText() {
  const { t } = useI18n()
  return (r: RuleFired) => {
    const k = `rule.${r.id}`
    return t(k, r.params as Record<string, string | number>)
  }
}

export function CriteriaBars({ criteria }: { criteria: CriterionResult[] }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3.5">
      {criteria.map((c, i) => (
        <motion.div key={c.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{t(`crit.${c.key}`)} <span className="font-mono text-[11px] text-mute">· {Math.round(c.weight * 100)}%</span></span>
            <span className="font-mono text-xs text-mute"><b className="text-ink">{Math.round(c.score)}</b>/100 → +{c.weighted.toFixed(1)}</span>
          </div>
          <Bar value={c.score} color={c.score >= 80 ? 'bg-accent' : c.score >= 60 ? 'bg-brand' : 'bg-violet'} />
        </motion.div>
      ))}
    </div>
  )
}

export function MatchSummary({ m, skills, compact = false }: { m: MatchResult; skills: Skill[]; compact?: boolean }) {
  const { t } = useI18n()
  const ruleText = useRuleText()
  const sn = (id: string) => skillName(skills, id)
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <ScoreRing value={m.total} size={compact ? 104 : 132} stroke={compact ? 9 : 11} label={t('match.overall')} />
        <div>
          <p className="eyebrow mb-1.5">{t('match.recommended')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <DecisionBadge d={m.decision} />
            {m.decision !== m.baseDecision && (
              <span className="inline-flex items-center gap-1 text-xs text-mute"><DecisionBadge d={m.baseDecision} size="sm" /><ArrowRight size={12} />{t('match.constraintApplied')}</span>
            )}
          </div>
          <p className="mt-2 text-sm text-mute">{t(`decision.${m.decision}.desc`)}</p>
        </div>
      </div>

      {m.violations.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" size={18} />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">{t('match.mandatoryTitle')}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-mute">
              {m.violations.map((v) => (
                <li key={v.skillId}><b className="text-ink">{sn(v.skillId)}</b>: {v.have === 0 ? t('match.notFound') : t('match.levelHave', { have: v.have })} / {t('match.levelNeed', { need: v.required })}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-3 font-display text-base font-bold">{t('match.byCriterion')}</h4>
        <CriteriaBars criteria={m.criteria} />
      </div>

      <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-3'}`}>
        <div className="rounded-2xl border border-line p-4">
          <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-olive" />{t('match.strengths')}</h5>
          {m.strengths.length || m.strongCriteria.length ? (
            <div className="flex flex-wrap gap-1.5">
              {m.strengths.map((s) => <span key={s.skillId} className="chip">{sn(s.skillId)} <Level value={s.level} /></span>)}
              {m.strongCriteria.map((c) => <span key={c} className="chip border-olive/50">{t(`crit.${c}`)}</span>)}
            </div>
          ) : <p className="text-sm text-mute">{t('match.none')}</p>}
        </div>
        <div className="rounded-2xl border border-line p-4">
          <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={16} className="text-red-500" />{t('match.missing')}</h5>
          {m.missing.length ? (
            <div className="flex flex-wrap gap-1.5">{m.missing.map((s) => <span key={s.skillId} className={`chip ${s.mandatory ? 'border-red-500/50' : ''}`}>{sn(s.skillId)}{s.mandatory && <b className="text-red-500">*</b>}</span>)}</div>
          ) : <p className="text-sm text-mute">{t('match.noMissing')}</p>}
        </div>
        <div className="rounded-2xl border border-line p-4">
          <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold"><TrendingUp size={16} className="text-violet" />{t('match.improve')}</h5>
          {m.improve.length || m.weakCriteria.length ? (
            <ul className="space-y-1.5 text-sm">
              {m.improve.map((s) => <li key={s.skillId} className="flex items-center justify-between gap-2"><span>{sn(s.skillId)}</span><span className="font-mono text-xs text-mute">{s.have} → {s.required}</span></li>)}
              {m.weakCriteria.map((c) => <li key={c} className="text-mute">{t(`crit.${c}`)} &lt; 60</li>)}
            </ul>
          ) : <p className="text-sm text-mute">{t('match.noImprove')}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface2/40 p-4">
        <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Gavel size={16} className="text-brand" />{t('match.whyTitle')}</h5>
        <ol className="space-y-2 text-sm">
          {m.rules.map((r, i) => (
            <li key={i} className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink font-mono text-[10px] text-bg">{i + 1}</span><span>{ruleText(r)}</span></li>
          ))}
        </ol>
      </div>
    </div>
  )
}
