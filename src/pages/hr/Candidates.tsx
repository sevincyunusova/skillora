import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Eye, SlidersHorizontal } from 'lucide-react'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { candidateYears, computeMatch } from '../../lib/matching'
import type { Candidate, DegreeKey } from '../../lib/types'
import { Btn, ConfirmModal, Empty, Modal, PageHeader, ScoreBadge, SearchBox, Select, Field, Input } from '../../components/ui'
import { CandidateCell, SkillChips } from '../../components/common'
import { CandidateEditor, DEGREES, emptyCandidate, validateCandidate, type Errors } from '../../components/CandidateEditor'
import { skillName } from '../../components/match'

export function CandidateFormModal({ initial, onClose }: { initial: Candidate | null; onClose: () => void }) {
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const isNew = initial ? !db.candidates.some((c) => c.id === initial.id) : true
  const [val, setVal] = useState<Candidate>(initial ?? emptyCandidate())
  const [errors, setErrors] = useState<Errors>({})
  const save = () => {
    const e = validateCandidate(val, t, db.candidates)
    setErrors(e)
    if (Object.keys(e).length) { toast(t('toast.fixErrors'), 'error'); return }
    actions.saveCandidate(val)
    toast(isNew ? t('toast.candAdded') : t('toast.candSaved'))
    onClose()
  }
  return (
    <Modal open wide onClose={onClose} title={isNew ? t('cand.add') : t('cand.edit')} footer={<><Btn variant="ghost" onClick={onClose}>{t('common.cancel')}</Btn><Btn onClick={save}>{t('common.save')}</Btn></>}>
      <CandidateEditor value={val} onChange={setVal} skills={db.skills} errors={errors} />
    </Modal>
  )
}

export default function Candidates() {
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const active = db.vacancies.filter((v) => v.status === 'active')
  const [q, setQ] = useState('')
  const [skill, setSkill] = useState('')
  const [minExp, setMinExp] = useState(0)
  const [edu, setEdu] = useState<DegreeKey | ''>('')
  const [sort, setSort] = useState<'match' | 'name' | 'exp'>('match')
  const [vid, setVid] = useState(active[0]?.id ?? '')
  const [showF, setShowF] = useState(false)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [adding, setAdding] = useState(false)
  const [del, setDel] = useState<Candidate | null>(null)
  const sn = (id: string) => skillName(db.skills, id)
  const vac = db.vacancies.find((v) => v.id === vid)
  const rank = Object.fromEntries(DEGREES.map((d, i) => [d, i]))

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return db.candidates
      .map((c) => ({ c, years: candidateYears(c), score: vac ? computeMatch(c, vac, db.skills, db.kb).total : 0 }))
      .filter(({ c, years }) => {
        if (ql && !(`${c.name} ${c.title} ${c.location} ${c.skills.map((s) => sn(s.skillId)).join(' ')}`.toLowerCase().includes(ql))) return false
        if (skill && !c.skills.some((s) => s.skillId === skill)) return false
        if (years < minExp) return false
        if (edu && !c.education.some((e) => rank[e.degree] >= rank[edu])) return false
        return true
      })
      .sort((a, b) => (sort === 'match' ? b.score - a.score : sort === 'exp' ? b.years - a.years : a.c.name.localeCompare(b.c.name)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, q, skill, minExp, edu, sort, vac])

  return (
    <div>
      <PageHeader eyebrow={t('nav.candidates')} title={t('cand.title')} desc={t('cand.desc')} actions={<Btn onClick={() => setAdding(true)}><Plus size={16} />{t('cand.add')}</Btn>} />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <SearchBox value={q} onChange={setQ} placeholder={t('cand.search')} />
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label={t('common.sort')} className="md:w-48">
          <option value="match">{t('sort.match')}</option><option value="name">{t('sort.name')}</option><option value="exp">{t('sort.exp')}</option>
        </Select>
        <Btn variant="ghost" onClick={() => setShowF((s) => !s)} aria-expanded={showF}><SlidersHorizontal size={15} />{t('common.filters')}</Btn>
      </div>
      <AnimatePresence initial={false}>
        {showF && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card mb-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t('cand.scoreFor')}><Select value={vid} onChange={(e) => setVid(e.target.value)}>{db.vacancies.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</Select></Field>
              <Field label={t('cand.skillFilter')}><Select value={skill} onChange={(e) => setSkill(e.target.value)}><option value="">{t('common.all')}</option>{db.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
              <Field label={t('cand.minExp')}><Input type="number" min={0} value={minExp} onChange={(e) => setMinExp(Math.max(0, +e.target.value))} /></Field>
              <Field label={t('cand.minEdu')}><Select value={edu} onChange={(e) => setEdu(e.target.value as DegreeKey | '')}><option value="">{t('common.all')}</option>{DEGREES.map((d) => <option key={d} value={d}>{t(`degree.${d}`)}</option>)}</Select></Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-3 font-mono text-xs text-mute">{t('common.results', { n: rows.length })}{vac && <> · {t('cand.scoreFor')}: <b className="text-ink">{vac.title}</b></>}</p>

      {rows.length === 0 ? <Empty title={t('common.noResults')} text={t('common.tryOther')} /> : (
        <div className="card divide-y divide-line overflow-hidden">
          <AnimatePresence initial={false}>
            {rows.map(({ c, years, score }) => {
              const bestEdu = [...c.education].sort((a, b) => rank[b.degree] - rank[a.degree])[0]
              return (
                <motion.div layout key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid items-center gap-3 px-4 py-4 transition-colors hover:bg-surface2/40 md:grid-cols-[minmax(200px,1.1fr)_1.4fr_1fr_auto_auto] md:px-5">
                  <CandidateCell c={c} />
                  <SkillChips skills={c.skills} names={sn} />
                  <div className="text-xs text-mute"><p><b className="text-ink">{years}</b> {t('cand.yrs')} · {c.location}</p><p className="truncate">{bestEdu ? `${t(`degree.${bestEdu.degree}`)}, ${bestEdu.field}` : '—'}</p></div>
                  <ScoreBadge value={score} />
                  <div className="flex gap-1">
                    <Link to={`/app/candidates/${c.id}`} className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" aria-label={t('common.view')}><Eye size={16} /></Link>
                    <button className="rounded-lg p-2 text-mute hover:bg-surface2 hover:text-ink" onClick={() => setEditing(c)} aria-label={t('common.edit')}><Pencil size={16} /></button>
                    <button className="rounded-lg p-2 text-mute hover:bg-red-500/10 hover:text-red-600" onClick={() => setDel(c)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {adding && <CandidateFormModal initial={null} onClose={() => setAdding(false)} />}
      {editing && <CandidateFormModal initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title={t('cand.delete')} text={t('cand.deleteText', { name: del?.name ?? '' })} onConfirm={() => { if (del) { actions.deleteCandidate(del.id); toast(t('toast.candDeleted')) } }} />
    </div>
  )
}
