export type Lang = 'az' | 'en' | 'ru'
export type LText = string | { az: string; en: string; ru: string }
export type Role = 'hr' | 'candidate'
export type SkillCategory = 'technical' | 'soft' | 'tools' | 'domain'
export type DegreeKey = 'highschool' | 'college' | 'bachelor' | 'master' | 'phd'
export type DecisionKey = 'interview' | 'assess' | 'reserve' | 'low'
export type AppStatus = 'new' | 'review' | 'interview' | 'reserve' | 'rejected'
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote'
export type SeniorityKey = 'junior' | 'mid' | 'senior' | 'lead'
export type LangCode = 'az' | 'en' | 'ru' | 'tr' | 'de'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  candidateId?: string
}

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  description: LText
  level: number // typical expected level 1-5
  related: string[]
  aliases?: string[]
}

export interface CandidateSkill {
  skillId: string
  level: number
}
export interface ExperienceItem {
  id: string
  role: string
  company: string
  from: number
  to: number | null
  description: string
  skills: string[]
}
export interface EducationItem {
  id: string
  degree: DegreeKey
  field: string
  school: string
  year: number
}
export interface CertItem {
  id: string
  name: string
  issuer: string
  year: number
}
export interface LanguageItem {
  lang: LangCode
  level: number // 1..5 (A1..native)
}
export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  title: string
  summary: string
  hue: number
  skills: CandidateSkill[]
  experience: ExperienceItem[]
  education: EducationItem[]
  certificates: CertItem[]
  languages: LanguageItem[]
  github: { user: string; repos: number; stars: number; langs: string[] } | null
  portfolio: string
  cvFile?: string
  createdAt: string
}

export interface Requirement {
  skillId: string
  level: number
  mandatory: boolean
}
export interface Vacancy {
  id: string
  title: string
  company: string
  description: string
  type: JobType
  seniority: SeniorityKey
  location: string
  minExperience: number
  minEducation: DegreeKey
  fields: string[]
  requirements: Requirement[]
  certs: string[] // KB cert ids
  languages: LanguageItem[]
  status: 'active' | 'closed'
  createdAt: string
  salary: string
}
export interface Application {
  id: string
  candidateId: string
  vacancyId: string
  date: string
  status: AppStatus
}
export interface ExperienceLevel {
  id: SeniorityKey
  min: number
  max: number | null
  description: LText
}
export interface EducationCriterion {
  id: DegreeKey
  points: number
}
export interface KBCert {
  id: string
  name: string
  issuer: string
  skills: string[]
}
export interface DecisionRule {
  id: DecisionKey
  min: number
  enabled: boolean
}
export interface KnowledgeBase {
  experienceLevels: ExperienceLevel[]
  education: EducationCriterion[]
  certs: KBCert[]
  rules: DecisionRule[]
  weights: { technical: number; experience: number; education: number; soft: number; certs: number; languages: number }
}

export interface CriterionResult {
  key: 'technical' | 'experience' | 'education' | 'soft' | 'certs' | 'languages'
  score: number // 0-100
  weight: number
  weighted: number
  detail: string[]
}
export interface SkillGap {
  skillId: string
  required: number
  have: number
  mandatory: boolean
}
export interface RuleFired {
  id: string
  params: Record<string, string | number>
}
export interface MatchResult {
  candidateId: string
  vacancyId: string
  total: number
  criteria: CriterionResult[]
  strengths: { skillId: string; level: number }[]
  strongCriteria: string[]
  missing: SkillGap[]
  improve: SkillGap[]
  weakCriteria: string[]
  violations: SkillGap[]
  baseDecision: DecisionKey
  decision: DecisionKey
  rules: RuleFired[]
  retrieved: { skillId: string; required: number; mandatory: boolean; related: string[] }[]
}
export interface DecisionRecord {
  id: string
  candidateId: string
  vacancyId: string
  score: number
  decision: DecisionKey
  baseDecision: DecisionKey
  rules: RuleFired[]
  criteria: Record<string, number>
  violations: string[]
  date: string
  by: string
}
export interface InterviewList {
  id: string
  name: string
  candidateId: string
  vacancyId: string
  questions: { id: string; skillId: string; text: string }[]
  createdAt: string
}
export interface DB {
  version: number
  skills: Skill[]
  candidates: Candidate[]
  vacancies: Vacancy[]
  applications: Application[]
  decisions: DecisionRecord[]
  interviewLists: InterviewList[]
  kb: KnowledgeBase
}
