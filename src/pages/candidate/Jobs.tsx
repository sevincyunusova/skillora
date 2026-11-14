import { useMemo, useState } from 'react'
import { useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { computeMatch } from '../../lib/matching'
import { useMe } from '../../lib/useMe'
import { Empty, PageHeader, SearchBox, Tabs } from '../../components/ui'
import { JobCard } from '../../components/JobCard'

export default function Jobs() {
  const me = useMe()
  const db = useDB()
  const { t } = useI18n()
  const [tab, setTab] = useState<'rec' | 'all' | 'applied'>('rec')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    if (!me) return []
    const applied = new Set(db.applications.filter((a) => a.candidateId === me.id).map((a) => a.vacancyId))
    return db.vacancies.filter((v) => v.status === 'active' && (tab !== 'applied' || applied.has(v.id)) && (!q || `${v.title} ${v.company}`.toLowerCase().includes(q.toLowerCase())))
      .map((v) => ({ v, s: computeMatch(me, v, db.skills, db.kb).total })).filter((x) => tab !== 'rec' || x.s >= 50).sort((a, b) => b.s - a.s)
  }, [me, db, tab, q])
  if (!me) return null
  return (
    <div>
      <PageHeader eyebrow={t('nav.jobs')} title={t('jobs.title')} desc={t('jobs.desc')} />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><Tabs value={tab} onChange={setTab} items={[{ id: 'rec', label: t('jobs.tab.rec') }, { id: 'all', label: t('jobs.tab.all') }, { id: 'applied', label: t('jobs.tab.applied') }]} /><div className="md:w-72"><SearchBox value={q} onChange={setQ} placeholder={t('jobs.search')} /></div></div>
      {list.length === 0 ? <Empty title={t('common.noResults')} text={tab === 'rec' ? t('jobs.noRec') : undefined} /> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{list.map(({ v }) => <JobCard key={v.id} v={v} me={me} />)}</div>}
    </div>
  )
}
