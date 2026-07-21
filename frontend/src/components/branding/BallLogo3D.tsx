'use client';

import { useState } from 'react';

interface BallLogo3DProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function BallLogo3D({ size = 48, className = '', onClick }: BallLogo3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`ball3d-wrap ${className}`}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label="Logo Liga Paraguaya"
    >
      {/* Ambient shadow */}
      <div className="ball3d-shadow" />

      {/* Perspective container */}
      <div className="ball3d-perspective">
        {/* Sphere — rotates on both axes */}
        <div className={`ball3d-sphere ${hovered ? 'ball3d-sphere--fast' : ''}`}>
          {/* 7 faces arranged in a sphere */}
          <div className="ball3d-face ball3d-face--front" />
          <div className="ball3d-face ball3d-face--back" />
          <div className="ball3d-face ball3d-face--right" />
          <div className="ball3d-face ball3d-face--left" />
          <div className="ball3d-face ball3d-face--top" />
          <div className="ball3d-face ball3d-face--bottom" />
          <div className="ball3d-face ball3d-face--extra" />

          {/* Seam lines — radial from center */}
          <div className="ball3d-seam ball3d-seam--v" />
          <div className="ball3d-seam ball3d-seam--h" />
          <div className="ball3d-seam ball3d-seam--d1" />
          <div className="ball3d-seam ball3d-seam--d2" />

          {/* Central pentagon patch */}
          <div className="ball3d-pentagon" />

          {/* Specular highlight */}
          <div className="ball3d-specular" />
        </div>
      </div>

      {/* Hover glow */}
      <div className={`ball3d-glow ${hovered ? 'ball3d-glow--active' : ''}`} />
    </div>
  );
}