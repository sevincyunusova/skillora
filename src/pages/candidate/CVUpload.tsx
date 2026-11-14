import { useRef, useState, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, FileUp, Loader2, ScanText, Save } from 'lucide-react'
import { actions, useDB } from '../../lib/store'
import { useI18n } from '../../i18n'
import { useToast } from '../../lib/toast'
import { useMe } from '../../lib/useMe'
import { extractPdfLines, parseCV, type ParsedCV } from '../../lib/cv'
import type { Candidate } from '../../lib/types'
import { Btn, PageHeader } from '../../components/ui'
import { CandidateEditor, validateCandidate, type Errors } from '../../components/CandidateEditor'

type Phase = 'idle' | 'reading' | 'review' | 'error'

function merge(me: Candidate, p: ParsedCV, file: string): Candidate {
  const skills = [...me.skills]
  p.skills.forEach((s) => { if (!skills.some((x) => x.skillId === s.skillId)) skills.push({ skillId: s.skillId, level: s.level }) })
  const exp = [...me.experience]
  p.experience.forEach((x) => { if (!exp.some((y) => y.role.toLowerCase() === x.role.toLowerCase() && y.company.toLowerCase() === x.company.toLowerCase() && y.from === x.from)) exp.push(x) })
  const edu = [...me.education]
  p.education.forEach((x) => { if (!edu.some((y) => y.school.toLowerCase() === x.school.toLowerCase() && y.year === x.year)) edu.push(x) })
  const certs = [...me.certificates]
  p.certificates.forEach((x) => { if (!certs.some((y) => y.name.toLowerCase() === x.name.toLowerCase())) certs.push(x) })
  const langs = [...me.languages]
  p.languages.forEach((x) => { if (!langs.some((y) => y.lang === x.lang)) langs.push(x) })
  return {
    ...me,
    name: p.name || me.name, title: p.title || me.title, email: p.email || me.email, phone: p.phone || me.phone, summary: p.summary || me.summary, portfolio: p.portfolio || me.portfolio,
    github: p.github ? { user: p.github, repos: me.github?.user === p.github ? me.github.repos : 0, stars: me.github?.user === p.github ? me.github.stars : 0, langs: me.github?.user === p.github ? me.github.langs : [] } : me.github,
    skills, experience: exp, education: edu, certificates: certs, languages: langs, cvFile: file,
  }
}

export default function CVUpload() {
  const me = useMe()
  const db = useDB()
  const { t } = useI18n()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState('')
  const [parsed, setParsed] = useState<ParsedCV | null>(null)
  const [draft, setDraft] = useState<Candidate | null>(null)
  const [raw, setRaw] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  if (!me) return null

  const handle = async (f: File | undefined | null) => {
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { setErr(t('cv.notPdf')); setPhase('error'); return }
    if (f.size > 8 * 1024 * 1024) { setErr(t('cv.tooBig')); setPhase('error'); return }
    setPhase('reading'); setFile(f.name); setErr('')
    try {
      const lines = await extractPdfLines(await f.arrayBuffer())
      if (lines.join('').trim().length < 30) { setErr(t('cv.noText')); setPhase('error'); return }
      const p = parseCV(lines, db.skills)
      setRaw(lines); setParsed(p); setDraft(merge(me, p, f.name)); setErrors({}); setPhase('review')
    } catch (e) {
      console.error(e)
      setErr(t('cv.readFail')); setPhase('error')
    }
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }

  const confirm = () => {
    if (!draft) return
    const e = validateCandidate(draft, t, db.candidates)
    setErrors(e)
    if (Object.keys(e).length) { toast(t('cv.fixBefore'), 'error'); return }
    actions.saveCandidate(draft)
    toast(t('cv.saved'))
    setPhase('idle'); setParsed(null); setDraft(null)
  }

  const found: [string, number | string | undefined][] = parsed ? [
    ['cv.f.name', parsed.name], ['cv.f.email', parsed.email], ['cv.f.phone', parsed.phone], ['cv.f.skills', parsed.skills.length || undefined], ['cv.f.edu', parsed.education.length || undefined], ['cv.f.exp', parsed.experience.length || undefined], ['cv.f.certs', parsed.certificates.length || undefined], ['cv.f.langs', parsed.languages.length || undefined],
  ] : []

  return (
    <div>
      <PageHeader eyebrow={t('nav.cv')} title={t('cv.title')} desc={t('cv.desc')} />

      {(phase === 'idle' || phase === 'error' || phase === 'reading') && (
        <div>
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
            className={`relative grid place-items-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-colors md:p-16 ${drag ? 'border-brand bg-accent/20' : 'border-line bg-surface'}`}>
            <div className="hairgrid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative">
              {phase === 'reading' ? (
                <><Loader2 size={40} className="mx-auto animate-spin text-brand" /><p className="mt-4 font-display text-xl font-bold">{t('cv.reading')}</p><p className="mt-1 text-sm text-mute">{file}</p></>
              ) : (
                <>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-ink"><FileUp size={28} /></motion.div>
                  <p className="mt-5 font-display text-xl font-bold">{t('cv.drop')}</p><p className="mt-1 text-sm text-mute">{t('cv.limits')}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3"><Btn onClick={() => input.current?.click()}>{t('cv.choose')}</Btn><Btn variant="ghost" onClick={async () => { try { const r = await fetch('/sample-cv.pdf'); handle(new File([await r.blob()], 'sample-cv.pdf', { type: 'application/pdf' })) } catch { setErr(t('cv.readFail')); setPhase('error') } }}>{t('cv.sample')}</Btn></div>
                  <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} aria-label={t('cv.choose')} />
                </>
              )}
            </div>
          </div>
          {phase === 'error' && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm" role="alert"><AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />{err}</div>}
          <div className="mt-6 grid gap-4 md:grid-cols-3">{['1', '2', '3'].map((n) => <div key={n} className="card p-5"><span className="font-mono text-xs text-brand">0{n}</span><p className="mt-2 font-display font-bold">{t(`cv.step${n}`)}</p><p className="mt-1 text-sm text-mute">{t(`cv.step${n}d`)}</p></div>)}</div>
          <p className="mt-4 text-xs text-mute">{t('cv.privacy')}</p>
        </div>
      )}

      {phase === 'review' && parsed && draft && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ScanText className="text-brand" /><div><p className="font-display text-lg font-bold">{t('cv.extracted')}</p><p className="text-xs text-mute">{file} · {t('cv.lines', { n: parsed.lineCount })}</p></div></div></div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{found.map(([k, v]) => <li key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${v ? 'border-olive/40 bg-olive/10' : 'border-line text-mute'}`}>{v ? <CheckCircle2 size={15} className="shrink-0 text-olive" /> : <AlertCircle size={15} className="shrink-0" />}<span className="truncate">{t(k)}{typeof v === 'number' ? `: ${v}` : ''}</span></li>)}</ul>
            <p className="mt-4 rounded-xl bg-violet/15 p-3 text-sm">{t('cv.reviewNote')}</p>
            {parsed.skills.some((s) => !s.confirmed) && <p className="mt-2 text-xs text-mute">{t('cv.levelNote')}</p>}
            <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">{t('cv.raw')}</summary><pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-surface2/60 p-3 font-mono text-[11px] leading-relaxed">{raw.join('\n')}</pre></details>
          </div>
          <div className="card p-5 md:p-7"><CandidateEditor value={draft} onChange={setDraft} skills={db.skills} errors={errors} /></div>
          <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-2xl border border-line bg-surface/90 p-3 shadow-lg backdrop-blur"><Btn variant="ghost" onClick={() => { setPhase('idle'); setParsed(null); setDraft(null) }}>{t('common.cancel')}</Btn><Btn onClick={confirm}><Save size={15} />{t('cv.confirm')}</Btn></div>
        </div>
      )}
    </div>
  )
}
