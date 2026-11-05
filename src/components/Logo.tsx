/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 28 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Outer Molten Glow */}
      <div 
        className="absolute inset-0 rounded-lg bg-gradient-to-tr from-[#ff5400]/40 to-[#00f0ff]/20 blur-sm pointer-events-none"
      />
      
      {/* Core Brand Badge */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="6"
          fill="#101520"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />
        {/* Anvil / Forge Horn */}
        <path
          d="M7 11H25V14C23.5 14 21 15 20 17H12C11 15 8.5 14 7 14V11Z"
          fill="url(#ferricGradient)"
        />
        {/* Base Foundation */}
        <path
          d="M10 18H22L24 23H8L10 18Z"
          fill="#ff5400"
          fillOpacity="0.85"
        />
        {/* Molten Core Laser Beam */}
        <circle cx="16" cy="15" r="2.2" fill="#00f0ff" />
        <line x1="16" y1="7" x2="16" y2="10" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
        
        <defs>
          <linearGradient id="ferricGradient" x1="7" y1="11" x2="25" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff7a29" />
            <stop offset="1" stopColor="#ff3a00" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
