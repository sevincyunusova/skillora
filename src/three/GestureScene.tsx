import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** Mutable control surface shared by camera gestures and the mouse fallback */
export const gesture = { spread: 0.35, rotVel: 0, scaleTarget: 1, rotY: 0, rotX: 0.2 }

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

function Particles({ count, dark, reduce }: { count: number; dark: boolean; reduce: boolean }) {
  const pts = useRef<THREE.Points>(null)
  const core = useRef<THREE.Mesh>(null)
  const group = useRef<THREE.Group>(null)
  const scale = useRef(1)
  const spread = useRef(gesture.spread)
  const data = useMemo(() => {
    const home = new Float32Array(count * 3)
    const far = new Float32Array(count * 3)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const pal = [new THREE.Color('#D5E45A'), new THREE.Color('#747B50'), new THREE.Color('#82758F'), new THREE.Color('#EAEAE5')]
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random()
      const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1)
      const r = 1.5 + Math.random() * 0.35
      home.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3)
      const R = 2.6 + Math.random() * 3.4
      const th2 = Math.random() * Math.PI * 2, ph2 = Math.acos(2 * Math.random() - 1)
      far.set([R * Math.sin(ph2) * Math.cos(th2), R * Math.sin(ph2) * Math.sin(th2) * 0.8, R * Math.cos(ph2)], i * 3)
      pos.set([home[i * 3], home[i * 3 + 1], home[i * 3 + 2]], i * 3)
      const c = pal[i % pal.length]
      col.set([c.r, c.g, c.b], i * 3)
    }
    return { home, far, pos, col }
  }, [count])

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    const g = gesture
    spread.current += (g.spread - spread.current) * Math.min(1, dt * 4)
    scale.current += (g.scaleTarget - scale.current) * Math.min(1, dt * 4)
    g.rotY += g.rotVel * dt
    g.rotVel *= Math.pow(0.04, dt) // inertia
    if (!reduce) g.rotY += dt * 0.12
    if (group.current) { group.current.rotation.y = g.rotY; group.current.rotation.x = g.rotX; group.current.scale.setScalar(scale.current) }
    if (core.current) { core.current.rotation.x = t * 0.2; core.current.rotation.z = t * 0.13; core.current.scale.setScalar(1 - spread.current * 0.25) }
    const p = data.pos
    const sp = spread.current
    for (let i = 0; i < count; i++) {
      const k = i * 3
      const wob = reduce ? 0 : Math.sin(t * 0.8 + i) * 0.04
      const tx = data.home[k] + (data.far[k] - data.home[k]) * sp + wob
      const ty = data.home[k + 1] + (data.far[k + 1] - data.home[k + 1]) * sp + wob
      const tz = data.home[k + 2] + (data.far[k + 2] - data.home[k + 2]) * sp
      p[k] += (tx - p[k]) * Math.min(1, dt * 5)
      p[k + 1] += (ty - p[k + 1]) * Math.min(1, dt * 5)
      p[k + 2] += (tz - p[k + 2]) * Math.min(1, dt * 5)
    }
    if (pts.current) (pts.current.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshPhysicalMaterial color="#D5E45A" roughness={0.08} metalness={0.1} clearcoat={1} flatShading transparent opacity={0.85} envMapIntensity={1.5} />
      </mesh>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={dark ? 0.95 : 0.9} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}

export default function GestureCanvas({ dark, mobile, reduce }: { dark: boolean; mobile: boolean; reduce: boolean }) {
  return (
    <Canvas dpr={[1, mobile ? 1.25 : 1.75]} camera={{ fov: 42, position: [0, 0, 8] }} gl={{ antialias: !mobile, alpha: true }}>
      <Env />
      <ambientLight intensity={dark ? 0.6 : 0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.5} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#D5E45A" />
      <pointLight position={[4, 2, -2]} intensity={24} color="#82758F" />
      <Particles count={mobile ? 700 : 1800} dark={dark} reduce={reduce} />
    </Canvas>
  )
}
