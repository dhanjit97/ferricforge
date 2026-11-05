/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { CodeEditor } from './components/CodeEditor';
import { InspectorPanel } from './components/InspectorPanel';
import { TelemetryBar } from './components/TelemetryBar';
import { AcademyModal } from './components/AcademyModal';
import { DsaLabModal } from './components/DsaLabModal';
import { BorrowGuideModal } from './components/BorrowGuideModal';
import { CargoManager } from './components/CargoManager';
import { CookbookModal } from './components/CookbookModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ShareModal } from './components/ShareModal';
import { WorkspaceFile, ParsedDiagnostic } from './types/rust';
import { RustChannel, RustMode, RustEdition, executeRustCode, formatRustCode, clippyRustCode } from './services/rustPlayground';
import { bundleWorkspace, mapDiagnosticToWorkspace } from './utils/workspaceBundler';
import { parseRustcDiagnostics } from './utils/diagnosticParser';
import { sanitizeFileName, sanitizeCodeInput } from './utils/security';
import { CAPSTONE_PROJECTS } from './utils/capstoneProjectsData';
import { CURRICULUM_LESSONS, calculateLevelFromXp } from './utils/curriculumData';

const DEFAULT_MAIN_RS = `// ==============================================================================
// FerricForge Ultimate: Terminal-Grade Rust Systems Workbench
// Zero-Cost Abstractions • Non-Lexical Lifetimes • Fearless Concurrency
// ==============================================================================

#[derive(Debug, Clone)]
pub struct SystemsMetric {
    pub subsystem: String,
    pub latency_nanos: u64,
    pub zero_leak_verified: bool,
}

impl SystemsMetric {
    pub fn new(subsystem: &str, latency_nanos: u64) -> Self {
        Self {
            subsystem: subsystem.to_string(),
            latency_nanos,
            zero_leak_verified: true,
        }
    }

    pub fn display_telemetry(&self) {
        println!(
            "  -> [{:^16}] {:>6} ns latency | leak-free: {}",
            self.subsystem, self.latency_nanos, self.zero_leak_verified
        );
    }
}

fn main() {
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║             FERRICFORGE SYSTEMS WORKBENCH v1.85              ║");
    println!("║       Target: x86_64-unknown-linux-gnu (Zero-Cost Codegen)   ║");
    println!("╚══════════════════════════════════════════════════════════════╝\\n");

    // 1. Stack Allocation & RAII Drop Mechanics
    let mut metrics_log: Vec<SystemsMetric> = Vec::with_capacity(4);
    metrics_log.push(SystemsMetric::new("Memory Allocator", 14));
    metrics_log.push(SystemsMetric::new("Borrow Checker", 42));
    metrics_log.push(SystemsMetric::new("Thread Harness", 68));
    metrics_log.push(SystemsMetric::new("SIMD Vectorizer", 9));

    // 2. Non-Lexical Borrowing (Zero-Cost Iteration)
    println!("Active Systems Telemetry:");
    for metric in &metrics_log {
        metric.display_telemetry();
    }

    // 3. Ownership & Move Semantics Validation
    let total_subsystems = metrics_log.len();
    println!("\\n[STATUS] Successfully verified {} core subsystems.", total_subsystems);
    println!("[GUARANTEE] Zero memory leaks, zero data races, deterministic deallocation.\\n");
}
`;

const DEFAULT_CARGO_TOML = `[package]
name = "ferricforge_workspace"
version = "0.1.0"
edition = "2021"

[dependencies]
# Dependencies pre-cached on Rust Playground
# serde = { version = "1.0", features = ["derive"] }
# tokio = { version = "1", features = ["full"] }
# anyhow = "1.0"
`;

export default function App() {
  // Workspace files (bounded max 20 files for defense in depth)
  const [files, setFiles] = useState<WorkspaceFile[]>([
    { path: 'src/main.rs', name: 'main.rs', content: DEFAULT_MAIN_RS, isEntry: true },
    { path: 'Cargo.toml', name: 'Cargo.toml', content: DEFAULT_CARGO_TOML },
  ]);
  const [activeFilePath, setActiveFilePath] = useState<string>('src/main.rs');

  // Compiler settings
  const [channel, setChannel] = useState<RustChannel>('stable');
  const [mode, setMode] = useState<RustMode>('debug');
  const [edition, setEdition] = useState<RustEdition>('2021');

  // Execution & Diagnostics state
  const [isRunning, setIsRunning] = useState(false);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [exitDetail, setExitDetail] = useState<string | undefined>(undefined);
  const [diagnostics, setDiagnostics] = useState<ParsedDiagnostic[]>([]);
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);

  // Academy state
  const [activeLessonId, setActiveLessonId] = useState<string>(CURRICULUM_LESSONS[0].id);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState<number>(180);

  // Layout & Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<SidebarTab>('files');
  const [activeMobileView, setActiveMobileView] = useState<'editor' | 'inspector'>('editor');
  const [isDsaLabOpen, setIsDsaLabOpen] = useState(false);
  const [isBorrowGuideOpen, setIsBorrowGuideOpen] = useState(false);
  const [isCargoOpen, setIsCargoOpen] = useState(false);
  const [isCookbookOpen, setIsCookbookOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activeFilePath) || files[0],
    [files, activeFilePath]
  );

  const academyProgress = useMemo(() => {
    const info = calculateLevelFromXp(totalXp);
    return {
      completed: completedLessonIds.size,
      total: CURRICULUM_LESSONS.length,
      xp: totalXp,
      level: info.level,
    };
  }, [completedLessonIds, totalXp]);

  // Code modification handler with length bounding
  const handleCodeChange = (newContent: string) => {
    // Defense: limit maximum file content length to 250KB
    const bounded = newContent.slice(0, 250000);
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFilePath ? { ...f, content: bounded } : f))
    );
  };

  // Compile and run active workspace
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setExitDetail('Compiling on remote target...');
    setDiagnostics([]);

    // Bundle multi-file workspace if there are secondary .rs files
    const { bundledCode, lineMappings } = bundleWorkspace(files);

    const sanitized = sanitizeCodeInput(bundledCode);
    if (!sanitized) {
      setIsRunning(false);
      setExitDetail('Error: Code is empty or exceeds 250KB limit');
      return;
    }

    const result = await executeRustCode({
      channel,
      mode,
      edition,
      code: sanitized,
      tests: false,
    });

    setIsRunning(false);
    setStdout(result.stdout || '');
    setStderr(result.stderr || '');
    setDurationMs(result.executionDurationMs);
    setExitDetail(result.exitDetail || (result.success ? 'Exited with status 0' : 'Compilation / runtime error'));

    // Parse rustc diagnostics and map lines back to individual files
    if (result.stderr) {
      const rawDiags = parseRustcDiagnostics(result.stderr);
      const mappedDiags = rawDiags.map((d) => mapDiagnosticToWorkspace(d, lineMappings));
      setDiagnostics(mappedDiags);
      if (window.innerWidth < 1024) {
        setActiveMobileView('inspector');
      }
    }
  }, [files, channel, mode, edition, isRunning]);

  // Run tests
  const handleTest = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setExitDetail('Running test harness...');

    const { bundledCode, lineMappings } = bundleWorkspace(files);
    const sanitized = sanitizeCodeInput(bundledCode);
    if (!sanitized) {
      setIsRunning(false);
      setExitDetail('Error: Code is empty or exceeds limit');
      return;
    }

    const result = await executeRustCode({
      channel,
      mode,
      edition,
      code: sanitized,
      tests: true,
    });

    setIsRunning(false);
    setStdout(result.stdout || '');
    setStderr(result.stderr || '');
    setDurationMs(result.executionDurationMs);
    setExitDetail(result.exitDetail || (result.success ? 'Tests Passed' : 'Tests Failed'));

    if (result.stderr) {
      const rawDiags = parseRustcDiagnostics(result.stderr);
      setDiagnostics(rawDiags.map((d) => mapDiagnosticToWorkspace(d, lineMappings)));
      if (window.innerWidth < 1024) {
        setActiveMobileView('inspector');
      }
    }
  }, [files, channel, mode, edition, isRunning]);

  // Format code with rustfmt
  const handleFormat = useCallback(async () => {
    if (!activeFile || isRunning) return;
    setIsRunning(true);
    const result = await formatRustCode(activeFile.content, edition);
    setIsRunning(false);

    if (result.success && result.code) {
      handleCodeChange(result.code);
      setExitDetail('Formatted with rustfmt');
    } else if (result.stderr) {
      setStderr(result.stderr);
      setExitDetail('rustfmt notice');
    }
  }, [activeFile, edition, isRunning]);

  // Clippy lint check
  const handleClippy = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStdout('');
    setStderr('');
    setExitDetail('Running Cargo Clippy...');

    const { bundledCode, lineMappings } = bundleWorkspace(files);
    const result = await clippyRustCode(bundledCode, edition, channel);
    setIsRunning(false);

    setStdout(result.stdout || '');
    setStderr(result.stderr || '');
    setExitDetail('Clippy analysis complete');

    if (result.stderr) {
      const rawDiags = parseRustcDiagnostics(result.stderr);
      setDiagnostics(rawDiags.map((d) => mapDiagnosticToWorkspace(d, lineMappings)));
    }
  }, [files, edition, channel, isRunning]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter -> Run
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      // Ctrl+B or Cmd+B -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Shift+Alt+F -> Format
      if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        handleFormat();
      }
      // Escape -> close any modal
      if (e.key === 'Escape') {
        setSidebarActiveTab('files');
        setActiveMobileView('editor');
        setIsDsaLabOpen(false);
        setIsBorrowGuideOpen(false);
        setIsCargoOpen(false);
        setIsCookbookOpen(false);
        setIsShortcutsOpen(false);
        setIsShareOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleFormat]);

  // Create file in src/ with strict sanitization
  const handleCreateFile = (rawName: string) => {
    const sanitized = sanitizeFileName(rawName);
    if (!sanitized.valid) {
      alert(`Invalid file name: ${sanitized.error}`);
      return;
    }

    if (files.length >= 20) {
      alert('Maximum of 20 workspace files allowed');
      return;
    }

    const path = `src/${sanitized.sanitized}`;
    if (files.some((f) => f.path === path)) {
      alert('File already exists');
      return;
    }

    const newFile: WorkspaceFile = {
      path,
      name: sanitized.sanitized,
      content: `// Module: ${sanitized.sanitized}\npub fn execute() {\n    println!("Executed module ${sanitized.sanitized}");\n}\n`,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFilePath(path);
  };

  // Delete file
  const handleDeleteFile = (path: string) => {
    if (path === 'src/main.rs' || path === 'Cargo.toml') {
      alert('Entrypoint src/main.rs and Cargo.toml cannot be deleted.');
      return;
    }
    setFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFilePath === path) {
      setActiveFilePath('src/main.rs');
    }
  };

  // Load Capstone project
  const handleLoadCapstone = (capstoneId: string) => {
    const cap = CAPSTONE_PROJECTS.find((c) => c.id === capstoneId);
    if (!cap || !cap.starterWorkspace) return;
    setFiles(cap.starterWorkspace);
    setActiveFilePath(cap.starterWorkspace[0]?.path || 'src/main.rs');
    setExitDetail(`Loaded Capstone: ${cap.title}`);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Add crate to Cargo.toml
  const handleAddCrate = (crateName: string, version: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === 'Cargo.toml') {
          const entry = `${crateName} = "${version}"\n`;
          if (f.content.includes(crateName)) return f;
          return { ...f, content: f.content + entry };
        }
        return f;
      })
    );
  };

  // Load snippet into current active file
  const handleLoadSnippet = (codeSnippet: string) => {
    handleCodeChange(codeSnippet);
    setActiveFilePath('src/main.rs');
    if (window.innerWidth < 1024) {
      setActiveMobileView('editor');
    }
  };

  // Apply diagnostic quick fix directly to the source lines
  const handleApplyFix = (diag: ParsedDiagnostic) => {
    if (!diag.suggestion || !diag.line) return;
    const suggestionText = diag.suggestion;
    const targetLine = diag.line;

    // Apply substitution to file
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === (diag.file || activeFilePath)) {
          const lineList = f.content.split('\n');
          if (targetLine <= lineList.length) {
            // If suggestion is explicit code
            const line = lineList[targetLine - 1];
            if (suggestionText.includes('`')) {
              const match = suggestionText.match(/`([^`]+)`/);
              if (match) {
                lineList[targetLine - 1] = match[1];
              }
            } else if (diag.errorCode === 'E0384' || suggestionText.includes('mut')) {
              lineList[targetLine - 1] = line.replace(/\blet\s+/, 'let mut ');
            }
            return { ...f, content: lineList.join('\n') };
          }
        }
        return f;
      })
    );

    // Remove fixed diagnostic from active list
    setDiagnostics((prev) => prev.filter((d) => d.id !== diag.id));
  };

  const handleResetWorkspace = () => {
    if (window.confirm('Reset workspace to default FerricForge starter? All unsaved edits will be cleared.')) {
      setFiles([
        { path: 'src/main.rs', name: 'main.rs', content: DEFAULT_MAIN_RS, isEntry: true },
        { path: 'Cargo.toml', name: 'Cargo.toml', content: DEFAULT_CARGO_TOML },
      ]);
      setActiveFilePath('src/main.rs');
      setStdout('');
      setStderr('');
      setDiagnostics([]);
      setExitDetail('Workspace reset');
    }
  };

  const hasUnsafe = activeFile?.content.includes('unsafe') || false;
  const hasErrors = diagnostics.some((d) => d.type === 'error');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0d14] text-[#e1e2ec] font-sans bg-substratum-grid min-w-0">
      {/* 1. Systems Top Navigation Bar */}
      {/* 1. Systems Top Navigation Bar (Clean & Uncluttered) */}
      <TopBar
        isRunning={isRunning}
        onRun={handleRun}
        onTest={handleTest}
        onFormat={handleFormat}
        onClippy={handleClippy}
        onInspectAsm={() => {
          const event = new CustomEvent('switch-inspector-tab', { detail: 'asm' });
          window.dispatchEvent(event);
          if (window.innerWidth < 1024) {
            setActiveMobileView('inspector');
          }
        }}
        channel={channel}
        edition={edition}
        mode={mode}
        onOpenToolchainSettings={() => {
          setSidebarActiveTab('toolchain');
          setIsSidebarOpen(true);
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenAcademy={() => setSidebarActiveTab('academy')}
        onOpenShare={() => setIsShareOpen(true)}
        academyProgress={academyProgress}
        activeMobileView={activeMobileView}
        onToggleMobileView={setActiveMobileView}
        activeFileName={activeFile?.name || 'main.rs'}
      />

      {/* 2. Responsive Systems Workbench Area */}
      <div className="flex-1 flex overflow-hidden relative min-w-0 min-h-0">
        {/* Left Pane: Desktop Activity Rail + Retractable Drawer */}
        <div className="hidden lg:flex h-full shrink-0">
          <Sidebar
            files={files}
            activeFilePath={activeFilePath}
            onSelectFile={setActiveFilePath}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onSelectLesson={(lId) => {
              setActiveLessonId(lId);
            }}
            onOpenAcademyModal={() => setSidebarActiveTab('academy')}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            totalXp={totalXp}
            onLoadCapstone={handleLoadCapstone}
            onInsertCrate={handleAddCrate}
            onOpenCargoModal={() => setIsCargoOpen(true)}
            onInsertSnippet={handleLoadSnippet}
            onOpenCookbookModal={() => setIsCookbookOpen(true)}
            onJumpToLine={(line) => setJumpToLine(line)}
            channel={channel}
            setChannel={setChannel}
            mode={mode}
            setMode={setMode}
            edition={edition}
            setEdition={setEdition}
            onInspectAsm={() => {
              const event = new CustomEvent('switch-inspector-tab', { detail: 'asm' });
              window.dispatchEvent(event);
            }}
            onOpenDsaLab={() => setIsDsaLabOpen(true)}
            onOpenBorrowGuide={() => setIsBorrowGuideOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onResetWorkspace={handleResetWorkspace}
            isDrawerOpen={isSidebarOpen}
            onToggleDrawer={() => setIsSidebarOpen(!isSidebarOpen)}
            activeTab={sidebarActiveTab}
            setActiveTab={setSidebarActiveTab}
          />
        </div>

        {/* Mobile Sidebar Overlay (< 1024px) */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <div className="relative z-10 h-full shadow-2xl">
              <Sidebar
                files={files}
                activeFilePath={activeFilePath}
                onSelectFile={(p) => {
                  setActiveFilePath(p);
                  setIsSidebarOpen(false);
                }}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onSelectLesson={(lId) => {
                  setActiveLessonId(lId);
                  setIsSidebarOpen(false);
                }}
                onOpenAcademyModal={() => {
                  setSidebarActiveTab('academy');
                  setIsSidebarOpen(false);
                }}
                activeLessonId={activeLessonId}
                completedLessonIds={completedLessonIds}
                totalXp={totalXp}
                onLoadCapstone={(capId) => {
                  handleLoadCapstone(capId);
                  setIsSidebarOpen(false);
                }}
                onInsertCrate={handleAddCrate}
                onOpenCargoModal={() => {
                  setIsCargoOpen(true);
                  setIsSidebarOpen(false);
                }}
                onInsertSnippet={(code) => {
                  handleLoadSnippet(code);
                  setIsSidebarOpen(false);
                }}
                onOpenCookbookModal={() => {
                  setIsCookbookOpen(true);
                  setIsSidebarOpen(false);
                }}
                onJumpToLine={(line) => {
                  setJumpToLine(line);
                  setIsSidebarOpen(false);
                  setActiveMobileView('editor');
                }}
                channel={channel}
                setChannel={setChannel}
                mode={mode}
                setMode={setMode}
                edition={edition}
                setEdition={setEdition}
                onInspectAsm={() => {
                  const event = new CustomEvent('switch-inspector-tab', { detail: 'asm' });
                  window.dispatchEvent(event);
                  setIsSidebarOpen(false);
                  setActiveMobileView('inspector');
                }}
                onOpenDsaLab={() => {
                  setIsDsaLabOpen(true);
                  setIsSidebarOpen(false);
                }}
                onOpenBorrowGuide={() => {
                  setIsBorrowGuideOpen(true);
                  setIsSidebarOpen(false);
                }}
                onOpenShortcuts={() => {
                  setIsShortcutsOpen(true);
                  setIsSidebarOpen(false);
                }}
                onResetWorkspace={() => {
                  handleResetWorkspace();
                  setIsSidebarOpen(false);
                }}
                isDrawerOpen={true}
                onToggleDrawer={() => setIsSidebarOpen(false)}
                activeTab={sidebarActiveTab}
                setActiveTab={setSidebarActiveTab}
              />
            </div>
          </div>
        )}

        {/* Center Pane: Code Editor or Inline Academy */}
        <div className={`flex-1 min-w-0 h-full ${sidebarActiveTab === 'academy' ? 'flex' : activeMobileView === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          {sidebarActiveTab === 'academy' ? (
            <AcademyModal
              isOpen={true}
              inline
              onClose={() => {
                setSidebarActiveTab('files');
                setActiveMobileView('editor');
              }}
              activeLessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
              completedLessonIds={completedLessonIds}
              onCompleteLesson={(id, xp) => {
                setCompletedLessonIds((prev) => new Set([...prev, id]));
                setTotalXp((prev) => prev + xp);
              }}
              onLoadCode={handleLoadSnippet}
            />
          ) : (
            <CodeEditor
              files={files}
              activeFilePath={activeFilePath}
              onSelectFile={setActiveFilePath}
              onCloseFile={(path) => handleDeleteFile(path)}
              onCodeChange={handleCodeChange}
              diagnostics={diagnostics}
              onApplyFix={handleApplyFix}
              edition={edition}
              jumpToLine={jumpToLine}
            />
          )}
        </div>

        {/* Right Pane: Telemetry, Terminal, Memory Visualizer & ASM (hidden when academy is open) */}
        {sidebarActiveTab !== 'academy' && (
          <div className={`h-full ${activeMobileView === 'inspector' ? 'flex flex-1 lg:flex-none' : 'hidden lg:flex'}`}>
            <InspectorPanel
              stdout={stdout}
              stderr={stderr}
              isRunning={isRunning}
              durationMs={durationMs}
              exitDetail={exitDetail}
              onClearTerminal={() => {
                setStdout('');
                setStderr('');
                setDiagnostics([]);
              }}
              diagnostics={diagnostics}
              onSelectDiagnostic={(diag) => {
                if (diag.line) {
                  setJumpToLine(diag.line);
                  if (window.innerWidth < 1024) {
                    setActiveMobileView('editor');
                  }
                }
              }}
              onApplyFix={handleApplyFix}
              code={activeFile?.content || ''}
              edition={edition}
              onJumpToErrorLine={(line) => {
                setJumpToLine(line);
                if (window.innerWidth < 1024) {
                  setActiveMobileView('editor');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* 3. Bottom Aerospace Telemetry Status Bar */}
      <TelemetryBar
        channel={channel}
        edition={edition}
        mode={mode}
        hasErrors={hasErrors}
        hasUnsafe={hasUnsafe}
        isCompiling={isRunning}
        latencyMs={durationMs || 340}
      />

      {/* Modals & Overlay Drawers */}
      <DsaLabModal
        isOpen={isDsaLabOpen}
        onClose={() => setIsDsaLabOpen(false)}
        onLoadCode={handleLoadSnippet}
      />

      <BorrowGuideModal
        isOpen={isBorrowGuideOpen}
        onClose={() => setIsBorrowGuideOpen(false)}
        onLoadCode={handleLoadSnippet}
      />

      <CargoManager
        isOpen={isCargoOpen}
        onClose={() => setIsCargoOpen(false)}
        onAddCrate={handleAddCrate}
        onLoadSnippet={handleLoadSnippet}
      />

      <CookbookModal
        isOpen={isCookbookOpen}
        onClose={() => setIsCookbookOpen(false)}
        onLoadSnippet={handleLoadSnippet}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        files={files}
      />
    </div>
  );
}
