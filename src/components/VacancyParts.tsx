import { Banknote, Building2, Clock, MapPin, GraduationCap, Award, Languages } from 'lucide-react'
import type { Vacancy } from '../lib/types'
import { useDB } from '../lib/store'
import { useI18n } from '../i18n'
import { Level } from './ui'
import { skillName } from './match'

export function VacancyBody({ v }: { v: Vacancy }) {
  const db = useDB()
  const { t } = useI18n()
  const sn = (id: string) => skillName(db.skills, id)
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
        <span className="inline-flex items-center gap-1.5"><Building2 size={14} />{v.company}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{v.location}</span>
        <span className="inline-flex items-center gap-1.5"><Clock size={14} />{t(`jobtype.${v.type}`)} · {t(`senior.${v.seniority}`)}</span>
        {v.salary && <span className="inline-flex items-center gap-1.5"><Banknote size={14} />{v.salary}</span>}
      </div>
      <p className="text-sm leading-relaxed">{v.description}</p>
      <div>
        <p className="eyebrow mb-2">{t('vac.requirements')}</p>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {v.requirements.map((r) => (
            <li key={r.skillId} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
              <span className="font-medium">{sn(r.skillId)}{r.mandatory && <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:text-red-300">{t('vac.mandatory')}</span>}</span>
              <span className="flex items-center gap-2"><Level value={r.level} /><span className="font-mono text-xs text-mute">{t(`lvl.${r.level}`)}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-xl border border-line p-3"><p className="eyebrow mb-1 flex items-center gap-1.5 !text-[10px]"><Clock size={12} />{t('vac.minExp')}</p><b>{v.minExperience} {t('cand.yrs')}</b></div>
        <div className="rounded-xl border border-line p-3"><p className="eyebrow mb-1 flex items-center gap-1.5 !text-[10px]"><GraduationCap size={12} />{t('vac.minEdu')}</p><b>{t(`degree.${v.minEducation}`)}</b></div>
        <div className="rounded-xl border border-line p-3"><p className="eyebrow mb-1 flex items-center gap-1.5 !text-[10px]"><Languages size={12} />{t('cand.languages')}</p><b>{v.languages.map((l) => `${l.lang.toUpperCase()} ${t(`langlvl.${l.level}`)}`).join(', ') || '—'}</b></div>
      </div>
      {v.certs.length > 0 && (
        <div><p className="eyebrow mb-2 flex items-center gap-1.5"><Award size={12} />{t('cand.certs')}</p>
          <div className="flex flex-wrap gap-1.5">{v.certs.map((id) => <span key={id} className="chip">{db.kb.certs.find((c) => c.id === id)?.name ?? id}</span>)}</div></div>
      )}
    </div>
  )
}
