import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Hand, HandMetal, Move, Pointer, Maximize2, Info, Loader2, MousePointer2 } from 'lucide-react'
import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { useReducedMotion } from 'framer-motion'
import { useI18n } from '../i18n'
import { useTheme } from '../lib/theme'
import { Btn, PageHeader, useIsMobile } from '../components/ui'
import { gesture } from '../three/GestureScene'

const GestureCanvas = lazy(() => import('../three/GestureScene'))
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

let connections: { start: number; end: number }[] = []
type Cam = 'off' | 'starting' | 'loading' | 'active' | 'denied' | 'unsupported' | 'error'
type G = 'none' | 'open' | 'fist' | 'pinch' | 'point'

const d = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.5)

function analyze(lm: NormalizedLandmark[]): { g: G; pinch: number } {
  const palm = d(lm[0], lm[9]) || 1
  const ext = (tip: number, pip: number) => d(lm[tip], lm[0]) > d(lm[pip], lm[0]) * 1.1
  const idx = ext(8, 6), mid = ext(12, 10), ring = ext(16, 14), pnk = ext(20, 18)
  const pinch = d(lm[4], lm[8]) / palm
  const others = [mid, ring, pnk].filter(Boolean).length
  if (pinch < 0.5 && others >= 2) return { g: 'pinch', pinch }
  if (idx && mid && ring && pnk) return { g: 'open', pinch }
  if (!idx && !mid && !ring && !pnk) return { g: 'fist', pinch }
  if (idx && others === 0) return { g: 'point', pinch }
  return { g: 'none', pinch }
}

export default function GestureLab() {
  const { t } = useI18n()
  const { theme } = useTheme()
  const mobile = useIsMobile()
  const reduce = !!useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)
  const overlay = useRef<HTMLCanvasElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const lm = useRef<HandLandmarker | null>(null)
  const raf = useRef(0)
  const prev = useRef<{ x: number; t: number } | null>(null)
  const velSm = useRef(0)
  const swipeAt = useRef(0)
  const [cam, setCam] = useState<Cam>('off')
  const [g, setG] = useState<G>('none')
  const [hand, setHand] = useState(false)
  const [swipe, setSwipe] = useState<'' | 'left' | 'right'>('')
  const [scaleUi, setScaleUi] = useState(1)
  const lastUi = useRef(0)
  const lastG = useRef<G>('none')

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((tr) => tr.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    const c = overlay.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    prev.current = null
    setHand(false); setG('none'); setCam((s) => (s === 'active' || s === 'starting' || s === 'loading' ? 'off' : s))
  }, [])
  useEffect(() => () => { stop(); lm.current?.close(); lm.current = null; gesture.spread = 0.35; gesture.scaleTarget = 1; gesture.rotVel = 0 }, [stop])

  const loop = useCallback(() => {
    const v = video.current, l = lm.current
    if (!v || !l || !stream.current) return
    if (v.readyState >= 2) {
      const now = performance.now()
      const res = l.detectForVideo(v, now)
      const c = overlay.current
      const ctx = c?.getContext('2d')
      if (c && ctx) {
        if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight }
        ctx.clearRect(0, 0, c.width, c.height)
      }
      const pts = res.landmarks?.[0]
      if (pts) {
        if (ctx && c) {
          ctx.strokeStyle = 'rgba(213,228,90,.85)'; ctx.lineWidth = 2
          for (const conn of connections) { ctx.beginPath(); ctx.moveTo(pts[conn.start].x * c.width, pts[conn.start].y * c.height); ctx.lineTo(pts[conn.end].x * c.width, pts[conn.end].y * c.height); ctx.stroke() }
          ctx.fillStyle = '#F7F7F2'
          for (const p of pts) { ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, 3.2, 0, 7); ctx.fill() }
        }
        const { g: gg, pinch } = analyze(pts)
        // open hand spreads, fist gathers
        if (gg === 'open') gesture.spread = 1
        else if (gg === 'fist') gesture.spread = 0
        // closer fingers => larger object
        if (gg === 'pinch') gesture.scaleTarget = 1 + (1 - Math.min(1, Math.max(0, (pinch - 0.08) / 0.42))) * 1.4
        else gesture.scaleTarget += (1 - gesture.scaleTarget) * 0.04
        // horizontal swipe => rotation
        const x = 1 - pts[0].x
        if (prev.current) {
          const dt = Math.max(0.001, (now - prev.current.t) / 1000)
          velSm.current = velSm.current * 0.6 + ((x - prev.current.x) / dt) * 0.4
          if (Math.abs(velSm.current) > 0.45) {
            gesture.rotVel = Math.max(-9, Math.min(9, gesture.rotVel + velSm.current * 0.9))
            if (now - swipeAt.current > 700) { swipeAt.current = now; setSwipe(velSm.current > 0 ? 'right' : 'left'); setTimeout(() => setSwipe(''), 650) }
          }
        }
        prev.current = { x, t: now }
        if (lastG.current !== gg) { lastG.current = gg; setG(gg) }
        setHand(true)
        if (now - lastUi.current > 120) { lastUi.current = now; setScaleUi(gesture.scaleTarget) }
      } else {
        prev.current = null
        if (lastG.current !== 'none') { lastG.current = 'none'; setG('none') }
        setHand(false)
      }
    }
    raf.current = requestAnimationFrame(loop)
  }, [])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCam('unsupported'); return }
    setCam('starting')
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
    } catch (e) {
      const name = (e as DOMException)?.name
      setCam(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' ? 'unsupported' : 'error')
      return
    }
    try {
      if (video.current) { video.current.srcObject = stream.current; await video.current.play() }
      setCam('loading')
      if (!lm.current) {
        const mp = await import('@mediapipe/tasks-vision')
        connections = mp.HandLandmarker.HAND_CONNECTIONS
        const fs = await mp.FilesetResolver.forVisionTasks('/mediapipe')
        const make = (delegate: 'GPU' | 'CPU') => mp.HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'VIDEO', numHands: 1 })
        try { lm.current = await make('GPU') } catch { lm.current = await make('CPU') }
      }
      setCam('active')
      raf.current = requestAnimationFrame(loop)
    } catch (e) {
      console.error(e)
      stream.current?.getTracks().forEach((tr) => tr.stop()); stream.current = null
      setCam('error')
    }
  }

  // mouse fallback — always available, works alongside the camera
  const drag = useRef<{ x: number; y: number } | null>(null)
  const gestures: { id: G; icon: typeof Hand; key: string }[] = [
    { id: 'open', icon: Hand, key: 'open' }, { id: 'fist', icon: HandMetal, key: 'fist' }, { id: 'pinch', icon: Pointer, key: 'pinch' },
  ]
  const camMsg: Partial<Record<Cam, string>> = { denied: 'gl.denied', unsupported: 'gl.unsupported', error: 'gl.error' }
  const running = cam === 'active' || cam === 'loading' || cam === 'starting'

  return (
    <div>
      <PageHeader eyebrow={t('nav.gesture')} title={t('gl.title')} desc={t('gl.desc')} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card relative overflow-hidden">
          <div className="relative h-[420px] touch-none select-none md:h-[560px]" style={{ cursor: 'grab' }}
            onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (!drag.current) return; const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; drag.current = { x: e.clientX, y: e.clientY }; gesture.rotVel = gesture.rotVel * 0.5 + dx * 0.06; gesture.rotX = Math.max(-0.9, Math.min(0.9, gesture.rotX + dy * 0.005)) }}
            onPointerUp={() => { drag.current = null }}
            onWheel={(e) => { gesture.scaleTarget = Math.max(0.5, Math.min(2.4, gesture.scaleTarget - e.deltaY * 0.0012)); setScaleUi(gesture.scaleTarget) }}>
            <div className="hairgrid pointer-events-none absolute inset-0 opacity-30" />
            <Suspense fallback={<div className="grid h-full place-items-center"><Loader2 className="animate-spin text-brand" /></div>}><GestureCanvas dark={theme === 'dark'} mobile={mobile} reduce={reduce} /></Suspense>
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-line bg-bg/80 px-3 py-1 font-mono text-[11px] uppercase backdrop-blur">{t('gl.status')}: <b className={g === 'none' ? 'text-mute' : 'text-brand'}>{running ? (hand ? t(`gl.g.${g}`) : t('gl.noHand')) : t('gl.mouseMode')}</b></span>
              {swipe && <span className="rounded-full bg-accent px-3 py-1 font-mono text-[11px] font-bold uppercase text-accent-ink">{t(`gl.swipe.${swipe}`)}</span>}
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-mute"><span className="inline-flex items-center gap-1.5"><MousePointer2 size={13} />{t('gl.mouseHint')}</span><span className="font-mono">×{scaleUi.toFixed(2)}</span></div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">{t('gl.camera')}</h2>
              {running ? <Btn variant="dark" size="sm" onClick={stop}><CameraOff size={14} />{t('gl.stop')}</Btn> : <Btn size="sm" onClick={start}><Camera size={14} />{t('gl.start')}</Btn>}</div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink">
              <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${cam === 'active' || cam === 'loading' ? '' : 'invisible'}`} />
              <canvas ref={overlay} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
              {!running && <div className="absolute inset-0 grid place-items-center p-6 text-center text-bg/70"><div><CameraOff className="mx-auto mb-2" />{camMsg[cam] ? <p className="text-sm text-bg">{t(camMsg[cam]!)}</p> : <p className="text-sm">{t('gl.camOff')}</p>}</div></div>}
              {(cam === 'loading' || cam === 'starting') && <div className="absolute inset-0 grid place-items-center bg-ink/70 text-bg"><div className="text-center"><Loader2 className="mx-auto mb-2 animate-spin" /><p className="text-sm">{t(cam === 'starting' ? 'gl.permission' : 'gl.loadingModel')}</p></div></div>}
            </div>
            {camMsg[cam] && <div className="mt-3 flex gap-2 rounded-xl border border-violet/40 bg-violet/10 p-3 text-xs"><Info size={15} className="mt-0.5 shrink-0" />{t('gl.fallback')}</div>}
            <p className="mt-3 text-xs text-mute">{t('gl.privacy')}</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg font-bold">{t('gl.gestures')}</h2>
            <ul className="space-y-2">
              {gestures.map(({ id, icon: I, key }) => <li key={id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${g === id && hand ? 'border-accent bg-accent/30' : 'border-line'}`}><I size={18} className="shrink-0 text-brand" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{t(`gl.g.${key}`)}</p><p className="text-xs text-mute">{t(`gl.g.${key}.d`)}</p></div></li>)}
              <li className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${swipe ? 'border-accent bg-accent/30' : 'border-line'}`}><Move size={18} className="shrink-0 text-brand" /><div><p className="text-sm font-semibold">{t('gl.g.swipe')}</p><p className="text-xs text-mute">{t('gl.g.swipe.d')}</p></div></li>
            </ul>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">{t('gl.mouseControls')}</h2>
            <div className="flex flex-wrap gap-2"><Btn variant="ghost" size="sm" onClick={() => { gesture.spread = 1 }}><Hand size={14} />{t('gl.spread')}</Btn><Btn variant="ghost" size="sm" onClick={() => { gesture.spread = 0 }}><HandMetal size={14} />{t('gl.gather')}</Btn><Btn variant="ghost" size="sm" onClick={() => { gesture.rotVel += 6 }}><Move size={14} />{t('gl.spin')}</Btn></div>
            <div><label className="label flex justify-between"><span className="inline-flex items-center gap-1.5"><Maximize2 size={13} />{t('gl.size')}</span><b className="text-ink">×{scaleUi.toFixed(2)}</b></label><input type="range" min={0.5} max={2.4} step={0.05} value={scaleUi} onChange={(e) => { gesture.scaleTarget = +e.target.value; setScaleUi(+e.target.value) }} className="w-full accent-[rgb(var(--brand))]" aria-label={t('gl.size')} /></div>
          </section>
        </div>
      </div>
    </div>
  )
}
