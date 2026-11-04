import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  RustChannel,
  RustMode,
  RustEdition,
  RustCrateType,
  OutputTarget,
} from '../types/rust';
import { AppTheme, LayoutMode, THEME_OPTIONS } from '../types/theme';
import {
  GraduationCap,
  BookOpen,
  Wrench,
  Palette,
  Columns2,
  ChevronDown,
  Binary,
  BookMarked,
  Sparkles,
  ShieldCheck,
  Package,
  CheckCircle2,
  Keyboard,
  Share2,
  Terminal,
  FlaskConical,
  Cpu,
  Layers,
  FileCode2,
  AlignLeft,
  RotateCcw,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /* Academy / Learn */
  onOpenAcademy: () => void;
  onOpenDsaLab: () => void;
  onOpenReferenceHub: () => void;
  onOpenCookbook: () => void;
  onOpenBorrowGuide: () => void;
  /* Tools */
  onOpenCrates: () => void;
  onOpenClippyInfo: () => void;
  onOpenShortcuts: () => void;
  onOpenShare: () => void;
  /* Theme */
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  appTheme: AppTheme;
  onChangeAppTheme: (t: AppTheme) => void;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (l: LayoutMode) => void;
  /* Compiler */
  channel: RustChannel;
  setChannel: (c: RustChannel) => void;
  mode: RustMode;
  setMode: (m: RustMode) => void;
  edition: RustEdition;
  setEdition: (e: RustEdition) => void;
  crateType: RustCrateType;
  setCrateType: (ct: RustCrateType) => void;
  target: OutputTarget;
  setTarget: (t: OutputTarget) => void;
  setActiveTab: (t: 'terminal' | 'diagnostics' | 'asm' | 'cargo') => void;
  backtrace: boolean;
  setBacktrace: (b: boolean) => void;
  /* Actions */
  onFormat: () => void;
  isFormatting: boolean;
  onOptimize: () => void;
  isOptimizing: boolean;
  onGenerateTests: () => void;
  isGeneratingTests: boolean;
  onResetCode: () => void;
  /* XP */
  totalXp: number;
  levelTitle: string;
  levelNumber: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenAcademy,
  onOpenDsaLab,
  onOpenReferenceHub,
  onOpenCookbook,
  onOpenBorrowGuide,
  onOpenCrates,
  onOpenClippyInfo,
  onOpenShortcuts,
  onOpenShare,
  appTheme,
  onChangeAppTheme,
  layoutMode,
  onChangeLayoutMode,
  channel,
  setChannel,
  mode,
  setMode,
  edition,
  setEdition,
  crateType,
  setCrateType,
  target,
  setTarget,
  setActiveTab,
  backtrace,
  setBacktrace,
  onFormat,
  isFormatting,
  onOptimize,
  isOptimizing,
  onGenerateTests,
  isGeneratingTests,
  onResetCode,
  totalXp,
  levelTitle,
  levelNumber,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isLearnMenuOpen, setIsLearnMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const activeThemeMeta = THEME_OPTIONS.find((t) => t.id === appTheme) || THEME_OPTIONS[0];

  if (!isOpen) return null;

  return (
    <div data-sidebar className="flex flex-col h-full w-64 shrink-0 border-r border-neutral-800 bg-[#0d1117] text-neutral-200 overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#121214]">
        <div className="flex items-center gap-2">
          <Logo size={7} />
          <span className="text-sm font-bold text-neutral-100 leading-none">FerrisForge</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* Navigation */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Navigation
          </div>
          <button
            onClick={() => { onOpenAcademy(); onClose(); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors cursor-pointer w-full text-left"
          >
            <GraduationCap className="w-4 h-4 text-[#DE3804] shrink-0" />
            <span>Academy</span>
          </button>
          <div className="relative">
            <button
              onClick={() => { setIsLearnMenuOpen(!isLearnMenuOpen); setIsToolsMenuOpen(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full text-left ${isLearnMenuOpen ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`}
            >
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Learn & Research</span>
              <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
            </button>
            {isLearnMenuOpen && (
              <div className="ml-4 space-y-1">
                <button
                  onClick={() => { onOpenDsaLab(); setIsLearnMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <Binary className="w-3 h-3 shrink-0" />
                  <span>DSA Lab</span>
                </button>
                <button
                  onClick={() => { onOpenReferenceHub(); setIsLearnMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <BookMarked className="w-3 h-3 shrink-0" />
                  <span>University Docs</span>
                </button>
                <button
                  onClick={() => { onOpenCookbook(); setIsLearnMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Cookbook</span>
                </button>
                <button
                  onClick={() => { onOpenBorrowGuide(); setIsLearnMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Borrow Guide</span>
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setIsToolsMenuOpen(!isToolsMenuOpen); setIsLearnMenuOpen(false); }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full text-left ${isToolsMenuOpen ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`}
            >
              <Wrench className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
            </button>
            {isToolsMenuOpen && (
              <div className="ml-4 space-y-1">
                <button
                  onClick={() => { onOpenCrates(); setIsToolsMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <Package className="w-3 h-3 shrink-0" />
                  <span>Crates</span>
                </button>
                <button
                  onClick={() => { onOpenClippyInfo(); setIsToolsMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Clippy</span>
                </button>
                <button
                  onClick={() => { onOpenShortcuts(); setIsToolsMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3 h-3 shrink-0" />
                  <span>Shortcuts</span>
                </button>
                <button
                  onClick={() => { onOpenShare(); setIsToolsMenuOpen(false); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3 shrink-0" />
                  <span>Share</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Appearance
          </div>
          <button
            onClick={() => { setIsThemeMenuOpen(!isThemeMenuOpen); }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full text-left ${isThemeMenuOpen ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`}
          >
            <Palette className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{activeThemeMeta.name}</span>
            <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
          </button>
          {isThemeMenuOpen && (
            <div className="ml-4 space-y-1">
              {THEME_OPTIONS.map((t) => {
                const isSelected = t.id === appTheme;
                return (
                  <button
                    key={t.id}
                    onClick={() => { onChangeAppTheme(t.id); setIsThemeMenuOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${isSelected ? 'bg-orange-500/20 text-white border-l-2 border-l-orange-500' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.accentColor }} />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => onChangeLayoutMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs w-full text-left ${layoutMode === 'split' ? 'bg-[#DE3804]/20 text-[#DE3804] border-l-2 border-l-[#DE3804]' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}
          >
            <Columns2 className="w-3 h-3 shrink-0" />
            <span>Split Layout</span>
          </button>
          <button
            onClick={() => onChangeLayoutMode('zen')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs w-full text-left ${layoutMode === 'zen' ? 'bg-[#DE3804]/20 text-[#DE3804] border-l-2 border-l-[#DE3804]' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}
          >
            <Terminal className="w-3 h-3 shrink-0" />
            <span>Zen Layout</span>
          </button>
          <button
            onClick={() => onChangeLayoutMode('analysis')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs w-full text-left ${layoutMode === 'analysis' ? 'bg-[#DE3804]/20 text-[#DE3804] border-l-2 border-l-[#DE3804]' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'}`}
          >
            <Cpu className="w-3 h-3 shrink-0" />
            <span>Analysis Layout</span>
          </button>
        </div>

        {/* Compiler */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Compiler
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50">
              <span className="text-neutral-500 w-16 text-[10px]">Channel</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as RustChannel)}
                className="flex-1 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
              >
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
                <option value="nightly">Nightly</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50">
              <span className="text-neutral-500 w-16 text-[10px]">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RustMode)}
                className="flex-1 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
              >
                <option value="debug">Debug</option>
                <option value="release">Release</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50">
              <span className="text-neutral-500 w-16 text-[10px]">Edition</span>
              <select
                value={edition}
                onChange={(e) => setEdition(e.target.value as RustEdition)}
                className="flex-1 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
              >
                <option value="2024">2024</option>
                <option value="2021">2021</option>
                <option value="2018">2018</option>
                <option value="2015">2015</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50">
              <span className="text-neutral-500 w-16 text-[10px]">Target</span>
              <select
                value={target}
                onChange={(e) => {
                  const t = e.target.value as OutputTarget;
                  setTarget(t);
                  if (t === 'asm' || t === 'llvm-ir' || t === 'mir' || t === 'expand') {
                    setActiveTab('asm');
                  } else if (t === 'clippy') {
                    setActiveTab('diagnostics');
                  }
                }}
                className="flex-1 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-100 text-xs focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
              >
                <option value="execute">Run</option>
                <option value="test">Test</option>
                <option value="clippy">Clippy</option>
                <option value="asm">ASM</option>
                <option value="llvm-ir">LLVM IR</option>
                <option value="expand">Expand</option>
              </select>
            </div>
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={backtrace}
                onChange={(e) => setBacktrace(e.target.checked)}
                className="rounded border-neutral-700 text-[#DE3804] focus:ring-[#DE3804]"
              />
              <span className="text-neutral-200 text-[10px]">Backtrace</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Actions
          </div>
          <button
            onClick={onFormat}
            disabled={isFormatting}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none w-full text-left text-xs ${isFormatting ? 'animate-ping' : ''}`}
          >
            <AlignLeft className="w-3 h-3 shrink-0" />
            <span>Format</span>
          </button>
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-900/30 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 transition-colors cursor-pointer disabled:opacity-50 w-full text-left text-xs`}
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{isOptimizing ? 'Analyzing...' : 'Optimize'}</span>
          </button>
          <button
            onClick={onGenerateTests}
            disabled={isGeneratingTests}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none w-full text-left text-xs ${isGeneratingTests ? 'animate-ping' : ''}`}
          >
            <FlaskConical className="w-3 h-3 shrink-0" />
            <span>Generate Tests</span>
          </button>
          <button
            onClick={onResetCode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer w-full text-left text-xs"
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span>Reset Code</span>
          </button>
        </div>

        {/* XP Badge */}
        <div className="px-3 py-2 rounded-lg bg-[#121214] border border-neutral-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-neutral-400">Progress</span>
            <span className="text-[10px] text-amber-400 font-mono">Lvl {levelNumber}</span>
          </div>
          <span className="text-neutral-200 text-sm">{levelTitle}</span>
          <span className="text-[10px] text-neutral-500">{totalXp} XP</span>
        </div>
      </div>
    </div>
  );
};
