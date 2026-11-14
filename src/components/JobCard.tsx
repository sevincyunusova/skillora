import { useState } from 'react'
import { Check, Send } from 'lucide-react'
import type { Candidate, Vacancy } from '../lib/types'
import { actions, useDB } from '../lib/store'
import { useI18n } from '../i18n'
import { useToast } from '../lib/toast'
import { computeMatch } from '../lib/matching'
import { Btn, Modal, ScoreBadge, ScoreRing, Tilt } from './ui'
import { CriteriaBars, skillName } from './match'
import { VacancyBody } from './VacancyParts'

export function JobCard({ v, me }: { v: Vacancy; me: Candidate }) {
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const m = computeMatch(me, v, db.skills, db.kb)
  const applied = db.applications.some((a) => a.candidateId === me.id && a.vacancyId === v.id)
  const apply = () => {
    if (!actions.apply(me.id, v.id)) { toast(t('jobs.already'), 'info'); return }
    toast(t('toast.applied', { title: v.title }))
  }
  return (
    <>
      <Tilt max={3}>
        <article className="card flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="eyebrow mb-1">{v.company} · {v.location}</p><h3 className="font-display text-lg font-bold leading-snug">{v.title}</h3></div>
            <ScoreBadge value={m.total} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-mute">{v.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5"><span className="chip">{t(`jobtype.${v.type}`)}</span><span className="chip">{t(`senior.${v.seniority}`)}</span>{v.salary && <span className="chip">{v.salary}</span>}</div>
          <div className="mt-auto flex gap-2 pt-5"><Btn variant="ghost" size="sm" onClick={() => setOpen(true)}>{t('common.details')}</Btn>
            {applied ? <span className="inline-flex items-center gap-1.5 rounded-full bg-olive/20 px-3.5 py-1.5 text-xs font-semibold"><Check size={14} />{t('jobs.applied')}</span> : <Btn size="sm" onClick={apply}><Send size={13} />{t('jobs.apply')}</Btn>}</div>
        </article>
      </Tilt>
      <Modal open={open} wide onClose={() => setOpen(false)} title={v.title} footer={applied ? <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><Check size={15} />{t('jobs.applied')}</span> : <Btn onClick={() => { apply(); setOpen(false) }}><Send size={14} />{t('jobs.apply')}</Btn>}>
        <div className="space-y-6">
          <VacancyBody v={v} />
          <div className="rounded-2xl border border-line bg-surface2/40 p-5">
            <div className="mb-4 flex items-center gap-4"><ScoreRing value={m.total} size={84} stroke={8} /><div><p className="font-display text-lg font-bold">{t('jobs.yourFit')}</p><p className="text-xs text-mute">{t('jobs.fitNote')}</p></div></div>
            <CriteriaBars criteria={m.criteria} />
            {(m.missing.length > 0 || m.improve.length > 0) && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {m.missing.length > 0 && <div><p className="eyebrow mb-1.5">{t('match.missing')}</p><div className="flex flex-wrap gap-1.5">{m.missing.map((g) => <span key={g.skillId} className="chip border-red-500/40">{skillName(db.skills, g.skillId)}</span>)}</div></div>}
                {m.improve.length > 0 && <div><p className="eyebrow mb-1.5">{t('match.improve')}</p><div className="flex flex-wrap gap-1.5">{m.improve.map((g) => <span key={g.skillId} className="chip border-violet/50">{skillName(db.skills, g.skillId)} {g.have}→{g.required}</span>)}</div></div>}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
