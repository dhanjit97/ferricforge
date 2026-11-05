/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from './Logo';
import {
  Play,
  Loader2,
  Sparkles,
  CheckCircle2,
  Cpu,
  Share2,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
  Code2,
  Settings2,
} from 'lucide-react';
import { RustChannel, RustMode, RustEdition } from '../services/rustPlayground';

interface TopBarProps {
  isRunning: boolean;
  onRun: () => void;
  onTest: () => void;
  onFormat: () => void;
  onClippy: () => void;
  onInspectAsm: () => void;
  channel: RustChannel;
  edition: RustEdition;
  mode: RustMode;
  onOpenToolchainSettings: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenAcademy?: () => void;
  onOpenShare: () => void;
  academyProgress?: { completed: number; total: number; xp: number; level: number };
  activeMobileView: 'editor' | 'inspector';
  onToggleMobileView: (view: 'editor' | 'inspector') => void;
  activeFileName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  isRunning,
  onRun,
  onTest,
  onFormat,
  onClippy,
  onInspectAsm,
  channel,
  edition,
  mode,
  onOpenToolchainSettings,
  isSidebarOpen,
  onToggleSidebar,
  onOpenShare,
  activeMobileView,
  onToggleMobileView,
  activeFileName = 'main.rs',
}) => {
  return (
    <header className="relative flex items-center justify-between h-14 px-3 sm:px-4 border-b border-white/[0.08] bg-[#101520]/95 backdrop-blur-md select-none shrink-0 z-40">
      {/* Left Section: Sidebar Retract/Expand Toggle, Brand Logo & Active File */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] transition-colors shrink-0"
          title={isSidebarOpen ? 'Retract Sidebar Drawer (Ctrl+B)' : 'Expand Sidebar Drawer (Ctrl+B)'}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <Logo size={28} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-[#e1e2ec] text-sm sm:text-base leading-none">
              FerricForge
            </span>
            <span className="font-mono text-[9px] font-bold tracking-[0.08em] px-1.5 py-0.5 rounded bg-[#ff5400]/15 text-[#ff6d00] border border-[#ff5400]/35 uppercase">
              Ultimate
            </span>
          </div>
        </div>

        {/* Active File Breadcrumb Indicator */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-white/[0.08]">
          <Code2 size={13} className="text-[#ff5400]" />
          <span className="font-mono text-xs text-[#94a3b8] font-medium">{activeFileName}</span>
        </div>
      </div>

      {/* Center Section: Core Execution Engine Button & Mobile View Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile View Switcher (Visible on < 1024px) */}
        <div className="flex lg:hidden items-center bg-[#0a0d14] p-0.5 rounded border border-white/[0.08] mr-1">
          <button
            onClick={() => onToggleMobileView('editor')}
            className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
              activeMobileView === 'editor'
                ? 'bg-[#ff5400] text-white font-bold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Switch to Code Editor"
          >
            <Code2 size={12} />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            onClick={() => onToggleMobileView('inspector')}
            className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
              activeMobileView === 'inspector'
                ? 'bg-[#00f0ff] text-black font-bold'
                : 'text-[#94a3b8] hover:text-white'
            }`}
            title="Switch to Output & Telemetry"
          >
            <Terminal size={12} />
            <span className="hidden sm:inline">Output</span>
          </button>
        </div>

        {/* Primary Molten Engine Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`relative group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded font-semibold text-xs tracking-wide transition-all shrink-0 ${
            isRunning
              ? 'bg-[#5c1900] text-[#ffb59c] cursor-wait'
              : 'bg-[#ff5400] hover:bg-[#ff6d00] text-white shadow-[0_0_16px_rgba(255,84,0,0.35)] active:scale-[0.98] border border-[#ff7a29]/40'
          }`}
          title="Compile and Execute (Ctrl + Enter)"
        >
          {isRunning ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : (
            <Play size={14} className="fill-white text-white" />
          )}
          <span>{isRunning ? 'Compiling...' : 'Run'}</span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-white/80 bg-black/25 px-1 py-0.2 rounded border border-white/20">
            Ctrl+↵
          </kbd>
        </button>

        {/* Test Runner */}
        <button
          onClick={onTest}
          disabled={isRunning}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium border border-white/[0.1] bg-[#161d2d]/80 text-[#94a3b8] hover:text-[#e1e2ec] hover:border-white/[0.2] transition-all shrink-0"
          title="Run Cargo Test Harness"
        >
          <CheckCircle2 size={13} className="text-[#10b981]" />
          <span>Test</span>
        </button>

        {/* Format */}
        <button
          onClick={onFormat}
          disabled={isRunning}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-medium border border-white/[0.1] bg-[#161d2d]/80 text-[#94a3b8] hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-all shrink-0"
          title="Format Code with rustfmt (Shift+Alt+F)"
        >
          <span>Format</span>
        </button>

        {/* Clippy Lints */}
        <button
          onClick={onClippy}
          disabled={isRunning}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-medium border border-white/[0.1] bg-[#161d2d]/80 text-[#94a3b8] hover:text-[#ff9e00] hover:border-[#ff9e00]/30 transition-all shrink-0"
          title="Analyze with Cargo Clippy"
        >
          <Sparkles size={12} className="text-[#ff9e00]" />
          <span>Clippy</span>
        </button>
      </div>

      {/* Right Section: Interactive Toolchain Badge, Academy & Share */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Uncluttered Toolchain Status Badge (Click opens toolchain drawer in sidebar) */}
        <button
          onClick={onOpenToolchainSettings}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a0d14]/80 hover:bg-[#161d2d] border border-white/[0.08] hover:border-[#00f0ff]/40 text-[#94a3b8] hover:text-[#e1e2ec] font-mono text-[11px] transition-all group shrink-0"
          title="Open Toolchain & Compiler Settings in Sidebar"
        >
          <Settings2 size={13} className="text-[#00f0ff] group-hover:rotate-45 transition-transform" />
          <span className="text-[#00f0ff] font-semibold">{channel}</span>
          <span className="text-white/20">•</span>
          <span>{edition}</span>
          <span className="text-white/20">•</span>
          <span className={mode === 'release' ? 'text-[#ffb868] font-semibold' : 'text-[#94a3b8]'}>
            {mode}
          </span>
        </button>

        {/* Inspect ASM Quick Trigger */}
        <button
          onClick={onInspectAsm}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff] transition-all shrink-0"
          title="Inspect Generated Assembly & LLVM-IR"
        >
          <Cpu size={13} />
          <span>ASM</span>
        </button>


        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className="p-1.5 rounded text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#161d2d] transition-colors shrink-0"
          title="Share Workspace or Export"
        >
          <Share2 size={16} />
        </button>
      </div>
    </header>
  );
};
