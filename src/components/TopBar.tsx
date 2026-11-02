/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Loader2,
  Menu,
  X,
} from 'lucide-react';

interface TopBarProps {
  isRunning: boolean;
  onRun: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isRunning,
  onRun,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="relative flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 select-none theme-panel transition-colors z-30">
      {/* Zone 1: Wordmark + Sidebar Toggle */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e1e24] to-[#121215] border border-neutral-700/60 p-1 flex items-center justify-center shadow-md">
          <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="ferrisForgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#DE3804" />
              </linearGradient>
            </defs>
            <path
              d="M16 2.5L18.5 5.5H22.5V9.5L25.5 12L24.5 16L26.5 19L24 22.5L24.5 26.5L20.5 27.5L18 30L14 29L11.5 30L9 27.5L5 26.5L5.5 22.5L3 19.5L5 16L4 12L7 9.5V5.5H11L13.5 2.5L16 2.5Z"
              fill="url(#ferrisForgeGrad)"
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

        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-none">
            FerrisForge
          </span>
          <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
            Rust Playground & Academy
          </span>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Run Button (Desktop) */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#DE3804] hover:bg-[#C23103] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 btn-primary"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run (Ctrl+Enter)</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Run + Sidebar Toggle (shown on small screens) */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#DE3804] hover:bg-[#C23103] disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </header>
  );
};
