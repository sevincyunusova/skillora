import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { CertItem, DegreeKey, EducationItem, ExperienceItem, LangCode, LanguageItem, Skill } from './types'
import { uid } from './store'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Reads a PDF in the browser and returns its text, rebuilt line by line from glyph positions. */
export async function extractPdfLines(data: ArrayBuffer): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const lines: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const rows: { y: number; parts: { x: number; s: string }[] }[] = []
    for (const it of content.items) {
      if (!('str' in it) || !it.str.trim()) continue
      const x = it.transform[4] as number
      const y = it.transform[5] as number
      let row = rows.find((r) => Math.abs(r.y - y) < 2.5)
      if (!row) { row = { y, parts: [] }; rows.push(row) }
      row.parts.push({ x, s: it.str })
    }
    rows.sort((a, b) => b.y - a.y)
    for (const r of rows) {
      r.parts.sort((a, b) => a.x - b.x)
      const text = r.parts.map((x) => x.s).join(' ').replace(/\s+/g, ' ').trim()
      if (text) lines.push(text)
    }
  }
  await doc.destroy()
  return lines
}

export interface ParsedSkill { skillId: string; level: number; confirmed: boolean }
export interface ParsedCV {
  name?: string
  title?: string
  email?: string
  phone?: string
  github?: string
  portfolio?: string
  summary?: string
  skills: ParsedSkill[]
  education: EducationItem[]
  experience: ExperienceItem[]
  certificates: CertItem[]
  languages: LanguageItem[]
  sections: string[]
  lineCount: number
}

type Section = 'summary' | 'education' | 'experience' | 'skills' | 'certs' | 'languages' | 'other'
const HEAD: [Section, RegExp][] = [
  ['summary', /^(professional\s+)?(summary|profile|about(\s+me)?|objective|haqqında|özət|məqsəd|профиль|о\s+себе|цель)\s*:?$/i],
  ['education', /^(education|academic|təhsil|образование)\s*:?$/i],
  ['experience', /^((work|professional|employment)\s+)?(experience|history)|^iş\s+təcrübəsi|^təcrübə|^опыт(\s+работы)?|^карьера/i],
  ['skills', /^((technical|core|key|hard|soft)\s+)?(skills|competencies|technologies)|^bacarıqlar|^texniki\s+bacarıqlar|^навыки|^ключевые\s+навыки/i],
  ['certs', /^(certificat|licen[cs]es|courses|sertifikat|kurslar|сертификат|курсы)/i],
  ['languages', /^(languages|dillər|dil\s+bilikləri|языки|владение\s+языками)\s*:?$/i],
  ['other', /^(projects?|layihələr|проекты|references|interests|hobbies|awards|publications|marağ|maraqlar|увлечения)\s*:?$/i],
]
const MONTH = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|yan|fev|iyn|iyl|avq|sen|okt|noy|dek|янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)[a-zа-я]*\\.?'
const RANGE = new RegExp(`((?:${MONTH}\\s*)?(?:19|20)\\d{2})\\s*(?:[-–—]|to|until|–|до)\\s*((?:${MONTH}\\s*)?(?:(?:19|20)\\d{2}|present|current|now|indi|hazırda|h\\.h\\.|настоящее\\s+время|наст\\.\\s*вр\\.|по\\s+н\\.в\\.))`, 'i')
const PRESENT = /present|current|now|indi|hazırda|h\.h\.|настоящ|н\.в\./i

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const year = (s: string) => { const m = s.match(/(?:19|20)\d{2}/g); return m ? parseInt(m[m.length - 1], 10) : NaN }

function detectSection(line: string): Section | null {
  const t = line.replace(/[:：]\s*$/, '').trim()
  if (t.length > 42 || t.split(' ').length > 5) return null
  for (const [k, re] of HEAD) if (re.test(t)) return k
  return null
}

const DEGREE_RE: [DegreeKey, RegExp][] = [
  ['phd', /\b(ph\.?d|doctor(ate)?|doktor(antura)?|докторантура|кандидат\s+наук)\b/i],
  ['master', /\b(master'?s?|m\.?sc|m\.?a\.|mba|magistr(atura)?|магистр(атура)?)\b/i],
  ['bachelor', /\b(bachelor'?s?|b\.?sc|b\.?a\.|bakalavr|бакалавр(иат)?|undergraduate)\b/i],
  ['college', /\b(college|kollec|колледж|associate|technical school|texnikum|техникум)\b/i],
  ['highschool', /\b(high\s+school|lisey|gimnaziya|orta\s+məktəb|средняя\s+школа|лицей|гимназия)\b/i],
]
const SCHOOL_RE = /([^,|–—·]*?(?:university|universiteti|universitet|institute|institut|academy|akademiya|akademiyası|college|школа|университет|институт|академия)[^,|–—·]*)/i
const LANGS_RE: [LangCode, RegExp][] = [
  ['az', /\b(azerbaijani|azərbaycan(ca)?|азербайджанский)\b/i],
  ['en', /\b(english|ingilis(\s+dili)?|английский)\b/i],
  ['ru', /\b(russian|rus(\s+dili)?|русский)\b/i],
  ['tr', /\b(turkish|türk(cə)?|турецкий)\b/i],
  ['de', /\b(german|alman(ca)?|немецкий)\b/i],
]

function skillRegexes(skills: Skill[]) {
  return skills.map((s) => {
    const names = [s.name, ...(s.aliases ?? [])].filter((n) => n.length > 1)
    const re = new RegExp(`(?<![A-Za-z0-9+#])(?:${names.map(esc).join('|')})(?![A-Za-z0-9+#])`, 'i')
    return { s, re }
  })
}

function levelFromText(txt: string): number | null {
  const frac = txt.match(/(\d)\s*\/\s*5/)
  if (frac) return Math.min(5, Math.max(1, +frac[1]))
  if (/\b(expert|master|ekspert|эксперт)\b/i.test(txt)) return 5
  if (/\b(advanced|senior|strong|yüksək|işlək|продвинут|высокий)\b/i.test(txt)) return 4
  if (/\b(intermediate|proficient|good|orta|средний|хороший)\b/i.test(txt)) return 3
  if (/\b(basic|beginner|junior|elementary|əsas|başlanğıc|базовый|начальный)\b/i.test(txt)) return 2
  return null
}

export function parseCV(lines: string[], kbSkills: Skill[]): ParsedCV {
  const out: ParsedCV = { skills: [], education: [], experience: [], certificates: [], languages: [], sections: [], lineCount: lines.length }
  const text = lines.join('\n')

  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)
  if (email) out.email = email[0]
  const phone = lines.map((l) => l.match(/(\+?\d[\d\s().-]{7,}\d)/)).find((m) => m && m[1].replace(/\D/g, '').length >= 9)
  if (phone) out.phone = phone[1].trim()
  const gh = text.match(/github\.com\/([A-Za-z0-9-]+)/i)
  if (gh) out.github = gh[1]
  const url = [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((m) => m[0]).find((u) => !/github\.com|linkedin\.com|mailto/i.test(u))
  if (url) out.portfolio = url

  // sections
  const bySection = new Map<Section | 'head', string[]>()
  let cur: Section | 'head' = 'head'
  for (const l of lines) {
    const sec = detectSection(l)
    if (sec) { cur = sec; if (!out.sections.includes(sec)) out.sections.push(sec); continue }
    bySection.set(cur, [...(bySection.get(cur) ?? []), l])
  }
  const sect = (k: Section) => bySection.get(k) ?? []

  // name / title come from the header block
  const head = bySection.get('head') ?? []
  const nameLine = head.find((l) => !/[@\d/]|http/i.test(l) && /^[\p{L}][\p{L}'’.-]+(\s+[\p{L}][\p{L}'’.-]+){1,3}$/u.test(l) && l.length < 48)
  if (nameLine) {
    out.name = nameLine
    const after = head[head.indexOf(nameLine) + 1]
    if (after && !/[@\d]|http/i.test(after) && after.length < 60) out.title = after
  }
  if (sect('summary').length) out.summary = sect('summary').join(' ').slice(0, 500)

  // skills: whole text, with level hints taken from the line that mentions the skill
  const regs = skillRegexes(kbSkills)
  const seen = new Set<string>()
  for (const { s, re } of regs) {
    const lineHit = lines.find((l) => re.test(l))
    if (!lineHit) continue
    const hint = sect('skills').includes(lineHit) ? levelFromText(lineHit.slice(Math.max(0, lineHit.search(re)), lineHit.search(re) + s.name.length + 24)) : null
    seen.add(s.id)
    out.skills.push({ skillId: s.id, level: hint ?? 3, confirmed: hint !== null })
  }

  // experience
  const ex = sect('experience')
  for (let i = 0; i < ex.length; i++) {
    const m = ex[i].match(RANGE)
    if (!m) continue
    const from = year(m[1])
    const toStr = m[2]
    const to = PRESENT.test(toStr) ? null : year(toStr)
    let head = ex[i].replace(RANGE, '').replace(/[|·•(),\s-–—]+$/g, '').replace(/^[|·•(),\s-–—]+/g, '').trim()
    if (!head && i > 0 && !ex[i - 1].match(RANGE)) head = ex[i - 1]
    let role = head
    let company = ''
    const split = head.split(/\s+(?:at|@|—|–|\||·)\s+|\s+-\s+|,\s+/i)
    if (split.length >= 2) { role = split[0]; company = split.slice(1).join(', ') }
    else if (i + 1 < ex.length && !ex[i + 1].match(RANGE) && ex[i + 1].length < 60 && !/^[•\-*]/.test(ex[i + 1])) company = ex[i + 1]
    const desc: string[] = []
    for (let j = i + 1; j < ex.length && !ex[j].match(RANGE) && desc.length < 3; j++) { if (ex[j] !== company && ex[j].length > 12) desc.push(ex[j].replace(/^[•\-*]\s*/, '')) }
    const descr = desc.join(' ').slice(0, 300)
    const used = regs.filter(({ re }) => re.test(`${role} ${descr}`)).map(({ s }) => s.id)
    if (role && !Number.isNaN(from)) out.experience.push({ id: uid('x'), role: role.slice(0, 80), company: company.slice(0, 80), from, to: to !== null && Number.isNaN(to) ? null : to, description: descr, skills: used })
  }

  // education
  const ed = sect('education')
  const SCHOOL_TEST = /university|universiteti|universitet|institute|institut|academy|akademiya|college|школа|университет|институт|академия/i
  const DEG_STRIP = /^(?:ph\.?d|doctor(?:ate)?|doktor(?:antura)?|master'?s?|m\.?sc|mba|magistr(?:atura)?|магистр(?:атура)?|bachelor'?s?|b\.?sc|bakalavr|бакалавр(?:иат)?|undergraduate|college|kollec|колледж|associate|high\s+school)(?:\s+of\s+(?:science|arts|engineering|business(?:\s+administration)?))?(?:\s+degree)?\s*(?:in|of|-|:)?\s*/i
  for (let i = 0; i < ed.length; i++) {
    const line = ed[i]
    let degree: DegreeKey | null = null
    for (const [k, re] of DEGREE_RE) if (re.test(line)) { degree = k; break }
    const segs = line.split(/\s+[-–—|·]\s+|\s*\|\s*|,\s+/).map((x) => x.replace(/\(?(?:19|20)\d{2}\)?/g, '').trim()).filter(Boolean)
    const school = segs.find((x) => SCHOOL_TEST.test(x)) ?? ''
    if (!degree && !school) continue
    let field = ''
    for (const sg of segs) {
      if (sg === school) continue
      const f = sg.replace(DEG_STRIP, '').trim()
      if (f.length > 2 && !/^(?:19|20)\d{2}$/.test(f)) { field = f; break }
    }
    if (!degree) { const nxt = ed[i + 1] ?? ''; for (const [k, re] of DEGREE_RE) if (re.test(nxt)) { degree = k; break } }
    const y = year(line) || year(ed[i + 1] ?? '')
    out.education.push({ id: uid('e'), degree: degree ?? 'bachelor', field: field.slice(0, 60), school: school.slice(0, 80), year: Number.isNaN(y) ? new Date().getFullYear() : y })
  }
  const dedupe = new Set<string>()
  out.education = out.education.filter((e) => { const k = `${e.school}|${e.year}|${e.field}`; if (dedupe.has(k)) return false; dedupe.add(k); return true })

  // certificates
  for (const l of sect('certs')) {
    const name = l.replace(/^[•\-*]\s*/, '').replace(/\(?\b(?:19|20)\d{2}\b\)?/, '').replace(/[,–—-]\s*$/, '').trim()
    if (name.length < 4 || name.length > 90) continue
    const y = year(l)
    out.certificates.push({ id: uid('c'), name, issuer: '', year: Number.isNaN(y) ? new Date().getFullYear() : y })
  }

  // languages: only trusted inside a languages section (otherwise ask the user)
  for (const l of sect('languages')) {
    for (const [code, re] of LANGS_RE) {
      if (!re.test(l) || out.languages.some((x) => x.lang === code)) continue
      let level = 3
      if (/native|ana\s+dili|родной|\bC2\b/i.test(l)) level = 5
      else if (/fluent|advanced|\bC1\b|işlək|свободно|продвинут/i.test(l)) level = 4
      else if (/\bB2\b|upper/i.test(l)) level = 3
      else if (/\bB1\b|intermediate|orta|средний/i.test(l)) level = 2
      else if (/\bA[12]\b|basic|beginner|elementary|əsas|базовый/i.test(l)) level = 1
      out.languages.push({ lang: code, level })
    }
  }
  return out
}
