'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Palette ─── */
const CREAM      = new THREE.Color('#F5F0E8');
const BLACK      = new THREE.Color('#1A1A1A');
const SEAM_DARK  = new THREE.Color('#3A3530');
const SEAM_HOVER = new THREE.Color('#D52B1E');
const GLOW_IDLE  = new THREE.Color('#F5F0E8');
const GLOW_HOVER = new THREE.Color('#D52B1E');

function lerpC(a: THREE.Color, b: THREE.Color, t: number) {
  return new THREE.Color().lerpColors(a, b, t);
}

/* ─── Procedural soccer-ball texture ─── */
function makeBallTexture(size = 1024): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size / 2; /* 2:1 for equirectangular UV */
  const ctx = c.getContext('2d')!;

  /* ── Cream base ── */
  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(0, 0, c.width, c.height);

  /* ── Leather grain ── */
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = 0.3 + Math.random() * 1.2;
    const v = 180 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v - 5},${v - 15},0.25)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /*
   * Buckminster fullerene: 12 pentagons on a sphere.
   * We map each pentagon center to UV (u, v) where:
   *   u = (longitude + PI) / (2*PI),  v = latitude / PI + 0.5
   *
   * Classic icosahedron vertex positions (r=1):
   *   Top pole: (0, 1, 0)
   *   Upper ring (5): y ≈ 0.309, at 72° intervals
   *   Lower ring (5): y ≈ -0.309, at 72°+36° intervals
   *   Bottom pole: (0, -1, 0)
   */
  const toUV = (x: number, y: number, z: number): [number, number] => {
    const lon = Math.atan2(x, z);
    const lat = Math.asin(Math.max(-1, Math.min(1, y)));
    return [
      (lon / (2 * Math.PI) + 0.5) * c.width,
      (lat / Math.PI + 0.5) * c.height,
    ];
  };

  const pentCenters: [number, number, number][] = [
    /* Top pole */
    [0, 1, 0],
    /* Upper ring (5) */
    ...Array.from({ length: 5 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 5;
      return [Math.cos(a) * 0.588, 0.309, Math.sin(a) * 0.588] as [number, number, number];
    }),
    /* Lower ring (5) */
    ...Array.from({ length: 5 }, (_, i) => {
      const a = ((i * 2 * Math.PI) / 5) + Math.PI / 5;
      return [Math.cos(a) * 0.588, -0.309, Math.sin(a) * 0.588] as [number, number, number];
    }),
    /* Bottom pole */
    [0, -1, 0],
  ];

  /* Draw each pentagon as a dark filled polygon in UV space */
  pentCenters.forEach(([px, py, pz]) => {
    const [cu, cv] = toUV(px, py, pz);
    const pentRadius = c.width * 0.07; /* size of each pentagon in pixels */

    /* Generate 5 vertices around the center at even angles */
    ctx.beginPath();
    for (let v = 0; v < 5; v++) {
      const angle = (v * 2 * Math.PI) / 5 - Math.PI / 2;
      const vx = cu + Math.cos(angle) * pentRadius;
      const vy = cv + Math.sin(angle) * pentRadius;
      if (v === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();

    /* Seam outline */
    ctx.strokeStyle = '#3A3530';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  /* ── Seam lines (hex edges between pentagons) ── */
  ctx.strokeStyle = 'rgba(58, 53, 48, 0.35)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 60; i++) {
    const x1 = Math.random() * c.width;
    const y1 = Math.random() * c.height;
    const a = Math.random() * Math.PI * 2;
    const len = 20 + Math.random() * 40;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(a) * len, y1 + Math.sin(a) * len);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  /* Bump — same canvas, desaturated */
  const bc = document.createElement('canvas');
  bc.width = c.width;
  bc.height = c.height;
  const bctx = bc.getContext('2d')!;
  bctx.drawImage(c, 0, 0);
  bctx.filter = 'grayscale(1) contrast(1.5)';
  bctx.drawImage(bc, 0, 0);

  /* Add grain for leather feel */
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * bc.width;
    const y = Math.random() * bc.height;
    const r = 0.3 + Math.random() * 1;
    const v = Math.random() > 0.5 ? 160 : 90;
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  const bump = new THREE.CanvasTexture(bc);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.ClampToEdgeWrapping;

  return { map, bump };
}

/* ─── Ball mesh ─── */
function Ball({ hovered }: { hovered: boolean }) {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  const { map, bump } = useMemo(() => makeBallTexture(), []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.03,
      roughness: 0.65,
      metalness: 0.0,
    });
  }, [map, bump]);

  const hoverColor = useMemo(() => new THREE.Color('#3A0808'), []);

  useFrame((_, delta) => {
    const target = hovered ? 1 : 0;
    t.current += (target - t.current) * Math.min(delta * 5, 1);
    const p = Math.max(0, Math.min(1, t.current));

    /* Rotation */
    if (group.current) {
      group.current.rotation.y += delta * 0.6;
      group.current.rotation.x = Math.sin(group.current.rotation.y * 0.4) * 0.12;
    }

    /* Hover tint — darken the material slightly red */
    if (material) {
      material.color.lerp(lerpC(CREAM, hoverColor, p * 0.15), delta * 5);
      material.roughness = THREE.MathUtils.lerp(0.65, 0.5, p);
    }

    /* Glow */
    if (glowRef.current?.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.material.color.lerp(lerpC(GLOW_IDLE, GLOW_HOVER, p), delta * 5);
      glowRef.current.material.opacity = THREE.MathUtils.lerp(0.05, 0.2, p);
      glowRef.current.scale.setScalar(THREE.MathUtils.lerp(1.25, 1.45, p));
    }
  });

  return (
    <group ref={group}>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>

      {/* Glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.25, 24, 24]} />
        <meshBasicMaterial
          color={GLOW_IDLE}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Fallback (shown while Canvas loads) ─── */
function Fallback() {
  return (
    <div
      className="w-full h-full rounded-full"
      style={{
        background: 'radial-gradient(circle at 35% 30%, #F5F0E8 0%, #D0C8B8 50%, #8A8070 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    />
  );
}

/* ─── Main export ─── */
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
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 38 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          frameloop="always"
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={1.8} color="#FFF8E7" />
          <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#B0C4DE" />
          <pointLight position={[0, 0, 4]} intensity={0.4} color="#FFFFFF" />

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
