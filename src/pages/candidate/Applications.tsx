import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { computeMatch } from '../../lib/matching'
import { useMe } from '../../lib/useMe'
import type { Application } from '../../lib/types'
import { ConfirmModal, Empty, PageHeader, ScoreBadge } from '../../components/ui'
import { StatusChip } from '../../components/common'

export default function Applications() {
  const me = useMe()
  const db = useDB()
  const { t, date } = useI18n()
  const toast = useToast()
  const [del, setDel] = useState<Application | null>(null)
  if (!me) return null
  const apps = db.applications.filter((a) => a.candidateId === me.id).sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div>
      <PageHeader eyebrow={t('nav.applications')} title={t('apps.title')} desc={t('apps.desc')} />
      {apps.length === 0 ? <Empty title={t('apps.empty')} action={<Link to="/app/jobs" className="btn btn-primary mt-2">{t('nav.jobs')}</Link>} /> : (
        <div className="card divide-y divide-line overflow-hidden">
          {apps.map((a) => { const v = db.vacancies.find((x) => x.id === a.vacancyId); if (!v) return null; return (
            <div key={a.id} className="grid items-center gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_auto_auto_auto]">
              <div><p className="font-semibold">{v.title}</p><p className="text-xs text-mute">{v.company} · {v.location}</p></div>
              <p className="font-mono text-xs text-mute">{date(a.date)}</p>
              <ScoreBadge value={computeMatch(me, v, db.skills, db.kb).total} />
              <StatusChip s={a.status} />
              <button className="btn btn-ghost btn-sm" onClick={() => setDel(a)} disabled={a.status === 'interview'}><Undo2 size={13} />{t('apps.withdraw')}</button>
            </div>) })}
        </div>
      )}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title={t('apps.withdraw')} text={t('apps.withdrawText')} onConfirm={() => { if (del) { actions.withdraw(del.id); toast(t('toast.withdrawn')) } }} />
    </div>
  )
}
