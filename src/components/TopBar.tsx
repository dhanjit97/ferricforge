/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from './Logo';
import {
  Play,
  Loader2,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

interface TopBarProps {
  isRunning: boolean;
  onRun: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isRunning,
  onRun,
  isSidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="relative flex items-center justify-between gap-3 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 select-none theme-panel transition-colors z-30">
      {/* Zone 1: Wordmark + Sidebar Toggle (Desktop) */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <Logo size={8} />

        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-none">
            FerrisForge
          </span>
          <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
            Rust Playground & Academy
          </span>
        </div>

        {/* Sidebar Toggle (Visible on md+ screens; mobile toggle is in mobile controls on right) */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
          aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
          title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Controls (Run + Theme Toggle) */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

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

      {/* Mobile Controls (Single Menu Toggle + Theme Toggle + Run) */}
      <div className="md:hidden flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
          aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
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
