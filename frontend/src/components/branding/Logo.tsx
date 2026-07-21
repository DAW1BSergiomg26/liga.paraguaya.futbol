'use client';

import BallLogo from './BallLogo';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: number;
  className?: string;
  onClick?: () => void;
}

export default function Logo({ variant = 'horizontal', size = 48, className = '', onClick }: LogoProps) {
  if (variant === 'icon') {
    return <BallLogo size={size} animated className={className} onClick={onClick} />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} style={onClick ? { cursor: 'pointer' } : undefined}>
        <BallLogo size={size} animated />
        <div className="text-center">
          <p className="font-display text-lg font-bold text-white leading-tight tracking-tight">
            Liga Paraguaya
          </p>
          <p className="text-[10px] font-body text-neutral-400 uppercase tracking-[0.2em]">
            De Fútbol
          </p>
          <div className="flex justify-center gap-1 mt-1.5">
            <div className="w-5 h-0.5 rounded bg-[#D52B1E]" />
            <div className="w-3 h-0.5 rounded bg-[#0057B8]" />
            <div className="w-2 h-0.5 rounded bg-[#F4C542]" />
          </div>
        </div>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} style={onClick ? { cursor: 'pointer' } : undefined}>
      <BallLogo size={size} animated />
      <div>
        <p className="font-display text-xl font-bold text-white leading-tight tracking-tight">
          Liga Paraguaya
        </p>
        <p className="text-[11px] font-body text-neutral-400 uppercase tracking-[0.25em]">
          De Fútbol
        </p>
        <div className="flex gap-1 mt-1">
          <div className="w-6 h-0.5 rounded bg-[#D52B1E]" />
          <div className="w-3.5 h-0.5 rounded bg-[#0057B8]" />
          <div className="w-2 h-0.5 rounded bg-[#F4C542]" />
        </div>
      </div>
    </div>
  );
}