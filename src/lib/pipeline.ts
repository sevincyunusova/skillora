import type { Candidate, KnowledgeBase, MatchResult, Skill, Vacancy } from './types'
import { applyRules, computeMatch, evaluate, retrieveKnowledge } from './matching'

export type StageId = 'retrieval' | 'evaluation' | 'rules' | 'decision'
export const STAGES: StageId[] = ['retrieval', 'evaluation', 'rules', 'decision']

export interface PipeLog { stage: StageId; key: string; vars: Record<string, string | number> }
export interface PipeEvent {
  stage: StageId
  status: 'start' | 'log' | 'done'
  progress: number // 0..1 within stage
  log?: PipeLog
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Executes the real matching computation step by step. Every log line is produced
 * by the computation that just ran (nothing is scripted), and the pacing delay is
 * proportional to the amount of work reported so the user can follow it.
 */
export async function runPipeline(
  candidates: Candidate[], v: Vacancy, skills: Skill[], kb: KnowledgeBase,
  emit: (e: PipeEvent) => void, pace = 1, cancelled: () => boolean = () => false,
): Promise<MatchResult[]> {
  const name = (id: string) => skills.find((s) => s.id === id)?.name ?? id
  const step = async (ms: number) => { if (pace > 0) await sleep(ms * pace) }
  const log = (stage: StageId, key: string, vars: Record<string, string | number>, progress: number) => emit({ stage, status: 'log', progress, log: { stage, key, vars } })

  // 1 — Knowledge retrieval
  emit({ stage: 'retrieval', status: 'start', progress: 0 })
  const retrieved = retrieveKnowledge(v, skills)
  const relations = retrieved.reduce((a, r) => a + r.related.length, 0)
  log('retrieval', 'pipe.retrieval.vacancy', { title: v.title, n: retrieved.length }, 0.2); await step(380)
  if (cancelled()) return []
  for (let i = 0; i < retrieved.length; i++) {
    const r = retrieved[i]
    log('retrieval', 'pipe.retrieval.skill', { skill: name(r.skillId), level: r.required, mand: r.mandatory ? '★' : '', rel: r.related.length }, 0.2 + (0.8 * (i + 1)) / retrieved.length)
    await step(150)
    if (cancelled()) return []
  }
  log('retrieval', 'pipe.retrieval.graph', { n: relations, c: candidates.length, kb: skills.length }, 1)
  emit({ stage: 'retrieval', status: 'done', progress: 1 }); await step(200)

  // 2 — Skill evaluation
  emit({ stage: 'evaluation', status: 'start', progress: 0 })
  const evals: ReturnType<typeof evaluate>[] = []
  for (let i = 0; i < candidates.length; i++) {
    const cr = evaluate(candidates[i], v, skills, kb)
    evals.push(cr)
    if (candidates.length === 1) {
      for (let k = 0; k < cr.length; k++) {
        log('evaluation', 'pipe.eval.criterion', { crit: `crit.${cr[k].key}`, score: Math.round(cr[k].score), w: Math.round(cr[k].weight * 100), pts: cr[k].weighted.toFixed(1) }, (k + 1) / cr.length)
        await step(330)
        if (cancelled()) return []
      }
    } else {
      const total = cr.reduce((a, x) => a + x.weighted, 0)
      log('evaluation', 'pipe.eval.candidate', { name: candidates[i].name, score: total.toFixed(1) }, (i + 1) / candidates.length)
      await step(Math.max(60, 600 / candidates.length))
      if (cancelled()) return []
    }
  }
  emit({ stage: 'evaluation', status: 'done', progress: 1 }); await step(200)

  // 3 — Rule analysis
  emit({ stage: 'rules', status: 'start', progress: 0 })
  const results: MatchResult[] = []
  for (let i = 0; i < candidates.length; i++) {
    const m = computeMatch(candidates[i], v, skills, kb)
    const rules = applyRules(m.total, m.violations, kb)
    results.push(m)
    if (candidates.length === 1) {
      log('rules', 'pipe.rules.mandatory', { n: m.violations.length, total: v.requirements.filter((r) => r.mandatory).length }, 0.4)
      await step(380)
      for (const r of rules.rules) { log('rules', `rule.${r.id}`, r.params, 0.8); await step(330) }
    } else {
      log('rules', 'pipe.rules.candidate', { name: candidates[i].name, v: m.violations.length, base: m.baseDecision === m.decision ? '=' : '↓' }, (i + 1) / candidates.length)
      await step(Math.max(50, 450 / candidates.length))
    }
    if (cancelled()) return []
  }
  emit({ stage: 'rules', status: 'done', progress: 1 }); await step(200)

  // 4 — Decision generation
  emit({ stage: 'decision', status: 'start', progress: 0 })
  results.sort((a, b) => b.total - a.total)
  const top = results[0]
  log('decision', 'pipe.decision.rank', { n: results.length }, 0.5); await step(350)
  if (top) log('decision', 'pipe.decision.top', { name: candidates.find((c) => c.id === top.candidateId)?.name ?? '', score: top.total, d: `decision.${top.decision}` }, 1)
  await step(300)
  emit({ stage: 'decision', status: 'done', progress: 1 })
  return results
}
