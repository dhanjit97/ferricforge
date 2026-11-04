/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 8, className }) => {
  return (
    <div
      className={`relative rounded-lg bg-gradient-to-br from-[#1e1e24] to-[#121215] border border-neutral-700/60 p-1 flex items-center justify-center shadow-md ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="ferrisLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#DE3804" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5L18.5 5.5H22.5V9.5L25.5 12L24.5 16L26.5 19L24 22.5L24.5 26.5L20.5 27.5L18 30L14 29L11.5 30L9 27.5L5 26.5L5.5 22.5L3 19.5L5 16L4 12L7 9.5V5.5H11L13.5 2.5L16 2.5Z"
          fill="url(#ferrisLogoGrad)"
          stroke="#FFA066"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="7.5" fill="#141416" stroke="#DE3804" strokeWidth="1.2" />
        <path
          d="M13 13C13 11 14.5 9.8 16.5 9.8C18.2 9.8 19.5 11 19.5 12.8C19.5 14.5 18 15.8 16 16.2L14.8 17V19"
          stroke="#FF8C42"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="14.8" cy="22.2" r="1.3" fill="#FFC107" />
      </svg>
    </div>
  );
};
