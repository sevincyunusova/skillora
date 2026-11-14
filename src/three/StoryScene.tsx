import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** Shared, mutable story state — written by GSAP ScrollTrigger, read every frame by the scene */
export const story = { s: 0, px: 0, py: 0 }

const STAGES = 5
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const smooth = (x: number) => x * x * (3 - 2 * x)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

const PAL = {
  olive: new THREE.Color('#747B50'),
  acid: new THREE.Color('#D5E45A'),
  violet: new THREE.Color('#82758F'),
  charcoal: new THREE.Color('#20221F'),
  soft: new THREE.Color('#EAEAE5'),
}

interface Layouts { pos: Float32Array[]; col: Float32Array[]; sizes: Float32Array; edges: number[][] }

function fib(i: number, n: number) {
  const y = 1 - (i / (n - 1)) * 2
  const r = Math.sqrt(1 - y * y)
  const th = Math.PI * (3 - Math.sqrt(5)) * i
  return new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
}

function nearestEdges(p: Float32Array, n: number, k: number, maxLen = Infinity) {
  const set = new Set<string>()
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const d: [number, number][] = []
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const dx = p[i * 3] - p[j * 3], dy = p[i * 3 + 1] - p[j * 3 + 1], dz = p[i * 3 + 2] - p[j * 3 + 2]
      d.push([dx * dx + dy * dy + dz * dz, j])
    }
    d.sort((a, b) => a[0] - b[0])
    for (let m = 0; m < k; m++) {
      const j = d[m][1]
      if (d[m][0] > maxLen * maxLen) continue
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!set.has(key)) { set.add(key); out.push(i, j) }
    }
  }
  return out
}

function buildLayouts(n: number): Layouts {
  const r = rng(7)
  const pos = Array.from({ length: STAGES }, () => new Float32Array(n * 3))
  const col = Array.from({ length: STAGES }, () => new Float32Array(n * 3))
  const sizes = new Float32Array(n)
  const put = (arr: Float32Array, i: number, v: THREE.Vector3) => { arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z }
  const putc = (arr: Float32Array, i: number, c: THREE.Color) => { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b }
  const mix3 = [PAL.olive, PAL.acid, PAL.violet]

  for (let i = 0; i < n; i++) {
    sizes[i] = 0.7 + r() * 0.9
    const dir = fib(i, n)
    // 0 — abstract brain-like crystal (two lobes, central fissure, bumps)
    const lobe = Math.sign(dir.x) || 1
    const bump = 1 + 0.1 * Math.sin(dir.x * 6 + dir.y * 4) * Math.cos(dir.z * 5)
    const a = new THREE.Vector3(dir.x * 1.5 + lobe * 0.16, dir.y * 1.15, dir.z * 1.3).multiplyScalar(bump * 1.25)
    put(pos[0], i, a)
    // 1 — exploded shards
    const ex = dir.clone().multiplyScalar(2.4 + r() * 1.5)
    ex.y *= 0.8
    ex.add(new THREE.Vector3((r() - 0.5) * 1.6, (r() - 0.5) * 1.6, (r() - 0.5) * 1.6))
    put(pos[1], i, ex)
    // 2 — knowledge network: three clusters
    const cluster = i % 3
    const centers = [new THREE.Vector3(-2.3, 1.0, 0), new THREE.Vector3(2.2, 1.1, -0.6), new THREE.Vector3(0, -2.0, 0.5)]
    const jitter = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(0.35 + r() * 1.15)
    put(pos[2], i, centers[cluster].clone().add(jitter))
    // 3 — matching: candidate cluster vs vacancy cluster
    const half = i < n / 2
    const base = new THREE.Vector3(half ? -2.9 : 2.9, 0, 0)
    const j3 = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(0.4 + r() * 1.3)
    j3.x *= 0.7
    put(pos[3], i, base.add(j3))
    // 4 — decision gem (octahedral crystal)
    const l1 = Math.abs(dir.x) + Math.abs(dir.y) + Math.abs(dir.z) || 1
    put(pos[4], i, new THREE.Vector3(dir.x / l1, (dir.y / l1) * 1.35, dir.z / l1).multiplyScalar(2.15))

    putc(col[0], i, mix3[i % 3].clone().lerp(PAL.soft, 0.1))
    putc(col[1], i, mix3[(i + 1) % 3])
    putc(col[2], i, [PAL.olive, PAL.violet, PAL.acid][cluster])
    putc(col[3], i, half ? PAL.violet : PAL.acid)
    putc(col[4], i, i % 5 === 0 ? PAL.acid : i % 5 === 1 ? PAL.violet : PAL.olive)
  }

  const edges: number[][] = [
    nearestEdges(pos[0], n, 2),
    nearestEdges(pos[2], n, 2, 2.2),
    (() => {
      const e = nearestEdges(pos[3], n, 1, 1.6)
      for (let i = 0; i < n / 2; i++) if (i % 4 !== 3) e.push(i, i + n / 2)
      return e
    })(),
    nearestEdges(pos[4], n, 3),
  ]
  return { pos, col, sizes, edges }
}

const GROUP_X = [2.2, -2.3, 2.3, 0, -2.3]
const GROUP_S = [1, 1, 1, 1, 1.05]
const GROUP_Y = [0, 0, 0, 0.95, 0]
const CAM_Z = [9, 9.5, 10, 10.8, 9.5]

function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = pm.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = env.texture
    return () => { scene.environment = null; env.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}

function Story({ mobile, reduce, dark }: { mobile: boolean; reduce: boolean; dark: boolean }) {
  const n = mobile ? 34 : 64
  const L = useMemo(() => buildLayouts(n), [n])
  const group = useRef<THREE.Group>(null)
  const inst = useRef<THREE.InstancedMesh>(null)
  const core = useRef<THREE.Mesh>(null)
  const wire = useRef<THREE.LineSegments>(null)
  const dust = useRef<THREE.Points>(null)
  const lineRefs = useRef<(THREE.LineSegments | null)[]>([])
  const cur = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmpC = useMemo(() => new THREE.Color(), [])
  const nodeP = useMemo(() => new Float32Array(n * 3), [n])

  const lineGeos = useMemo(() => L.edges.map((e) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(e.length * 3), 3))
    return g
  }), [L])
  const dustPos = useMemo(() => {
    const r = rng(21)
    const c = mobile ? 120 : 280
    const a = new Float32Array(c * 3)
    for (let i = 0; i < c; i++) {
      const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(4 + r() * 6)
      a[i * 3] = v.x; a[i * 3 + 1] = v.y * 0.8; a[i * 3 + 2] = v.z - 1
    }
    return a
  }, [mobile])
  const coreEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.0, 1)), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const target = story.s
    cur.current = reduce ? target : cur.current + (target - cur.current) * Math.min(1, dt * 3.2)
    const s = Math.min(STAGES - 1 - 1e-4, Math.max(0, cur.current))
    const i = Math.floor(s)
    const f = smooth(s - i)

    mouse.current.x += (story.px - mouse.current.x) * 0.06
    mouse.current.y += (story.py - mouse.current.y) * 0.06

    // global group placement
    const g = group.current
    if (g) {
      const lerpArr = (arr: number[]) => arr[i] + (arr[i + 1] - arr[i]) * f
      const k = Math.min(1, state.viewport.aspect / 1.75)
      const gx = mobile ? 0 : lerpArr(GROUP_X) * k
      const gs = lerpArr(GROUP_S) * (mobile ? 0.7 : 0.72 + 0.28 * k)
      g.position.x = gx
      g.position.y = (mobile ? 0.6 : 0) + lerpArr(GROUP_Y)
      g.scale.setScalar(gs)
      const idle = reduce ? 0 : t * 0.12
      g.rotation.y = idle + mouse.current.x * 0.5 + (s * 0.35)
      g.rotation.x = mouse.current.y * -0.3 + Math.sin(t * 0.2) * (reduce ? 0 : 0.06)
      const cz = lerpArr(CAM_Z)
      state.camera.position.z += (cz - state.camera.position.z) * 0.08
    }

    // nodes
    const m = inst.current
    if (m) {
      const A = L.pos[i], B = L.pos[i + 1]
      const CA = L.col[i], CB = L.col[i + 1]
      const wob = reduce ? 0 : 0.06 + 0.1 * Math.sin(s * Math.PI) // stronger drift mid-transition
      for (let k = 0; k < n; k++) {
        const x = A[k * 3] + (B[k * 3] - A[k * 3]) * f
        const y = A[k * 3 + 1] + (B[k * 3 + 1] - A[k * 3 + 1]) * f
        const z = A[k * 3 + 2] + (B[k * 3 + 2] - A[k * 3 + 2]) * f
        const px = x + Math.sin(t * 0.7 + k * 1.7) * wob
        const py = y + Math.cos(t * 0.6 + k * 2.3) * wob
        const pz = z + Math.sin(t * 0.5 + k * 0.9) * wob
        nodeP[k * 3] = px; nodeP[k * 3 + 1] = py; nodeP[k * 3 + 2] = pz
        dummy.position.set(px, py, pz)
        const spin = reduce ? 0 : t * 0.4
        dummy.rotation.set(k * 0.7 + spin * 0.6 + s * 1.2, k * 1.3 + spin, k * 0.4)
        // shards are bigger while exploded, small & fine in the network
        const sc = L.sizes[k] * (0.9 + 0.5 * Math.sin(s * Math.PI * 0.5)) * (1 + 0.35 * Math.max(0, 1 - Math.abs(s - 3)))
        dummy.scale.setScalar(sc)
        dummy.updateMatrix()
        m.setMatrixAt(k, dummy.matrix)
        tmpC.setRGB(CA[k * 3] + (CB[k * 3] - CA[k * 3]) * f, CA[k * 3 + 1] + (CB[k * 3 + 1] - CA[k * 3 + 1]) * f, CA[k * 3 + 2] + (CB[k * 3 + 2] - CA[k * 3 + 2]) * f)
        m.setColorAt(k, tmpC)
      }
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }

    // connection lines
    const peaks = [0, 2, 3, 4]
    const peak = [0.55, 0.6, 0.75, 0.6]
    L.edges.forEach((e, idx) => {
      const ls = lineRefs.current[idx]
      if (!ls) return
      const attr = lineGeos[idx].getAttribute('position') as THREE.BufferAttribute
      for (let q = 0; q < e.length; q++) {
        attr.array[q * 3] = nodeP[e[q] * 3]
        attr.array[q * 3 + 1] = nodeP[e[q] * 3 + 1]
        attr.array[q * 3 + 2] = nodeP[e[q] * 3 + 2]
      }
      attr.needsUpdate = true
      const reach = idx === 0 ? 1.5 : 1.0
      const o = peak[idx] * clamp01(1 - Math.abs(cur.current - peaks[idx]) / reach)
      ;(ls.material as THREE.LineBasicMaterial).opacity = o
      ls.visible = o > 0.01
    })

    // core crystal: visible at start and returns as the decision gem
    const c = core.current
    if (c) {
      const a = 1 - smooth(clamp01((cur.current - 0.1) / 0.9))
      const b = smooth(clamp01((cur.current - 3.3) / 0.7))
      const sc = Math.max(a * 1.0, b * 0.62)
      c.scale.setScalar(Math.max(0.0001, sc))
      c.visible = sc > 0.01
      c.rotation.y = reduce ? 0 : t * 0.25
      c.rotation.x = reduce ? 0 : t * 0.15
      const mat = c.material as THREE.MeshPhysicalMaterial
      mat.color.copy(PAL.olive).lerp(PAL.acid, b)
      if (wire.current) {
        wire.current.scale.copy(c.scale).multiplyScalar(1.003)
        wire.current.rotation.copy(c.rotation)
        wire.current.visible = c.visible
      }
    }
    if (dust.current && !reduce) {
      dust.current.rotation.y = t * 0.02
      dust.current.rotation.x = Math.sin(t * 0.05) * 0.1
    }
  })

  const lineColor = dark ? '#D5E45A' : '#20221F'

  return (
    <>
      <Env />
      <ambientLight intensity={dark ? 0.5 : 0.8} />
      <directionalLight position={[3, 5, 6]} intensity={dark ? 1.4 : 1.7} color="#fff6e0" />
      <pointLight position={[-5, -2, 3]} intensity={dark ? 40 : 28} color="#D5E45A" />
      <pointLight position={[5, -3, -2]} intensity={dark ? 36 : 22} color="#82758F" />
      <group ref={group}>
        <instancedMesh ref={inst} args={[undefined, undefined, n]} frustumCulled={false}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshPhysicalMaterial roughness={0.18} metalness={0.1} clearcoat={1} clearcoatRoughness={0.1} flatShading transparent opacity={0.94} envMapIntensity={1.2} />
        </instancedMesh>
        {L.edges.map((_, idx) => (
          <lineSegments key={idx} ref={(el) => { lineRefs.current[idx] = el }} geometry={lineGeos[idx]} frustumCulled={false}>
            <lineBasicMaterial color={lineColor} transparent opacity={0} depthWrite={false} />
          </lineSegments>
        ))}
        <mesh ref={core}>
          <icosahedronGeometry args={[1.0, 1]} />
          <meshPhysicalMaterial color="#747B50" roughness={0.05} metalness={0.05} transparent opacity={0.55} flatShading clearcoat={1} envMapIntensity={1.6} />
        </mesh>
        <lineSegments ref={wire} geometry={coreEdges}>
          <lineBasicMaterial color={dark ? '#F7F7F2' : '#20221F'} transparent opacity={0.35} />
        </lineSegments>
      </group>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={mobile ? 0.04 : 0.035} color={dark ? '#D5E45A' : '#747B50'} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}

export default function StoryCanvas({ active, dark, mobile, reduce }: { active: boolean; dark: boolean; mobile: boolean; reduce: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, mobile ? 1.25 : 1.8]}
      camera={{ fov: 38, position: [0, 0, 9], near: 0.1, far: 60 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Story mobile={mobile} reduce={reduce} dark={dark} />
    </Canvas>
  )
}
