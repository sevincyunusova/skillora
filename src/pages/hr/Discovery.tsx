import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompare, RotateCcw } from 'lucide-react'
import { useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { candidateYears, computeMatch } from '../../lib/matching'
import type { DegreeKey, LangCode } from '../../lib/types'
import { Btn, Empty, Field, Input, PageHeader, ScoreBadge, Select, Tilt } from '../../components/ui'
import { CandidateCell, SkillChips } from '../../components/common'
import { DEGREES, LANGS } from '../../components/CandidateEditor'
import { DecisionBadge, skillName } from '../../components/match'

export default function Discovery() {
  const db = useDB()
  const { t } = useI18n()
  const [skills, setSkills] = useState<string[]>([])
  const [mode, setMode] = useState<'all' | 'any'>('all')
  const [minLevel, setMinLevel] = useState(3)
  const [years, setYears] = useState(0)
  const [edu, setEdu] = useState<DegreeKey | ''>('')
  const [loc, setLoc] = useState('')
  const [lang, setLang] = useState<LangCode | ''>('')
  const [cert, setCert] = useState(false)
  const [vid, setVid] = useState('')
  const [sort, setSort] = useState<'score' | 'exp'>('score')
  const vac = db.vacancies.find((v) => v.id === vid)
  const sn = (id: string) => skillName(db.skills, id)
  const locs = [...new Set(db.candidates.map((c) => c.location).filter(Boolean))]
  const reset = () => { setSkills([]); setYears(0); setEdu(''); setLoc(''); setLang(''); setCert(false); setVid(''); setMinLevel(3); setMode('all') }
  const groups = (['technical', 'tools', 'domain', 'soft'] as const)

  const rows = useMemo(() => {
    return db.candidates.map((c) => {
      const y = candidateYears(c)
      const lv = (id: string) => c.skills.find((s) => s.skillId === id)?.level ?? 0
      const hit = skills.filter((s) => lv(s) >= minLevel)
      const cover = skills.length ? skills.reduce((a, s) => a + Math.min(1, lv(s) / Math.max(1, minLevel)), 0) / skills.length * 100 : 0
      const m = vac ? computeMatch(c, vac, db.skills, db.kb) : null
      return { c, y, hit, score: m ? m.total : cover, m }
    }).filter(({ c, y, hit }) => {
      if (skills.length && (mode === 'all' ? hit.length !== skills.length : hit.length === 0)) return false
      if (y < years) return false
      if (edu && !c.education.some((e) => DEGREES.indexOf(e.degree) >= DEGREES.indexOf(edu))) return false
      if (loc && c.location !== loc) return false
      if (lang && !c.languages.some((l) => l.lang === lang && l.level >= 4)) return false
      if (cert && !c.certificates.length) return false
      return true
    }).sort((a, b) => (sort === 'score' ? b.score - a.score : b.y - a.y))
  }, [db, skills, mode, minLevel, years, edu, loc, lang, cert, vac, sort])

  return (
    <div>
      <PageHeader eyebrow={t('nav.discovery')} title={t('disc.title')} desc={t('disc.desc')} actions={<Btn variant="ghost" onClick={reset}><RotateCcw size={15} />{t('common.reset')}</Btn>} />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="card space-y-5 self-start p-5 xl:sticky xl:top-8">
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="label !mb-0">{t('disc.skills')}</p>
              <div className="inline-flex rounded-full border border-line p-0.5 text-[11px]">{(['all', 'any'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-full px-2.5 py-0.5 font-medium ${mode === m ? 'bg-ink text-bg' : 'text-mute'}`}>{t(`disc.mode.${m}`)}</button>)}</div></div>
            <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {groups.map((g) => <div key={g}><p className="eyebrow mb-1 !text-[10px]">{t(`cat.${g}`)}</p><div className="flex flex-wrap gap-1.5">{db.skills.filter((s) => s.category === g).map((s) => { const on = skills.includes(s.id); return <button key={s.id} onClick={() => setSkills(on ? skills.filter((x) => x !== s.id) : [...skills, s.id])} aria-pressed={on} className={`chip transition-colors ${on ? '!border-accent !bg-accent !text-accent-ink' : 'hover:bg-surface2'}`}>{s.name}</button> })}</div></div>)}
            </div>
            <div className="mt-3"><label className="label">{t('disc.minLevel')}: <b className="text-ink">{minLevel}</b> — {t(`lvl.${minLevel}`)}</label><input type="range" min={1} max={5} value={minLevel} onChange={(e) => setMinLevel(+e.target.value)} className="w-full accent-[rgb(var(--brand))]" /></div>
          </div>
          <Field label={t('disc.years')}><Input type="number" min={0} value={years} onChange={(e) => setYears(Math.max(0, +e.target.value))} /></Field>
          <Field label={t('cand.minEdu')}><Select value={edu} onChange={(e) => setEdu(e.target.value as DegreeKey | '')}><option value="">{t('common.all')}</option>{DEGREES.map((d) => <option key={d} value={d}>{t(`degree.${d}`)}</option>)}</Select></Field>
          <Field label={t('cand.location')}><Select value={loc} onChange={(e) => setLoc(e.target.value)}><option value="">{t('common.all')}</option>{locs.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field>
          <Field label={t('disc.language')}><Select value={lang} onChange={(e) => setLang(e.target.value as LangCode | '')}><option value="">{t('common.all')}</option>{LANGS.map((l) => <option key={l} value={l}>{t(`language.${l}`)} ≥ {t('langlvl.4')}</option>)}</Select></Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} className="accent-[rgb(var(--brand))]" />{t('disc.hasCert')}</label>
          <Field label={t('disc.rankBy')} hint={t('disc.rankHint')}><Select value={vid} onChange={(e) => setVid(e.target.value)}><option value="">{t('disc.bySkills')}</option>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select></Field>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-mute">{t('common.results', { n: rows.length })}</p>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="!w-auto" aria-label={t('common.sort')}><option value="score">{t('disc.sort.score')}</option><option value="exp">{t('sort.exp')}</option></Select>
          </div>
          {rows.length === 0 ? <Empty title={t('common.noResults')} text={t('disc.noneText')} /> : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {rows.map(({ c, y, score, m, hit }) => (
                  <motion.div layout key={c.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <Tilt max={3}><div className="card h-full space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3"><CandidateCell c={c} />{(vac || skills.length > 0) ? <ScoreBadge value={score} /> : <span className="font-mono text-xs text-mute">{y} {t('cand.yrs')}</span>}</div>
                      <SkillChips skills={c.skills} names={sn} max={6} />
                      {skills.length > 0 && <p className="text-xs text-mute">{t('disc.matched', { a: hit.length, b: skills.length })}: {hit.map(sn).join(', ') || '—'}</p>}
                      <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-mute"><span>{y} {t('cand.yrs')} · {c.location}</span>{m && <DecisionBadge d={m.decision} size="sm" />}<Link to={`/app/compare?c=${c.id}`} className="inline-flex items-center gap-1 hover:text-ink"><GitCompare size={13} />{t('nav.compare')}</Link></div>
                    </div></Tilt>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
