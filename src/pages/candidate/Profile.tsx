import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { useMe } from '../../lib/useMe'
import type { Candidate } from '../../lib/types'
import { Btn, PageHeader, ScoreRing } from '../../components/ui'
import { CandidateEditor, validateCandidate, type Errors } from '../../components/CandidateEditor'
import { completeness } from '../../lib/useMe'

export default function Profile() {
  const me = useMe()
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const [val, setVal] = useState<Candidate | null>(me ?? null)
  const [errors, setErrors] = useState<Errors>({})
  useEffect(() => { if (me && !val) setVal(me) }, [me, val])
  if (!val || !me) return null
  const dirty = JSON.stringify(val) !== JSON.stringify(me)
  const save = () => {
    const e = validateCandidate(val, t, db.candidates)
    setErrors(e)
    if (Object.keys(e).length) { toast(t('toast.fixErrors'), 'error'); return }
    actions.saveCandidate(val)
    toast(t('toast.profileSaved'))
  }
  return (
    <div>
      <PageHeader eyebrow={t('nav.profile')} title={t('profile.title')} desc={t('profile.desc')} actions={<><Btn variant="ghost" onClick={() => { setVal(me); setErrors({}) }} disabled={!dirty}><RotateCcw size={15} />{t('common.reset')}</Btn><Btn onClick={save} disabled={!dirty}><Save size={15} />{t('common.save')}</Btn></>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
        <div className="card p-5 md:p-7"><CandidateEditor value={val} onChange={setVal} skills={db.skills} errors={errors} /></div>
        <aside className="card flex flex-col items-center gap-3 self-start p-6 text-center xl:sticky xl:top-8"><ScoreRing value={completeness(val).percent} size={110} stroke={10} label={t('cdash.complete')} /><p className="text-xs text-mute">{t('profile.liveHint')}</p>{dirty && <p className="rounded-full bg-accent/60 px-3 py-1 text-xs font-semibold text-accent-ink">{t('profile.unsaved')}</p>}</aside>
      </div>
    </div>
  )
}
