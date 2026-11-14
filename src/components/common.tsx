import { Link } from 'react-router-dom'
import type { AppStatus, Candidate } from '../lib/types'
import { useI18n } from '../i18n'
import { Avatar } from './ui'

const ST: Record<AppStatus, string> = {
  new: 'bg-accent/80 text-accent-ink',
  review: 'bg-olive/25 text-ink',
  interview: 'bg-ink text-bg',
  reserve: 'bg-violet/30 text-ink',
  rejected: 'bg-red-500/15 text-red-700 dark:text-red-300',
}
export function StatusChip({ s }: { s: AppStatus }) {
  const { t } = useI18n()
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ST[s]}`}>{t(`status.${s}`)}</span>
}

export function CandidateCell({ c, link = true, sub }: { c: Candidate; link?: boolean; sub?: string }) {
  const body = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={c.name} hue={c.hue} size={38} />
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{c.name}</p><p className="truncate text-xs text-mute">{sub ?? c.title}</p></div>
    </div>
  )
  return link ? <Link to={`/app/candidates/${c.id}`} className="hover:opacity-80">{body}</Link> : body
}

export function SkillChips({ skills, names, max = 4 }: { skills: { skillId: string; level: number }[]; names: (id: string) => string; max?: number }) {
  const top = [...skills].sort((a, b) => b.level - a.level).slice(0, max)
  return (
    <div className="flex flex-wrap gap-1">
      {top.map((s) => <span key={s.skillId} className="chip !py-0.5 text-[11px]">{names(s.skillId)}<b className="font-mono text-brand">{s.level}</b></span>)}
      {skills.length > max && <span className="chip !py-0.5 text-[11px] text-mute">+{skills.length - max}</span>}
    </div>
  )
}
