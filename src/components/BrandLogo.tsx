import React from 'react';

interface BrandLogoProps {
  animated?: boolean;
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  animated = false,
  size = 40,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mkBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B7D50" />
            <stop offset="100%" stopColor="#12452D" />
          </linearGradient>
          <linearGradient id="mkGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E39E" />
            <stop offset="100%" stopColor="#D9AA45" />
          </linearGradient>
        </defs>

        {/* Shield / Hexagon Emblem */}
        <rect width="120" height="120" rx="26" fill="url(#mkBg)" />
        <path
          d="M60 12 L100 29 V60 C100 84 82 102 60 110 C38 102 20 84 20 60 V29 Z"
          fill="#094D33"
          stroke="url(#mkGold)"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Subtle Khata / Calculator Base */}
        <rect
          x="36"
          y="71"
          width="48"
          height="22"
          rx="4"
          fill="#073120"
          stroke="url(#mkGold)"
          strokeWidth="2"
        />
        <rect x="42" y="76" width="16" height="4" rx="1.5" fill="#F2CC70" />
        <circle cx="66" cy="78" r="2" fill="#F2CC70" />
        <circle cx="74" cy="78" r="2" fill="#F2CC70" />
        <rect x="42" y="84" width="12" height="4" rx="1.5" fill="#10B981" />
        <rect x="58" y="84" width="20" height="4" rx="1.5" fill="#F2CC70" opacity="0.7" />

        {/* Golden Wheat Ear (Animated sway when animated=true) */}
        <g className={animated ? 'animate-wheat-sway' : ''}>
          <path
            d="M60 69 V28"
            stroke="url(#mkGold)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse cx="51" cy="40" rx="6.5" ry="3.2" transform="rotate(-35 51 40)" fill="url(#mkGold)" />
          <ellipse cx="69" cy="40" rx="6.5" ry="3.2" transform="rotate(35 69 40)" fill="url(#mkGold)" />
          <ellipse cx="50" cy="51" rx="7" ry="3.4" transform="rotate(-35 50 51)" fill="url(#mkGold)" />
          <ellipse cx="70" cy="51" rx="7" ry="3.4" transform="rotate(35 70 51)" fill="url(#mkGold)" />
          <ellipse cx="52" cy="61" rx="6" ry="3" transform="rotate(-35 52 61)" fill="url(#mkGold)" />
          <ellipse cx="68" cy="61" rx="6" ry="3" transform="rotate(35 68 61)" fill="url(#mkGold)" />
          <ellipse cx="60" cy="29" rx="3.8" ry="6.5" fill="url(#mkGold)" />
        </g>
      </svg>

      {animated && (
        <span
          aria-hidden="true"
          className="animate-gold-shine pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
        />
      )}
    </div>
  );
};
