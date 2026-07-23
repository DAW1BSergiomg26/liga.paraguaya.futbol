'use client';

import { useId } from 'react';

interface BallLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function BallLogo({ size = 48, animated = true, className = '', onClick }: BallLogoProps) {
  const id = useId();
  const g = (name: string) => `${id}-${name}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'animate-spin-3d' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label="Logo Liga Paraguaya"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <defs>
        <radialGradient id={g('metal')} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F0F2F5" />
          <stop offset="100%" stopColor="#C8CDD5" />
        </radialGradient>
        <radialGradient id={g('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0057B8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0057B8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('panel')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0057B8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#003D82" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={g('red')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D52B1E" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A51F15" stopOpacity="0.85" />
        </linearGradient>
        <filter id={g('shadow')} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
        </filter>
        <clipPath id={g('clip')}>
          <circle cx="60" cy="60" r="54" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="58" fill={`url(#${g('glow')})`} />
      <circle cx="60" cy="60" r="54" fill={`url(#${g('metal')})`} stroke="#AEB8C5" strokeWidth="1.5" filter={`url(#${g('shadow')})`} />

      <g clipPath={`url(#${g('clip')})`}>
        <polygon points="60,38 73,49 69,65 51,65 47,49" fill={`url(#${g('panel')})`} opacity="0.9" />
        <polygon points="60,40 71,50 68,63 52,63 49,50" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" />

        <path d="M60,38 L60,6" stroke="#AEB8C5" strokeWidth="1.2" fill="none" />
        <path d="M73,49 L98,32" stroke="#AEB8C5" strokeWidth="1.2" fill="none" />
        <path d="M69,65 L95,85" stroke="#AEB8C5" strokeWidth="1.2" fill="none" />
        <path d="M51,65 L25,85" stroke="#AEB8C5" strokeWidth="1.2" fill="none" />
        <path d="M47,49 L22,32" stroke="#AEB8C5" strokeWidth="1.2" fill="none" />

        <path d="M60,6 Q78,20 73,49" fill={`url(#${g('red')})`} opacity="0.3" />
        <path d="M73,49 Q95,60 69,65" fill={`url(#${g('panel')})`} opacity="0.2" />
        <path d="M69,65 Q60,90 51,65" fill={`url(#${g('red')})`} opacity="0.25" />
        <path d="M51,65 Q25,60 47,49" fill={`url(#${g('panel')})`} opacity="0.2" />
        <path d="M47,49 Q42,20 60,6" fill={`url(#${g('red')})`} opacity="0.3" />

        <path d="M60,22 L68,28 L68,38 L60,42 L52,38 L52,28 Z" fill="none" stroke="#0057B8" strokeWidth="0.5" opacity="0.25" />
        <path d="M80,40 L86,48 L86,58 L80,62 L74,58 L74,48 Z" fill="none" stroke="#D52B1E" strokeWidth="0.5" opacity="0.2" />
        <path d="M72,68 L78,76 L78,84 L72,88 L66,84 L66,76 Z" fill="none" stroke="#0057B8" strokeWidth="0.5" opacity="0.25" />
        <path d="M40,68 L46,76 L46,84 L40,88 L34,84 L34,76 Z" fill="none" stroke="#D52B1E" strokeWidth="0.5" opacity="0.2" />
        <path d="M34,40 L40,48 L40,58 L34,62 L28,58 L28,48 Z" fill="none" stroke="#0057B8" strokeWidth="0.5" opacity="0.25" />

        <ellipse cx="45" cy="35" rx="18" ry="12" fill="#FFF" opacity="0.35" transform="rotate(-20,45,35)" />
        <ellipse cx="42" cy="32" rx="8" ry="5" fill="#FFF" opacity="0.5" transform="rotate(-20,42,32)" />
      </g>

      <circle cx="60" cy="60" r="54" fill="none" stroke="#AEB8C5" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#0057B8" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}