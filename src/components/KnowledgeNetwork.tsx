import { useEffect, useMemo, useRef, useState } from 'react'
import type { Skill, SkillCategory } from '../lib/types'
import { useI18n } from '../i18n'

interface N { id: string; x: number; y: number; vx: number; vy: number; skill: Skill; fixed?: boolean }
const W = 860
const H = 540
const COLOR: Record<SkillCategory, string> = { technical: '#747B50', soft: '#82758F', tools: '#B9C63A', domain: '#A8895C' }
const CENTER: Record<SkillCategory, [number, number]> = { technical: [W * 0.33, H * 0.42], tools: [W * 0.7, H * 0.3], domain: [W * 0.72, H * 0.72], soft: [W * 0.26, H * 0.8] }

export default function KnowledgeNetwork({ skills, selected, onSelect }: { skills: Skill[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const { t } = useI18n()
  const [, tick] = useState(0)
  const nodes = useRef<N[]>([])
  const raf = useRef(0)
  const drag = useRef<string | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const alpha = useRef(1)
  const stepRef = useRef<() => void>()
  const kick = () => { cancelAnimationFrame(raf.current); alpha.current = Math.max(alpha.current, 0.4); if (stepRef.current) raf.current = requestAnimationFrame(stepRef.current) }
  const [hover, setHover] = useState<string | null>(null)

  const links = useMemo(() => {
    const set = new Set<string>()
    const out: [string, string][] = []
    const ids = new Set(skills.map((s) => s.id))
    for (const s of skills) for (const r of s.related) {
      if (!ids.has(r)) continue
      const k = s.id < r ? `${s.id}|${r}` : `${r}|${s.id}`
      if (!set.has(k)) { set.add(k); out.push([s.id, r]) }
    }
    return out
  }, [skills])

  useEffect(() => {
    const old = new Map(nodes.current.map((n) => [n.id, n]))
    nodes.current = skills.map((s, i) => old.get(s.id) ? { ...old.get(s.id)!, skill: s } : { id: s.id, skill: s, x: CENTER[s.category][0] + Math.cos(i) * 60, y: CENTER[s.category][1] + Math.sin(i * 1.7) * 60, vx: 0, vy: 0 })
    alpha.current = 1
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const step = () => {
      const ns = nodes.current
      const a = alpha.current
      const byId = new Map(ns.map((n) => [n.id, n]))
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y
          const d2 = Math.max(120, dx * dx + dy * dy)
          const f = (7000 / d2) * a
          const d = Math.sqrt(d2)
          ns[i].vx -= (dx / d) * f; ns[i].vy -= (dy / d) * f; ns[j].vx += (dx / d) * f; ns[j].vy += (dy / d) * f
        }
      }
      for (const [s, r] of links) {
        const A = byId.get(s), B = byId.get(r)
        if (!A || !B) continue
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (d - 85) * 0.01 * a
        A.vx += (dx / d) * f; A.vy += (dy / d) * f; B.vx -= (dx / d) * f; B.vy -= (dy / d) * f
      }
      for (const n of ns) {
        const c = CENTER[n.skill.category]
        n.vx += (c[0] - n.x) * 0.0028 * a; n.vy += (c[1] - n.y) * 0.0028 * a
        if (!n.fixed) { n.x += n.vx; n.y += n.vy }
        n.vx *= 0.82; n.vy *= 0.82
        n.x = Math.min(W - 40, Math.max(40, n.x)); n.y = Math.min(H - 30, Math.max(30, n.y))
      }
      alpha.current = Math.max(drag.current ? 0.3 : 0.02, alpha.current * 0.985)
      tick((x) => x + 1)
      if (alpha.current > 0.03 || drag.current) raf.current = requestAnimationFrame(step)
    }
    stepRef.current = step
    if (reduce) alpha.current = 0.2
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [skills, links])

  const pt = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H] as const
  }
  const focus = selected ?? hover
  const nb = new Set<string>()
  if (focus) { const s = skills.find((x) => x.id === focus); s?.related.forEach((r) => nb.add(r)); skills.forEach((x) => x.related.includes(focus) && nb.add(x.id)) }
  const pos = new Map(nodes.current.map((n) => [n.id, n]))

  return (
    <div className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none rounded-2xl" role="img" aria-label={t('kb.networkAria')}
        onPointerMove={(e) => { if (!drag.current) return; const n = nodes.current.find((x) => x.id === drag.current); if (n) { const [x, y] = pt(e); n.x = x; n.y = y; kick() } }}
        onPointerUp={() => { const n = nodes.current.find((x) => x.id === drag.current); if (n) n.fixed = false; drag.current = null }}
        onPointerLeave={() => { drag.current = null }}
        onClick={(e) => { if (e.target === svg.current) onSelect(null) }}>
        {(Object.keys(CENTER) as SkillCategory[]).map((c) => <g key={c}><circle cx={CENTER[c][0]} cy={CENTER[c][1]} r={110} fill={COLOR[c]} opacity={0.07} /><text x={CENTER[c][0]} y={CENTER[c][1] - 118} textAnchor="middle" className="fill-mute" style={{ font: '500 10px "JetBrains Mono"', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{t(`cat.${c}`)}</text></g>)}
        {links.map(([a, b]) => { const A = pos.get(a), B = pos.get(b); if (!A || !B) return null; const hot = focus && (a === focus || b === focus); return <line key={`${a}${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={hot ? 'rgb(var(--ink))' : 'rgb(var(--line))'} strokeWidth={hot ? 1.8 : 1} opacity={focus && !hot ? 0.35 : 1} /> })}
        {nodes.current.map((n) => {
          const dim = focus && n.id !== focus && !nb.has(n.id)
          const sel = n.id === selected
          const r = 9 + n.skill.level * 1.8
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`} opacity={dim ? 0.25 : 1} style={{ cursor: 'grab', transition: 'opacity .2s' }}
              onPointerDown={(e) => { e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = n.id; n.fixed = true; kick() }}
              onClick={(e) => { e.stopPropagation(); onSelect(n.id === selected ? null : n.id) }}
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} tabIndex={0} role="button" aria-label={n.skill.name}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(n.id === selected ? null : n.id) } }}>
              {sel && <circle r={r + 8} fill="none" stroke="rgb(var(--accent))" strokeWidth={3} />}
              <polygon points={`0,${-r} ${r * 0.87},${-r / 2} ${r * 0.87},${r / 2} 0,${r} ${-r * 0.87},${r / 2} ${-r * 0.87},${-r / 2}`} fill={COLOR[n.skill.category]} stroke="rgb(var(--bg))" strokeWidth={2} />
              <text y={r + 14} textAnchor="middle" className="fill-ink" style={{ font: '600 11px "Hanken Grotesk"', pointerEvents: 'none' }}>{n.skill.name}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
