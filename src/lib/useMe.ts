import { useAuth, useDB } from './store'
import type { Candidate } from './types'

export function useMe(): Candidate | undefined {
  const user = useAuth()
  const db = useDB()
  return db.candidates.find((c) => c.id === user?.candidateId)
}

export function completeness(c: Candidate) {
  const items: [string, boolean][] = [
    ['name', c.name.trim().length > 1],
    ['title', !!c.title.trim()],
    ['contact', !!c.phone.trim() && !!c.location.trim()],
    ['summary', c.summary.trim().length >= 30],
    ['skills', c.skills.length >= 5],
    ['soft', c.skills.length > 0 && c.skills.some((s) => ['comm', 'team', 'lead', 'problem', 'time', 'adapt', 'creative'].includes(s.skillId))],
    ['experience', c.experience.length >= 1],
    ['education', c.education.length >= 1],
    ['certs', c.certificates.length >= 1],
    ['languages', c.languages.length >= 2],
    ['links', !!c.portfolio || !!c.github],
    ['cv', !!c.cvFile],
  ]
  const done = items.filter((i) => i[1]).length
  return { items, percent: Math.round((done / items.length) * 100) }
}
