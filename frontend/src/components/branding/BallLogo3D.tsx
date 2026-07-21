'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Color palette — classic leather ball ─── */
const CREAM       = new THREE.Color('#F5F0E8');
const CREAM_LIT   = new THREE.Color('#FFFCF5');
const BLACK       = new THREE.Color('#1A1A1A');
const BLACK_SOFT  = new THREE.Color('#2A2A2A');
const SEAM_DARK   = new THREE.Color('#3A3530');
const SEAM_HOVER  = new THREE.Color('#D52B1E');
const GLOW_IDLE   = new THREE.Color('#F5F0E8');
const GLOW_HOVER  = new THREE.Color('#D52B1E');

/* ─── Helpers ─── */
function lerp(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}

function makeLeatherBump(size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;

  /* Base mid-gray */
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  /* Leather grain — thousands of tiny dimples */
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.5 + Math.random() * 1.5;
    const bright = Math.random() > 0.5;
    const v = bright ? 130 + Math.random() * 30 : 90 + Math.random() * 30;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Subtle wrinkle lines */
  ctx.strokeStyle = 'rgba(100,100,100,0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + (Math.random() - 0.5) * 60,
      sy + (Math.random() - 0.5) * 60,
      sx + (Math.random() - 0.5) * 100,
      sy + (Math.random() - 0.5) * 100
    );
    ctx.stroke();
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

  const { geo, wireGeo, faceMaterials } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const count = g.getAttribute('position').count / 3;

    /* Extract unique wireframe edges */
    const pos = g.getAttribute('position');
    const edgeSet = new Set<string>();
    const edgeVerts: number[] = [];
    for (let i = 0; i < count; i++) {
      const tri = [
        pos.getX(i * 3), pos.getY(i * 3), pos.getZ(i * 3),
        pos.getX(i * 3 + 1), pos.getY(i * 3 + 1), pos.getZ(i * 3 + 1),
        pos.getX(i * 3 + 2), pos.getY(i * 3 + 2), pos.getZ(i * 3 + 2),
      ];
      for (let e = 0; e < 3; e++) {
        const a = tri.slice(e * 3, e * 3 + 3);
        const b = tri.slice(((e + 1) % 3) * 3, ((e + 1) % 3) * 3 + 3);
        const key = [a, b].map(v => v.map(n => n.toFixed(3)).join(',')).sort().join('|');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgeVerts.push(...a, ...b);
        }
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));

    /*
     * Face materials — classic Adidas Telstar:
     *   First 20 original icosahedron faces → BLACK (pentagons)
     *   Remaining 60 subdivided faces → CREAM WHITE (hexagons)
     */
    const bump = makeLeatherBump();
    const creamMat = new THREE.MeshStandardMaterial({
      color: CREAM,
      roughness: 0.72,
      metalness: 0.0,
      bumpMap: bump,
      bumpScale: 0.025,
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: BLACK,
      roughness: 0.65,
      metalness: 0.0,
      bumpMap: bump,
      bumpScale: 0.02,
    });

    const mats: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < count; i++) {
      mats.push(i < 20 ? blackMat.clone() : creamMat.clone());
    }

    return { geo: g, wireGeo: wg, faceMaterials: mats };
  }, []);

  /* Animation loop */
  useFrame((_, delta) => {
    /* Smooth hover interpolation */
    const target = hovered ? 1 : 0;
    t.current += (target - t.current) * Math.min(delta * 5, 1);
    const p = Math.max(0, Math.min(1, t.current));

    /* Continuous rotation — smooth and hypnotic */
    if (group.current) {
      group.current.rotation.y += delta * 0.6;
      group.current.rotation.x = Math.sin(group.current.rotation.y * 0.4) * 0.12;
    }

    /* Face colors — cream→tinted on hover */
    const faceMats = faceRef.current?.material;
    if (Array.isArray(faceMats)) {
      faceMats.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          const isBlack = mat.color.r < 0.2;
          if (isBlack) {
            /* Black panels → dark red on hover */
            mat.color.lerp(lerp(BLACK, new THREE.Color('#3A0808'), p), delta * 5);
          } else {
            /* Cream panels → slightly warm on hover */
            mat.color.lerp(lerp(CREAM, new THREE.Color('#FFF0F0'), p * 0.4), delta * 5);
          }
        }
      });
    }

    /* Wireframe — dark seams → red on hover */
    if (wireRef.current?.material instanceof THREE.LineBasicMaterial) {
      wireRef.current.material.color.lerp(lerp(SEAM_DARK, SEAM_HOVER, p), delta * 5);
      wireRef.current.material.opacity = THREE.MathUtils.lerp(0.4, 0.85, p);
    }

    /* Glow — warm idle → red on hover */
    if (glowRef.current?.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.material.color.lerp(lerp(GLOW_IDLE, GLOW_HOVER, p), delta * 5);
      glowRef.current.material.opacity = THREE.MathUtils.lerp(0.06, 0.25, p);
      glowRef.current.scale.setScalar(THREE.MathUtils.lerp(1.3, 1.5, p));
    }
  });

  return (
    <group ref={group}>
      {/* Ball faces — cream hexagons + black pentagons */}
      <mesh ref={faceRef} geometry={geo} material={faceMaterials} />

      {/* Seam lines — dark wireframe */}
      <lineSegments ref={wireRef} geometry={wireGeo}>
        <lineBasicMaterial color={SEAM_DARK} transparent opacity={0.4} linewidth={1} />
      </lineSegments>

      {/* Ambient glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.3, 24, 24]} />
        <meshBasicMaterial
          color={GLOW_IDLE}
          transparent
          opacity={0.06}
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
          background: 'radial-gradient(circle at 35% 30%, #F5F0E8 0%, #D0C8B8 50%, #8A8070 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
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
          {/* Lighting — warm key + cool fill for volume */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 4, 5]} intensity={2.0} color="#FFF8E7" />
          <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#B0C4DE" />
          <pointLight position={[0, 0, 4]} intensity={0.3} color="#FFFFFF" />

          <Ball hovered={hovered} />
        </Canvas>
      </Suspense>

      {/* Contact shadow */}
      <div
        className="absolute -bottom-[8%] left-[12%] w-[76%] h-[18%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 75%)',
          filter: 'blur(3px)',
          transition: 'all 0.5s ease',
          opacity: hovered ? 0.55 : 0.35,
          transform: hovered ? 'scaleX(1.12) translateY(-1px)' : 'scaleX(1)',
        }}
      />
    </div>
  );
}