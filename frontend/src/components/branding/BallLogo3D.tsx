'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Color palette ─── */
const GOLD      = new THREE.Color('#D4A520');
const GOLD_LIT  = new THREE.Color('#F0C850');
const DARK      = new THREE.Color('#0A0E1A');
const DARK_RED  = new THREE.Color('#1A0808');
const RED       = new THREE.Color('#D52B1E');
const WHITE     = new THREE.Color('#F5F6FA');
const NAVY      = new THREE.Color('#0038A8');
const GLOW_BASE = new THREE.Color('#D4A520');
const GLOW_HOVER= new THREE.Color('#D52B1E');

/* ─── Helpers ─── */
function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}

function makeLeatherBump(size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2;
    const v = 100 + Math.random() * 55;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* ─── Ball mesh (inside Canvas) ─── */
function Ball({ hovered }: { hovered: boolean }) {
  const group = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  /* Geometry — icosahedron detail 1 = 80 triangular faces */
  const { geo, wireGeo, faceMaterials } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const count = g.getAttribute('position').count / 3;

    /* Build wireframe edges from unique edges */
    const pos = g.getAttribute('position');
    const edgeSet = new Set<string>();
    const edgeVerts: number[] = [];
    for (let i = 0; i < count; i++) {
      const tri = [pos.getX(i*3), pos.getY(i*3), pos.getZ(i*3),
                   pos.getX(i*3+1), pos.getY(i*3+1), pos.getZ(i*3+1),
                   pos.getX(i*3+2), pos.getY(i*3+2), pos.getZ(i*3+2)];
      for (let e = 0; e < 3; e++) {
        const a = tri.slice(e*3, e*3+3);
        const b = tri.slice(((e+1)%3)*3, ((e+1)%3)*3+3);
        const key = [a,b].map(v => v.map(n => n.toFixed(3)).join(',')).sort().join('|');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgeVerts.push(...a, ...b);
        }
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));

    /* Face materials — original 20 faces (pentagons) = dark, rest = gold */
    const mats: THREE.MeshStandardMaterial[] = [];
    const darkMat = new THREE.MeshStandardMaterial({
      color: DARK, roughness: 0.85, metalness: 0.05,
      bumpMap: makeLeatherBump(), bumpScale: 0.03,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: GOLD, roughness: 0.25, metalness: 0.85,
      envMapIntensity: 1.2,
    });
    for (let i = 0; i < count; i++) {
      mats.push(i < 20 ? darkMat.clone() : goldMat.clone());
    }

    return { geo: g, wireGeo: wg, faceMaterials: mats };
  }, []);

  /* Hover color transition */
  useFrame((_, delta) => {
    t.current += delta * 2.8;
    const tClamped = Math.min(Math.max(t.current, 0), 1);
    const target = hovered ? 1 : 0;
    t.current += (target - t.current) * Math.min(delta * 5, 1);
    const p = Math.min(Math.max(t.current, 0), 1);

    /* Rotate */
    if (group.current) {
      group.current.rotation.y += delta * 0.4;
      group.current.rotation.x = Math.sin(group.current.rotation.y * 0.3) * 0.15;
    }

    /* Face colors — dark → dark red on hover */
    const faceColor = lerpColor(DARK, DARK_RED, p);
    const faceMats = faceRef.current?.material;
    if (Array.isArray(faceMats)) {
      faceMats.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.color.lerp(faceColor, delta * 5);
        }
      });
    }

    /* Wireframe — gold → tricolor on hover */
    if (wireRef.current?.material instanceof THREE.LineBasicMaterial) {
      const hc = lerpColor(GOLD, RED, p * 0.6);
      wireRef.current.material.color.lerp(hc, delta * 5);
      wireRef.current.material.opacity = THREE.MathUtils.lerp(0.55, 0.9, p);
    }

    /* Glow */
    if (glowRef.current?.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.material.color.lerp(lerpColor(GLOW_BASE, GLOW_HOVER, p), delta * 5);
      glowRef.current.material.opacity = THREE.MathUtils.lerp(0.12, 0.35, p);
      const s = THREE.MathUtils.lerp(1.35, 1.55, p);
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {/* Main ball faces */}
      <mesh ref={faceRef} geometry={geo} material={faceMaterials} />

      {/* Wireframe seams */}
      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial color={GOLD} transparent opacity={0.55} linewidth={1} />
      </lineSegments>

      {/* Ambient glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.35, 24, 24]} />
        <meshBasicMaterial
          color={GLOW_BASE}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Main component ─── */
interface BallLogo3DProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function BallLogo3D({ size = 48, className = '', onClick }: BallLogo3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label="Logo Liga Paraguaya"
    >
      <Suspense fallback={
        <div className="w-full h-full rounded-full" style={{
          background: 'radial-gradient(circle at 35% 30%, #1A2A3A 0%, #0A0E1A 70%)',
          boxShadow: '0 0 20px rgba(212,165,32,0.2)',
        }} />
      }>
        <Canvas
          orthographic
          camera={{ zoom: 110, position: [0, 0, 3] }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          frameloop="always"
          style={{ pointerEvents: 'none' }}
        >
          {/* Lighting rig */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 4, 5]} intensity={1.8} color="#FFF8E7" />
          <directionalLight position={[-3, 1, -2]} intensity={0.5} color="#A0C4FF" />
          <pointLight position={[0, 0, 3]} intensity={0.4} color="#FFD700" />

          <Ball hovered={hovered} />
        </Canvas>
      </Suspense>

      {/* Contact shadow */}
      <div className="absolute -bottom-[6%] left-[15%] w-[70%] h-[16%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 75%)',
          filter: 'blur(3px)',
          transition: 'all 0.5s ease',
          opacity: hovered ? 0.6 : 0.4,
          transform: hovered ? 'scaleX(1.15) translateY(-2px)' : 'scaleX(1)',
        }}
      />
    </div>
  );
}