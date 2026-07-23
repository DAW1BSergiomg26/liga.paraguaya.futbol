'use client';

interface LoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

export default function Loader({ size = 80, text = 'Cargando...', className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Spinning arc */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="loader-arc-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0057B8" />
              <stop offset="50%" stopColor="#D52B1E" />
              <stop offset="100%" stopColor="#F4C542" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="38" fill="none" stroke="#1A2A3A" strokeWidth="2" opacity="0.2" />
          <circle
            cx="40"
            cy="40"
            r="38"
            fill="none"
            stroke="url(#loader-arc-grad)"
            strokeWidth="2.5"
            strokeDasharray="60 180"
            strokeLinecap="round"
            className="animate-spin"
            style={{ transformOrigin: 'center', animationDuration: '1.2s' }}
          />
        </svg>

        {/* Static ball in center */}
        <svg
          width={size * 0.8}
          height={size * 0.8}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <defs>
            <radialGradient id="loader-metal" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F0F2F5" />
              <stop offset="100%" stopColor="#C8CDD5" />
            </radialGradient>
            <linearGradient id="loader-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0057B8" />
              <stop offset="100%" stopColor="#003D82" />
            </linearGradient>
            <clipPath id="loader-clip">
              <circle cx="40" cy="40" r="32" />
            </clipPath>
          </defs>
          <circle cx="40" cy="40" r="32" fill="url(#loader-metal)" stroke="#AEB8C5" strokeWidth="1" />
          <g clipPath="url(#loader-clip)">
            <polygon points="40,20 49,27 47,39 33,39 31,27" fill="url(#loader-panel)" opacity="0.9" />
            <path d="M40,20 L40,4" stroke="#AEB8C5" strokeWidth="0.7" />
            <path d="M49,27 L63,16" stroke="#AEB8C5" strokeWidth="0.7" />
            <path d="M47,39 L61,50" stroke="#AEB8C5" strokeWidth="0.7" />
            <path d="M33,39 L19,50" stroke="#AEB8C5" strokeWidth="0.7" />
            <path d="M31,27 L17,16" stroke="#AEB8C5" strokeWidth="0.7" />
            <path d="M40,20 Q48,14 49,27" fill="#D52B1E" opacity="0.2" />
            <path d="M49,27 Q61,34 47,39" fill="#0057B8" opacity="0.15" />
            <path d="M47,39 Q40,54 33,39" fill="#D52B1E" opacity="0.2" />
            <path d="M33,39 Q19,34 31,27" fill="#0057B8" opacity="0.15" />
            <path d="M31,27 Q30,14 40,20" fill="#D52B1E" opacity="0.2" />
            <ellipse cx="35" cy="24" rx="10" ry="6" fill="#FFF" opacity="0.4" transform="rotate(-20,35,24)" />
          </g>
          <circle cx="40" cy="40" r="32" fill="none" stroke="#AEB8C5" strokeWidth="1" />
        </svg>
      </div>

      {text && <p className="text-sm text-neutral-400 font-body animate-pulse">{text}</p>}
    </div>
  );
}