/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Boxes,
  Code2,
  Layers,
  Search,
  CheckCircle2,
  ArrowRight,
  Settings2,
  Cpu,
  Compass,
  HelpCircle,
  RotateCcw,
  PanelLeftClose,
  FileCode2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { WorkspaceFile, CrateItem, RustSnippet } from '../types/rust';
import {
  CURRICULUM_LESSONS,
  LEARNING_STAGES,
  calculateLevelFromXp,
  LearningStage,
  CurriculumLesson,
} from '../utils/curriculumData';
import { CAPSTONE_PROJECTS } from '../utils/capstoneProjectsData';
import { POPULAR_CRATES } from '../utils/crateRegistry';
import { RUST_SNIPPETS } from '../utils/rustSnippets';
import { RustChannel, RustMode, RustEdition } from '../services/rustPlayground';

export type SidebarTab = 'files' | 'toolchain' | 'academy' | 'capstones' | 'crates' | 'cookbook';

interface SidebarProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (path: string) => void;
  // Academy
  onSelectLesson: (lessonId: string) => void;
  onOpenAcademyModal: () => void;
  activeLessonId?: string;
  completedLessonIds: Set<string>;
  totalXp: number;
  // Capstones
  onLoadCapstone: (capstoneId: string) => void;
  // Crates
  onInsertCrate: (crateName: string, version: string) => void;
  onOpenCargoModal: () => void;
  // Cookbook / Snippets
  onInsertSnippet: (code: string) => void;
  onOpenCookbookModal: () => void;
  // AST / Jumps
  onJumpToLine?: (line: number) => void;
  // Toolchain & Compiler Options (Moved from TopBar)
  channel: RustChannel;
  setChannel: (c: RustChannel) => void;
  mode: RustMode;
  setMode: (m: RustMode) => void;
  edition: RustEdition;
  setEdition: (e: RustEdition) => void;
  onInspectAsm: () => void;
  // Modals & Tools quick launch
  onOpenDsaLab: () => void;
  onOpenBorrowGuide: () => void;
  onOpenShortcuts: () => void;
  onResetWorkspace: () => void;
  // Retractable Drawer Control
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onSelectLesson,
  onOpenAcademyModal,
  activeLessonId,
  completedLessonIds,
  totalXp,
  onLoadCapstone,
  onInsertCrate,
  onOpenCargoModal,
  onInsertSnippet,
  onOpenCookbookModal,
  onJumpToLine,
  channel,
  setChannel,
  mode,
  setMode,
  edition,
  setEdition,
  onInspectAsm,
  onOpenDsaLab,
  onOpenBorrowGuide,
  onOpenShortcuts,
  onResetWorkspace,
  isDrawerOpen,
  onToggleDrawer,
  activeTab,
  setActiveTab,
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createFileError, setCreateFileError] = useState('');
  const [searchCrateQuery, setSearchCrateQuery] = useState('');
  const [searchSnippetQuery, setSearchSnippetQuery] = useState('');
  const [selectedSnippetCategory, setSelectedSnippetCategory] = useState<string>('all');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [isSrcExpanded, setIsSrcExpanded] = useState(true);
  const [isAstExpanded, setIsAstExpanded] = useState(true);

  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const levelInfo = useMemo(() => calculateLevelFromXp(totalXp), [totalXp]);

  // Extract functions, structs, enums from current active file for AST Explorer
  const currentFile = useMemo(() => files.find((f) => f.path === activeFilePath), [files, activeFilePath]);
  const astSymbols = useMemo(() => {
    if (!currentFile || !currentFile.path.endsWith('.rs')) return [];
    const lines = currentFile.content.split('\n');
    const symbols: { name: string; kind: 'fn' | 'struct' | 'enum' | 'trait' | 'impl'; line: number }[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const fnMatch = trimmed.match(/^(?:pub(?:\s*\([^)]*\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (fnMatch) {
        symbols.push({ name: fnMatch[1], kind: 'fn', line: idx + 1 });
        return;
      }
      const structMatch = trimmed.match(/^(?:pub(?:\s*\([^)]*\))?\s+)?struct\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (structMatch) {
        symbols.push({ name: structMatch[1], kind: 'struct', line: idx + 1 });
        return;
      }
      const enumMatch = trimmed.match(/^(?:pub(?:\s*\([^)]*\))?\s+)?enum\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (enumMatch) {
        symbols.push({ name: enumMatch[1], kind: 'enum', line: idx + 1 });
        return;
      }
      const traitMatch = trimmed.match(/^(?:pub(?:\s*\([^)]*\))?\s+)?trait\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (traitMatch) {
        symbols.push({ name: traitMatch[1], kind: 'trait', line: idx + 1 });
        return;
      }
      const implMatch = trimmed.match(/^impl(?:\s*<[^>]+>)?\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (implMatch) {
        symbols.push({ name: `impl ${implMatch[1]}`, kind: 'impl', line: idx + 1 });
      }
    });

    return symbols;
  }, [currentFile]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim();
    if (!name) return;
    if (!name.endsWith('.rs')) name += '.rs';

    if (!/^[a-zA-Z0-9_]+\.rs$/.test(name)) {
      setCreateFileError('Must be alphanumeric + underscore (e.g. math.rs)');
      return;
    }

    const fullPath = `src/${name}`;
    if (files.some((f) => f.path === fullPath)) {
      setCreateFileError('File already exists');
      return;
    }

    onCreateFile(name);
    setNewFileName('');
    setIsCreatingFile(false);
    setCreateFileError('');
  };

  const handleTabClick = (tab: SidebarTab) => {
    if (activeTab === tab && isDrawerOpen) {
      // Toggle retract if clicking the already open tab
      onToggleDrawer();
    } else {
      setActiveTab(tab);
      if (!isDrawerOpen) {
        onToggleDrawer();
      }
    }
  };

  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const el = categoryContainerRef.current;
    if (el) {
      el.scrollLeft += e.deltaY;
    }
  };

  const snippetCategories = useMemo(() => {
    const cats = new Set<string>();
    RUST_SNIPPETS.forEach((s) => cats.add(s.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredSnippets = useMemo(() => {
    return RUST_SNIPPETS.filter((s: RustSnippet) => {
      const matchesCat = selectedSnippetCategory === 'all' || s.category === selectedSnippetCategory;
      const matchesQuery =
        s.title.toLowerCase().includes(searchSnippetQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchSnippetQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [searchSnippetQuery, selectedSnippetCategory]);

  const srcFiles = files.filter((f) => f.path.startsWith('src/'));
  const rootFiles = files.filter((f) => !f.path.startsWith('src/'));

  return (
    <div className="flex h-full select-none">
      {/* 1. Slim Activity Rail (48px) - Always accessible */}
      <nav className="w-12 shrink-0 h-full flex flex-col justify-between items-center py-2 bg-[#0c101a] border-r border-white/[0.08] z-30">
        {/* Top Activity Nav Icons */}
        <div className="flex flex-col items-center gap-1 w-full">
          {/* Explorer / Files */}
          <button
            onClick={() => handleTabClick('files')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'files' && isDrawerOpen
                ? 'bg-[#ff5400]/20 text-[#ff5400] border border-[#ff5400]/40'
                : 'text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d]'
            }`}
            title="Files & AST Explorer"
          >
            <Code2 size={18} />
            {activeTab === 'files' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#ff5400] rounded-r" />
            )}
            <span className="sr-only">Files</span>
          </button>

          {/* Compiler & Toolchain Settings */}
          <button
            onClick={() => handleTabClick('toolchain')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'toolchain' && isDrawerOpen
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                : 'text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#161d2d]'
            }`}
            title="Compiler & Toolchain Settings"
          >
            <Settings2 size={18} />
            {activeTab === 'toolchain' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00f0ff] rounded-r" />
            )}
            <span className="sr-only">Toolchain</span>
          </button>

          {/* Academy Curriculum */}
          <button
            onClick={() => handleTabClick('academy')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'academy' && isDrawerOpen
                ? 'bg-[#ff5400]/20 text-[#ff6d00] border border-[#ff5400]/40'
                : 'text-[#94a3b8] hover:text-[#ff5400] hover:bg-[#161d2d]'
            }`}
            title="Systems Academy Curriculum"
          >
            <BookOpen size={18} />
            {activeTab === 'academy' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#ff5400] rounded-r" />
            )}
            <span className="sr-only">Academy</span>
          </button>

          {/* Capstones */}
          <button
            onClick={() => handleTabClick('capstones')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'capstones' && isDrawerOpen
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                : 'text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#161d2d]'
            }`}
            title="Production Capstones"
          >
            <Layers size={18} />
            {activeTab === 'capstones' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00f0ff] rounded-r" />
            )}
            <span className="sr-only">Capstones</span>
          </button>

          {/* Crates */}
          <button
            onClick={() => handleTabClick('crates')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'crates' && isDrawerOpen
                ? 'bg-[#ffb868]/20 text-[#ffb868] border border-[#ffb868]/40'
                : 'text-[#94a3b8] hover:text-[#ffb868] hover:bg-[#161d2d]'
            }`}
            title="Cargo Crates"
          >
            <Boxes size={18} />
            {activeTab === 'crates' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#ffb868] rounded-r" />
            )}
            <span className="sr-only">Crates</span>
          </button>

          {/* Cookbook Recipes */}
          <button
            onClick={() => handleTabClick('cookbook')}
            className={`w-9 h-9 rounded flex items-center justify-center transition-all relative group ${
              activeTab === 'cookbook' && isDrawerOpen
                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                : 'text-[#94a3b8] hover:text-[#10b981] hover:bg-[#161d2d]'
            }`}
            title="Cookbook Recipes & Snippets"
          >
            <FileCode2 size={18} />
            {activeTab === 'cookbook' && isDrawerOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#10b981] rounded-r" />
            )}
            <span className="sr-only">Cookbook</span>
          </button>
        </div>

        {/* Bottom Utility Launcher Icons */}
        <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-white/[0.06]">
          {/* DSA Lab Trigger */}
          <button
            onClick={onOpenDsaLab}
            className="w-8 h-8 rounded flex items-center justify-center text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#161d2d] transition-colors"
            title="DSA Memory Lab"
          >
            <Zap size={16} />
          </button>

          {/* Borrow Checker Guide Trigger */}
          <button
            onClick={onOpenBorrowGuide}
            className="w-8 h-8 rounded flex items-center justify-center text-[#94a3b8] hover:text-[#ffb868] hover:bg-[#161d2d] transition-colors"
            title="Borrow Checker Guide"
          >
            <Compass size={16} />
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={onOpenShortcuts}
            className="w-8 h-8 rounded flex items-center justify-center text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={16} />
          </button>

          {/* Reset Workspace Trigger */}
          <button
            onClick={onResetWorkspace}
            className="w-8 h-8 rounded flex items-center justify-center text-[#94a3b8] hover:text-[#f43f5e] hover:bg-[#161d2d] transition-colors"
            title="Reset Workspace"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </nav>

      {/* 2. Retractable Content Drawer (260px) */}
      {isDrawerOpen && (
        <aside className="w-[260px] shrink-0 h-full flex flex-col bg-[#101520] border-r border-white/[0.08] z-20 animate-in fade-in slide-in-from-left-2 duration-150">
          {/* Drawer Header with Title & Collapse button */}
          <div className="flex items-center justify-between h-10 px-3 border-b border-white/[0.08] bg-[#0a0d14]/70 shrink-0">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#e1e2ec] flex items-center gap-1.5">
              {activeTab === 'files' && (
                <>
                  <Code2 size={13} className="text-[#ff5400]" />
                  <span>Explorer</span>
                </>
              )}
              {activeTab === 'toolchain' && (
                <>
                  <Settings2 size={13} className="text-[#00f0ff]" />
                  <span>Compiler & Config</span>
                </>
              )}
              {activeTab === 'academy' && (
                <>
                  <BookOpen size={13} className="text-[#ff5400]" />
                  <span>Curriculum</span>
                </>
              )}
              {activeTab === 'capstones' && (
                <>
                  <Layers size={13} className="text-[#00f0ff]" />
                  <span>Capstones</span>
                </>
              )}
              {activeTab === 'crates' && (
                <>
                  <Boxes size={13} className="text-[#ffb868]" />
                  <span>Crates</span>
                </>
              )}
              {activeTab === 'cookbook' && (
                <>
                  <FileCode2 size={13} className="text-[#10b981]" />
                  <span>Cookbook</span>
                </>
              )}
            </span>

            <button
              onClick={onToggleDrawer}
              className="p-1 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] transition-colors"
              title="Retract Sidebar (Ctrl+B)"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          {/* Drawer Body: Tab 1 - Files & AST */}
          {activeTab === 'files' && (
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
                  <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#94a3b8] font-semibold">
                    Workspace Files
                  </span>
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="p-1 rounded text-[#94a3b8] hover:text-[#ff5400] hover:bg-[#161d2d] transition-colors"
                    title="Create Rust Module in src/"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Inline File Creator Input */}
                {isCreatingFile && (
                  <form onSubmit={handleCreateSubmit} className="p-2 border-b border-white/[0.08] bg-[#161d2d]/70">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-[#94a3b8]">src/</span>
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="module_name.rs"
                        autoFocus
                        className="flex-1 bg-[#0a0d14] border border-white/[0.15] focus:border-[#ff5400] text-xs font-mono px-2 py-1 rounded text-[#e1e2ec] focus:outline-none"
                      />
                    </div>
                    {createFileError && (
                      <p className="text-[10px] text-[#f43f5e] mt-1 font-mono">{createFileError}</p>
                    )}
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingFile(false);
                          setCreateFileError('');
                        }}
                        className="px-2 py-0.5 text-[10px] text-[#94a3b8] hover:text-[#e1e2ec]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 text-[10px] font-medium bg-[#ff5400] text-white rounded hover:bg-[#ff6d00]"
                      >
                        Add Module
                      </button>
                    </div>
                  </form>
                )}

                {/* Tree View: src/ folder */}
                <div className="py-1">
                  <button
                    onClick={() => setIsSrcExpanded(!isSrcExpanded)}
                    className="w-full h-8 px-2.5 flex items-center gap-1.5 text-xs font-mono text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.02]"
                  >
                    {isSrcExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isSrcExpanded ? <FolderOpen size={14} className="text-[#ffb868]" /> : <Folder size={14} className="text-[#ffb868]" />}
                    <span className="font-semibold text-[11px] text-[#e1e2ec]">src</span>
                    <span className="text-[10px] text-[#94a3b8]/60 ml-auto">({srcFiles.length})</span>
                  </button>

                  {isSrcExpanded && (
                    <div className="relative pl-4 border-l border-dashed border-white/[0.08] ml-3.5 my-0.5 space-y-0.5">
                      {srcFiles.map((file) => {
                        const isActive = file.path === activeFilePath;
                        const isEntry = file.path === 'src/main.rs';
                        return (
                          <div
                            key={file.path}
                            onClick={() => onSelectFile(file.path)}
                            className={`group relative h-8 px-2 flex items-center justify-between text-xs font-mono cursor-pointer transition-all rounded ${
                              isActive
                                ? 'border-l-2 border-[#ff5400] bg-gradient-to-r from-[#ff5400]/15 to-transparent text-[#e1e2ec] font-semibold'
                                : 'border-l-2 border-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileCode size={13} className={isActive ? 'text-[#ff5400]' : 'text-[#ff7a29]/70'} />
                              <span className="truncate">{file.name}</span>
                              {isEntry && (
                                <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[#ff5400]/20 text-[#ff6d00] border border-[#ff5400]/30 uppercase">
                                  bin
                                </span>
                              )}
                            </div>

                            {!isEntry && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFile(file.path);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-[#f43f5e] transition-opacity"
                                title="Delete file"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Root Files (Cargo.toml, README) */}
                  <div className="mt-1 space-y-0.5 px-2">
                    {rootFiles.map((file) => {
                      const isActive = file.path === activeFilePath;
                      return (
                        <div
                          key={file.path}
                          onClick={() => onSelectFile(file.path)}
                          className={`h-8 px-2.5 flex items-center gap-2 text-xs font-mono cursor-pointer transition-all rounded ${
                            isActive
                              ? 'border-l-2 border-[#ff5400] bg-gradient-to-r from-[#ff5400]/15 to-transparent text-[#e1e2ec] font-semibold'
                              : 'border-l-2 border-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.03]'
                          }`}
                        >
                          <FileText size={13} className="text-[#00f0ff]" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AST Symbol Outline */}
                {astSymbols.length > 0 && (
                  <div className="mt-3 border-t border-white/[0.06] pt-2">
                    <button
                      onClick={() => setIsAstExpanded(!isAstExpanded)}
                      className="w-full px-3 py-1 flex items-center justify-between text-xs font-mono text-[#94a3b8] hover:text-[#e1e2ec]"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-[0.08em]">
                        {isAstExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <span>AST Outline ({astSymbols.length})</span>
                      </div>
                      <span className="text-[10px] text-[#00f0ff]/70 font-mono">Jump</span>
                    </button>

                    {isAstExpanded && (
                      <div className="px-2 py-1 space-y-0.5">
                        {astSymbols.map((sym, idx) => (
                          <div
                            key={idx}
                            onClick={() => onJumpToLine && onJumpToLine(sym.line)}
                            className="h-7 px-2 flex items-center justify-between rounded text-xs font-mono text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] cursor-pointer transition-colors"
                            title={`Jump to line ${sym.line}`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span
                                className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                  sym.kind === 'fn'
                                    ? 'bg-[#ff5400]/20 text-[#ff6d00]'
                                    : sym.kind === 'struct'
                                    ? 'bg-[#00f0ff]/20 text-[#00f0ff]'
                                    : sym.kind === 'enum'
                                    ? 'bg-[#ffb868]/20 text-[#ffb868]'
                                    : 'bg-[#10b981]/20 text-[#10b981]'
                                }`}
                              >
                                {sym.kind}
                              </span>
                              <span className="truncate text-[11px]">{sym.name}</span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono">:{sym.line}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Target Card */}
              <div className="p-3 border-t border-white/[0.08] bg-[#0a0d14]/50">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#94a3b8]">
                  <span>ACTIVE TARGET</span>
                  <span className="text-[#00f0ff] font-semibold">x86_64-linux</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#94a3b8] mt-1">
                  <span>ZERO-COST CHECK</span>
                  <span className="text-[#10b981] font-semibold">CLEAN</span>
                </div>
              </div>
            </div>
          )}

          {/* Drawer Body: Tab 2 - Toolchain & Compiler Settings (Moved from TopBar) */}
          {activeTab === 'toolchain' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 font-mono text-xs">
              {/* Target Architecture Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Target Architecture
                </label>
                <div className="flex items-center gap-2 p-2 rounded bg-[#161d2d] border border-[#00f0ff]/30 text-[#00f0ff]">
                  <Cpu size={14} className="text-[#00f0ff] shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px]">x86_64-unknown-linux</span>
                    <span className="text-[9px] text-[#94a3b8]">Rust Playground Cloud Engine</span>
                  </div>
                </div>
              </div>

              {/* Release Channel Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Compiler Release Channel
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#0a0d14] p-1 rounded border border-white/[0.08]">
                  {(['stable', 'beta', 'nightly'] as RustChannel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                        channel === c
                          ? 'bg-[#ff5400] text-white shadow-sm'
                          : 'text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.04]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#94a3b8]/70">
                  {channel === 'stable' && 'Rust 1.85 (Standard production guarantees)'}
                  {channel === 'beta' && 'Rust 1.86-beta (Upcoming stabilization)'}
                  {channel === 'nightly' && 'Rust 1.87-nightly (Unstable flags & SIMD)'}
                </p>
              </div>

              {/* Rust Edition Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Rust Edition
                </label>
                <select
                  value={edition}
                  onChange={(e) => setEdition(e.target.value as RustEdition)}
                  className="w-full bg-[#161d2d] border border-white/[0.1] text-xs font-mono p-2 rounded text-[#e1e2ec] focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="2024">Edition 2024 (Modern standard)</option>
                  <option value="2021">Edition 2021 (Disjoint capture closures)</option>
                  <option value="2018">Edition 2018 (Non-lexical lifetimes)</option>
                </select>
              </div>

              {/* Optimization Mode Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Compilation Profile
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setMode('debug')}
                    className={`p-2 rounded border text-left transition-all ${
                      mode === 'debug'
                        ? 'bg-[#ff5400]/15 border-[#ff5400] text-[#ffb59c]'
                        : 'bg-[#161d2d] border-white/[0.06] text-[#94a3b8] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Debug (dev)</div>
                    <div className="text-[9px] text-[#94a3b8] mt-0.5">-O0, with debuginfo</div>
                  </button>

                  <button
                    onClick={() => setMode('release')}
                    className={`p-2 rounded border text-left transition-all ${
                      mode === 'release'
                        ? 'bg-[#ce7f00]/20 border-[#ce7f00] text-[#ffb868]'
                        : 'bg-[#161d2d] border-white/[0.06] text-[#94a3b8] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="font-bold text-[11px]">Release</div>
                    <div className="text-[9px] text-[#94a3b8] mt-0.5">-O3, full LTO & opt</div>
                  </button>
                </div>
              </div>

              {/* Codegen & Assembly Quick Launch */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2">
                <label className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                  Binary Analysis & Codegen
                </label>
                <button
                  onClick={onInspectAsm}
                  className="w-full flex items-center justify-between p-2 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all font-semibold"
                >
                  <div className="flex items-center gap-1.5">
                    <Cpu size={14} />
                    <span>Disassemble to ASM</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Drawer Body: Tab 3 - Academy */}
          {activeTab === 'academy' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* Level Progress Card */}
              <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-semibold text-[#ff5400] uppercase tracking-wider">
                      Level {levelInfo.level}
                    </span>
                    <h4 className="text-xs font-bold text-[#e1e2ec]">{levelInfo.title}</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#ffb59c]">{totalXp} XP</span>
                </div>
                <div className="w-full bg-[#0a0d14] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-gradient-to-r from-[#ff5400] to-[#ffb868] h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(levelInfo.progressRatio * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] mt-1">
                  <span>Progress</span>
                  <span>{Math.round(levelInfo.progressRatio * 100)}%</span>
                </div>
              </div>

              <button
                onClick={onOpenAcademyModal}
                className="w-full py-1.5 rounded bg-[#ff5400]/10 hover:bg-[#ff5400]/20 border border-[#ff5400]/30 text-[#ffb59c] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Launch Full Curriculum</span>
                <ArrowRight size={12} />
              </button>

              {/* Stages List */}
              <div className="space-y-3">
                {([1, 2, 3, 4, 5] as LearningStage[]).map((stageNum: LearningStage) => {
                  const stageMeta = LEARNING_STAGES[stageNum];
                  const stageLessons = CURRICULUM_LESSONS.filter((l: CurriculumLesson) => l.stage === stageNum);

                  return (
                    <div key={stageNum} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#ffb868] uppercase tracking-wider">
                        <span className="w-4 h-4 rounded bg-[#ffb868]/20 flex items-center justify-center text-[10px]">
                          {stageNum}
                        </span>
                        <span className="truncate">{stageMeta.title}</span>
                      </div>

                      <div className="space-y-1 pl-1.5">
                        {stageLessons.map((lesson: CurriculumLesson) => {
                          const isCompleted = completedLessonIds.has(lesson.id);
                          const isCurrent = activeLessonId === lesson.id;

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => onSelectLesson(lesson.id)}
                              className={`p-2 rounded text-xs cursor-pointer border transition-all ${
                                isCurrent
                                  ? 'bg-[#ff5400]/15 border-[#ff5400] text-[#e1e2ec]'
                                  : isCompleted
                                  ? 'bg-[#101520] border-[#10b981]/30 text-[#94a3b8] hover:text-[#e1e2ec]'
                                  : 'bg-[#101520] border-white/[0.04] text-[#94a3b8] hover:text-[#e1e2ec] hover:border-white/[0.1]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium truncate text-[11px]">{lesson.title}</span>
                                {isCompleted ? (
                                  <CheckCircle2 size={12} className="text-[#10b981] shrink-0" />
                                ) : (
                                  <span className="font-mono text-[9px] text-[#ff5400] shrink-0">+{lesson.xpReward}xp</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-neutral-500">
                                <span>{lesson.estimatedMinutes}m</span>
                                <span>•</span>
                                <span>{lesson.difficulty}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drawer Body: Tab 4 - Capstones */}
          {activeTab === 'capstones' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#00f0ff] font-semibold">
                  Production Capstones
                </span>
                <span className="font-mono text-[10px] text-[#94a3b8]">5 Architectures</span>
              </div>

              {CAPSTONE_PROJECTS.map((cap) => (
                <div
                  key={cap.id}
                  className="p-2.5 rounded bg-[#161d2d] border border-white/[0.08] hover:border-[#00f0ff]/40 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#e1e2ec] group-hover:text-[#00f0ff] transition-colors">
                      {cap.title}
                    </h4>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                      {cap.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                    {cap.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                    <span className="font-mono text-[10px] text-neutral-500">
                      {cap.starterWorkspace?.length || 1} files
                    </span>
                    <button
                      onClick={() => onLoadCapstone(cap.id)}
                      className="flex items-center gap-1 font-mono text-[10px] font-semibold text-[#00f0ff] hover:text-white px-2 py-0.5 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 transition-all"
                    >
                      <span>Load</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drawer Body: Tab 5 - Crates */}
          {activeTab === 'crates' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#ffb868] font-semibold">
                  Cargo Dependencies
                </span>
                <button
                  onClick={onOpenCargoModal}
                  className="font-mono text-[10px] text-[#ffb868] hover:underline"
                >
                  Manage All
                </button>
              </div>

              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-[#94a3b8]" />
                <input
                  type="text"
                  value={searchCrateQuery}
                  onChange={(e) => setSearchCrateQuery(e.target.value)}
                  placeholder="Search crates..."
                  className="w-full bg-[#0a0d14] border border-white/[0.1] text-xs font-mono pl-7 pr-2.5 py-1.5 rounded text-[#e1e2ec] focus:outline-none focus:border-[#ffb868]"
                />
              </div>

              <div className="space-y-2">
                {POPULAR_CRATES.filter(
                  (c: CrateItem) =>
                    c.name.toLowerCase().includes(searchCrateQuery.toLowerCase()) ||
                    c.description.toLowerCase().includes(searchCrateQuery.toLowerCase())
                ).map((crate: CrateItem) => (
                  <div
                    key={crate.name}
                    className="p-2 rounded bg-[#161d2d] border border-white/[0.06] hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#ffb868]">{crate.name}</span>
                        <span className="font-mono text-[9px] text-[#94a3b8]">v{crate.version}</span>
                      </div>
                      <button
                        onClick={() => onInsertCrate(crate.name, crate.version)}
                        className="font-mono text-[10px] font-semibold text-[#ff5400] hover:text-white px-2 py-0.5 rounded bg-[#ff5400]/10 hover:bg-[#ff5400] transition-all"
                        title="Add to Cargo.toml"
                      >
                        + Add
                      </button>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                      {crate.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawer Body: Tab 6 - Cookbook & Snippets */}
          {activeTab === 'cookbook' && (
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#10b981] font-semibold">
                  Idiomatic Recipes
                </span>
                <button
                  onClick={onOpenCookbookModal}
                  className="font-mono text-[10px] text-[#10b981] hover:underline"
                >
                  Modal View
                </button>
              </div>

              {/* Search & Category filter */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2.5 text-[#94a3b8]" />
                <input
                  type="text"
                  value={searchSnippetQuery}
                  onChange={(e) => setSearchSnippetQuery(e.target.value)}
                  placeholder="Filter snippets..."
                  className="w-full bg-[#0a0d14] border border-white/[0.1] text-xs font-mono pl-7 pr-2.5 py-1.5 rounded text-[#e1e2ec] focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div
                ref={categoryContainerRef}
                onWheel={handleCategoryWheel}
                className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 w-full min-w-0 scrollbar-thin"
              >
                {snippetCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedSnippetCategory(cat)}
                    className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all ${
                      selectedSnippetCategory === cat
                        ? 'bg-[#10b981] text-black font-bold shadow-xs'
                        : 'bg-[#161d2d] text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#20293d] border border-white/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="p-2 rounded bg-[#161d2d] border border-white/[0.06] hover:border-[#10b981]/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-[#e1e2ec] truncate">{snippet.title}</span>
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-white/[0.05] text-[#94a3b8] shrink-0">
                        {snippet.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                      {snippet.description}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-white/[0.04]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(snippet.code);
                          setCopiedSnippetId(snippet.id);
                          setTimeout(() => setCopiedSnippetId(null), 1500);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.05] flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        {copiedSnippetId === snippet.id ? <Check size={10} className="text-[#10b981]" /> : <Copy size={10} />}
                        <span>{copiedSnippetId === snippet.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => onInsertSnippet(snippet.code)}
                        className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981] hover:text-black transition-all"
                        title="Insert into active file"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
