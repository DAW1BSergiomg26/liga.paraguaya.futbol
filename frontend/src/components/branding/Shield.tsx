'use client';

import { useId } from 'react';

interface ShieldProps {
  size?: number;
  className?: string;
}

export default function Shield({ size = 48, className = '' }: ShieldProps) {
  const id = useId();
  const g = (name: string) => `${id}-${name}`;

  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Escudo APF"
    >
      <defs>
        <linearGradient id={g('grad')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0057B8" />
          <stop offset="100%" stopColor="#003D82" />
        </linearGradient>
        <linearGradient id={g('red')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D52B1E" />
          <stop offset="100%" stopColor="#A51F15" />
        </linearGradient>
        <filter id={g('shadow')} x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
        </filter>
        <clipPath id={g('clip')}>
          <path d="M100,10 L185,45 L185,130 Q185,190 100,230 Q15,190 15,130 L15,45 Z" />
        </clipPath>
      </defs>

      <path
        d="M100,10 L185,45 L185,130 Q185,190 100,230 Q15,190 15,130 L15,45 Z"
        fill={`url(#${g('grad')})`}
        stroke="#F4C542"
        strokeWidth="3"
        filter={`url(#${g('shadow')})`}
      />
      <path
        d="M100,22 L175,52 L175,128 Q175,182 100,218 Q25,182 25,128 L25,52 Z"
        fill="none"
        stroke="#F4C542"
        strokeWidth="1.5"
        opacity="0.6"
      />

      <path d="M25,95 L175,95 L175,115 L25,115 Z" fill={`url(#${g('red')})`} clipPath={`url(#${g('clip')})`} />

      <g transform="translate(100,68) scale(0.45)">
        <circle cx="0" cy="0" r="42" fill="#FFF" stroke="#AEB8C5" strokeWidth="1.5" />
        <polygon points="0,-18 14,-8 10,10 -10,10 -14,-8" fill="#0057B8" opacity="0.85" />
        <path d="M0,-18 L0,-42" stroke="#AEB8C5" strokeWidth="1" />
        <path d="M14,-8 L38,-25" stroke="#AEB8C5" strokeWidth="1" />
        <path d="M10,10 L35,30" stroke="#AEB8C5" strokeWidth="1" />
        <path d="M-10,10 L-35,30" stroke="#AEB8C5" strokeWidth="1" />
        <path d="M-14,-8 L-38,-25" stroke="#AEB8C5" strokeWidth="1" />
        <ellipse cx="-10" cy="-12" rx="12" ry="8" fill="#FFF" opacity="0.4" transform="rotate(-15,-10,-12)" />
      </g>

      <text x="100" y="110" textAnchor="middle" fontFamily="'Space Grotesk','Inter',sans-serif" fontSize="22" fontWeight="700" fill="#FFFFFF" letterSpacing="6">
        APF
      </text>
      <text x="100" y="155" textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize="11" fontWeight="600" fill="#F4C542" letterSpacing="2">
        LIGA PARAGUAYA
      </text>
      <text x="100" y="172" textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize="9" fontWeight="400" fill="#AEB8C5" letterSpacing="3">
        DE FÚTBOL
      </text>

      <g fill="#F4C542">
        <polygon points="55,38 57,44 63,44 58,48 60,54 55,50 50,54 52,48 47,44 53,44" transform="scale(0.6) translate(10,-5)" />
        <polygon points="100,30 102,36 108,36 103,40 105,46 100,42 95,46 97,40 92,36 98,36" transform="scale(0.6) translate(67,0)" />
        <polygon points="145,38 147,44 153,44 148,48 150,54 145,50 140,54 142,48 137,44 143,44" transform="scale(0.6) translate(123,-5)" />
      </g>
    </svg>
  );
}