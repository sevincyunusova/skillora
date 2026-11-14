import type {
  Candidate, Vacancy, Skill, KnowledgeBase, MatchResult, CriterionResult, SkillGap, RuleFired, DecisionKey, DegreeKey,
} from './types'

const CURRENT_YEAR = new Date().getFullYear()

export const CRITERIA_KEYS = ['technical', 'experience', 'education', 'soft', 'certs', 'languages'] as const

export function candidateYears(c: Candidate): number {
  let total = 0
  for (const e of c.experience) total += Math.max(0, (e.to ?? CURRENT_YEAR) - e.from)
  return total
}
const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))
const skillLevel = (c: Candidate, id: string) => c.skills.find((s) => s.skillId === id)?.level ?? 0

export interface Retrieval {
  skillId: string
  required: number
  mandatory: boolean
  related: string[]
}

/** Stage 1: Knowledge retrieval — pull requirement definitions and related-skill graph from KB */
export function retrieveKnowledge(v: Vacancy, skills: Skill[]): Retrieval[] {
  return v.requirements.map((r) => {
    const s = skills.find((x) => x.id === r.skillId)
    return { skillId: r.skillId, required: r.level, mandatory: r.mandatory, related: s?.related ?? [] }
  })
}

function isSoft(skills: Skill[], id: string) {
  return skills.find((s) => s.id === id)?.category === 'soft'
}

function scoreSkills(c: Candidate, reqs: Retrieval[]): { score: number; detail: string[] } {
  if (!reqs.length) return { score: -1, detail: [] }
  let sum = 0
  let wsum = 0
  const detail: string[] = []
  for (const r of reqs) {
    const have = skillLevel(c, r.skillId)
    let s = clamp(have / r.required)
    let via = ''
    if (have === 0) {
      // partial credit through related skills in the knowledge graph
      const rel = r.related.map((id) => skillLevel(c, id)).filter((l) => l > 0)
      if (rel.length) {
        s = clamp((Math.max(...rel) / r.required) * 0.3)
        via = 'related'
      }
    }
    const w = r.mandatory ? 1.5 : 1
    sum += s * w
    wsum += w
    detail.push(`${r.skillId}|${have}|${r.required}|${Math.round(s * 100)}${via ? '|' + via : ''}`)
  }
  return { score: (sum / wsum) * 100, detail }
}

function degreePoints(kb: KnowledgeBase, k: DegreeKey) {
  return kb.education.find((e) => e.id === k)?.points ?? 0
}

export function evaluate(c: Candidate, v: Vacancy, skills: Skill[], kb: KnowledgeBase): CriterionResult[] {
  const reqs = retrieveKnowledge(v, skills)
  const tech = scoreSkills(c, reqs.filter((r) => !isSoft(skills, r.skillId)))
  const soft = scoreSkills(c, reqs.filter((r) => isSoft(skills, r.skillId)))

  // technical
  const technical = tech.score < 0 ? 70 : tech.score

  // soft: if no soft requirements, fall back to the candidate's own soft-skill profile
  let softScore = soft.score
  let softDetail = soft.detail
  if (softScore < 0) {
    const own = c.skills.filter((s) => isSoft(skills, s.skillId))
    softScore = own.length ? clamp(own.reduce((a, s) => a + s.level, 0) / own.length / 4) * 100 : 40
    softDetail = ['profile|' + own.length]
  }

  // experience
  const years = candidateYears(c)
  const minExp = v.minExperience
  const reqIds = new Set(v.requirements.map((r) => r.skillId))
  let relevant = 0
  for (const e of c.experience) {
    const dur = Math.max(0, (e.to ?? CURRENT_YEAR) - e.from)
    const overlap = e.skills.filter((s) => reqIds.has(s)).length
    const ratio = reqIds.size ? clamp(overlap / Math.min(3, reqIds.size)) : 0
    relevant += dur * ratio
  }
  const durationScore = minExp <= 0 ? 1 : clamp(years / minExp)
  const relScore = minExp <= 0 ? clamp(relevant / 2) : clamp(relevant / minExp)
  const experience = (durationScore * 0.6 + relScore * 0.4) * 100

  // education
  const best = c.education.reduce((m, e) => Math.max(m, degreePoints(kb, e.degree)), 0)
  const reqPts = degreePoints(kb, v.minEducation) || 1
  const fieldHit = v.fields.length === 0 || c.education.some((e) => v.fields.some((f) => e.field.toLowerCase().includes(f.toLowerCase())))
  const education = clamp(best / reqPts) * (fieldHit ? 1 : 0.8) * 100

  // certificates
  let certs: number
  const certDetail: string[] = []
  const heldNames = c.certificates.map((x) => x.name.toLowerCase())
  if (v.certs.length) {
    let hit = 0
    for (const id of v.certs) {
      const kc = kb.certs.find((x) => x.id === id)
      const ok = !!kc && heldNames.some((n) => n.includes(kc.name.toLowerCase()) || kc.name.toLowerCase().includes(n))
      if (ok) hit++
      certDetail.push(`${id}|${ok ? 1 : 0}`)
    }
    certs = (hit / v.certs.length) * 100
  } else {
    certs = clamp(0.6 + c.certificates.length * 0.2) * 100
    certDetail.push('none|' + c.certificates.length)
  }

  // languages
  let languages = 100
  const langDetail: string[] = []
  if (v.languages.length) {
    let sum = 0
    for (const l of v.languages) {
      const have = c.languages.find((x) => x.lang === l.lang)?.level ?? 0
      sum += clamp(have / l.level)
      langDetail.push(`${l.lang}|${have}|${l.level}`)
    }
    languages = (sum / v.languages.length) * 100
  }

  const w = kb.weights
  const wsum = w.technical + w.experience + w.education + w.soft + w.certs + w.languages || 1
  const mk = (key: CriterionResult['key'], score: number, detail: string[]): CriterionResult => {
    const weight = w[key] / wsum
    return { key, score: Math.round(score * 10) / 10, weight, weighted: Math.round(score * weight * 10) / 10, detail }
  }
  return [
    mk('technical', technical, tech.detail),
    mk('experience', experience, [`years|${years}|${minExp}`, `relevant|${Math.round(relevant * 10) / 10}`]),
    mk('education', education, [`best|${best}|${reqPts}|${fieldHit ? 1 : 0}`]),
    mk('soft', softScore, softDetail),
    mk('certs', certs, certDetail),
    mk('languages', languages, langDetail),
  ]
}

export function ruleLabelKey(k: DecisionKey) {
  return `decision.${k}`
}

/** Stage 3: rule analysis — threshold rules from KB + mandatory-skill constraint rules */
export function applyRules(total: number, violations: SkillGap[], kb: KnowledgeBase): { base: DecisionKey; decision: DecisionKey; rules: RuleFired[] } {
  const rules: RuleFired[] = []
  const ordered = [...kb.rules].filter((r) => r.enabled).sort((a, b) => b.min - a.min)
  const order: DecisionKey[] = ['interview', 'assess', 'reserve', 'low']
  let base: DecisionKey = 'low'
  for (const r of ordered) {
    if (total >= r.min) {
      base = r.id
      rules.push({ id: 'threshold.' + r.id, params: { min: r.min, score: Math.round(total) } })
      break
    }
  }
  let decision = base
  if (violations.length) {
    const missingAll = violations.filter((v) => v.have === 0)
    const cap: DecisionKey = missingAll.length ? 'reserve' : 'assess'
    if (order.indexOf(decision) < order.indexOf(cap)) {
      decision = cap
      rules.push({ id: missingAll.length ? 'mandatory.missing' : 'mandatory.below', params: { count: violations.length } })
    } else {
      rules.push({ id: 'mandatory.noted', params: { count: violations.length } })
    }
  } else {
    rules.push({ id: 'mandatory.ok', params: {} })
  }
  return { base, decision, rules }
}

export function computeMatch(c: Candidate, v: Vacancy, skills: Skill[], kb: KnowledgeBase): MatchResult {
  const retrieved = retrieveKnowledge(v, skills)
  const criteria = evaluate(c, v, skills, kb)
  const total = Math.round(criteria.reduce((a, x) => a + x.weighted, 0) * 10) / 10

  const gaps: SkillGap[] = v.requirements.map((r) => ({ skillId: r.skillId, required: r.level, have: skillLevel(c, r.skillId), mandatory: r.mandatory }))
  const missing = gaps.filter((g) => g.have === 0)
  const improve = gaps.filter((g) => g.have > 0 && g.have < g.required)
  const violations = gaps.filter((g) => g.mandatory && g.have < g.required)
  const strengths = gaps.filter((g) => g.have >= g.required).map((g) => ({ skillId: g.skillId, level: g.have }))
    .sort((a, b) => b.level - a.level)
  const strongCriteria = criteria.filter((x) => x.score >= 80).map((x) => x.key)
  const weakCriteria = criteria.filter((x) => x.score < 60).map((x) => x.key)

  const { base, decision, rules } = applyRules(total, violations, kb)
  return {
    candidateId: c.id, vacancyId: v.id, total, criteria, strengths, strongCriteria, missing, improve, weakCriteria, violations,
    baseDecision: base, decision, rules, retrieved,
  }
}

export function rankCandidates(cands: Candidate[], v: Vacancy, skills: Skill[], kb: KnowledgeBase) {
  return cands.map((c) => computeMatch(c, v, skills, kb)).sort((a, b) => b.total - a.total)
}

export const scoreTone = (n: number) => (n >= 85 ? 'high' : n >= 70 ? 'mid' : n >= 50 ? 'low' : 'none')
