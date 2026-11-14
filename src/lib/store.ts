import { useSyncExternalStore } from 'react'
import type { DB, User, DecisionRecord, MatchResult, Candidate, Vacancy, Skill, Application, InterviewList, KnowledgeBase, AppStatus } from './types'
import { buildSeedDB } from '../data/seed'
import { computeMatch } from './matching'

const DB_KEY = 'skillora.db.v1'
const AUTH_KEY = 'skillora.auth.v1'

export const DEMO_USERS: (User & { password: string })[] = [
  { id: 'u-hr', email: 'hr@skillora.demo', password: 'Skillora123', name: 'Nərmin Qasımova', role: 'hr' },
  { id: 'u-c1', email: 'candidate@skillora.demo', password: 'Skillora123', name: 'Aysel Məmmədova', role: 'candidate', candidateId: 'c1' },
]

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`

function seedDecisions(db: DB) {
  const pairs: [string, string, string][] = [
    ['c9', 'v1', '2024-04-19'], ['c2', 'v1', '2024-04-18'], ['c14', 'v1', '2024-04-19'], ['c3', 'v3', '2024-04-17'], ['c10', 'v3', '2024-04-18'],
    ['c4', 'v4', '2024-04-16'], ['c5', 'v5', '2024-04-18'], ['c8', 'v6', '2024-04-20'], ['c1', 'v2', '2024-04-20'], ['c6', 'v2', '2024-04-21'],
    ['c12', 'v4', '2024-04-21'], ['c13', 'v3', '2024-04-22'], ['c2', 'v6', '2024-04-22'], ['c11', 'v2', '2024-04-22'],
  ]
  return pairs.map(([cid, vid, date], i) => {
    const c = db.candidates.find((x) => x.id === cid)!
    const v = db.vacancies.find((x) => x.id === vid)!
    return toRecord(computeMatch(c, v, db.skills, db.kb), 'Nərmin Qasımova', date + 'T1' + (i % 10) + ':20:00.000Z', 'd-seed' + i)
  })
}

export function toRecord(m: MatchResult, by: string, date = new Date().toISOString(), id = uid('d')): DecisionRecord {
  return {
    id, candidateId: m.candidateId, vacancyId: m.vacancyId, score: m.total, decision: m.decision, baseDecision: m.baseDecision,
    rules: m.rules, criteria: Object.fromEntries(m.criteria.map((c) => [c.key, c.score])),
    violations: m.violations.map((v) => v.skillId), date, by,
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed && parsed.version === 1 && Array.isArray(parsed.skills)) return parsed
    }
  } catch { /* ignore */ }
  const db = buildSeedDB() as DB
  db.decisions = seedDecisions(db)
  return db
}

let state: DB = load()
let auth: User | null = (() => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
})()

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const persist = () => {
  try { localStorage.setItem(DB_KEY, JSON.stringify(state)) } catch { /* quota */ }
}
function set(next: DB) {
  state = next
  persist()
  emit()
}
persist()

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export function useDB(): DB {
  return useSyncExternalStore(subscribe, () => state)
}
export const getDB = () => state

export function useAuth(): User | null {
  return useSyncExternalStore(subscribe, () => auth)
}
export const getAuth = () => auth

export const actions = {
  login(email: string, password: string): User | null {
    const u = DEMO_USERS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password)
    if (!u) return null
    const { password: _p, ...user } = u
    auth = user
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)) } catch { /* */ }
    emit()
    return user
  },
  logout() {
    auth = null
    try { localStorage.removeItem(AUTH_KEY) } catch { /* */ }
    emit()
  },
  resetDemo() {
    const db = buildSeedDB() as DB
    db.decisions = seedDecisions(db)
    set(db)
  },
  // skills
  saveSkill(s: Skill) {
    const exists = state.skills.some((x) => x.id === s.id)
    set({ ...state, skills: exists ? state.skills.map((x) => (x.id === s.id ? s : x)) : [...state.skills, s] })
  },
  deleteSkill(id: string) {
    set({
      ...state,
      skills: state.skills.filter((s) => s.id !== id).map((s) => ({ ...s, related: s.related.filter((r) => r !== id) })),
      candidates: state.candidates.map((c) => ({ ...c, skills: c.skills.filter((s) => s.skillId !== id) })),
      vacancies: state.vacancies.map((v) => ({ ...v, requirements: v.requirements.filter((r) => r.skillId !== id) })),
    })
  },
  // candidates
  saveCandidate(c: Candidate) {
    const exists = state.candidates.some((x) => x.id === c.id)
    set({ ...state, candidates: exists ? state.candidates.map((x) => (x.id === c.id ? c : x)) : [c, ...state.candidates] })
  },
  deleteCandidate(id: string) {
    set({
      ...state,
      candidates: state.candidates.filter((c) => c.id !== id),
      applications: state.applications.filter((a) => a.candidateId !== id),
      decisions: state.decisions.filter((d) => d.candidateId !== id),
    })
  },
  // vacancies
  saveVacancy(v: Vacancy) {
    const exists = state.vacancies.some((x) => x.id === v.id)
    set({ ...state, vacancies: exists ? state.vacancies.map((x) => (x.id === v.id ? v : x)) : [v, ...state.vacancies] })
  },
  deleteVacancy(id: string) {
    set({
      ...state,
      vacancies: state.vacancies.filter((v) => v.id !== id),
      applications: state.applications.filter((a) => a.vacancyId !== id),
      decisions: state.decisions.filter((d) => d.vacancyId !== id),
    })
  },
  // applications
  apply(candidateId: string, vacancyId: string): boolean {
    if (state.applications.some((a) => a.candidateId === candidateId && a.vacancyId === vacancyId)) return false
    const a: Application = { id: uid('a'), candidateId, vacancyId, date: new Date().toISOString().slice(0, 10), status: 'new' }
    set({ ...state, applications: [a, ...state.applications] })
    return true
  },
  withdraw(id: string) {
    set({ ...state, applications: state.applications.filter((a) => a.id !== id) })
  },
  setAppStatus(id: string, status: AppStatus) {
    set({ ...state, applications: state.applications.map((a) => (a.id === id ? { ...a, status } : a)) })
  },
  // decisions
  saveDecision(rec: DecisionRecord) {
    const statusMap: Record<string, AppStatus> = { interview: 'interview', assess: 'review', reserve: 'reserve', low: 'rejected' }
    const apps = state.applications.map((a) => (a.candidateId === rec.candidateId && a.vacancyId === rec.vacancyId ? { ...a, status: statusMap[rec.decision] } : a))
    const decisions = [rec, ...state.decisions.filter((d) => !(d.candidateId === rec.candidateId && d.vacancyId === rec.vacancyId && d.date.slice(0, 10) === rec.date.slice(0, 10)))]
    set({ ...state, decisions, applications: apps })
  },
  deleteDecision(id: string) {
    set({ ...state, decisions: state.decisions.filter((d) => d.id !== id) })
  },
  // interview lists
  saveInterviewList(l: InterviewList) {
    set({ ...state, interviewLists: [l, ...state.interviewLists.filter((x) => x.id !== l.id)] })
  },
  deleteInterviewList(id: string) {
    set({ ...state, interviewLists: state.interviewLists.filter((x) => x.id !== id) })
  },
  // kb
  saveKB(kb: KnowledgeBase) {
    set({ ...state, kb })
  },
}
