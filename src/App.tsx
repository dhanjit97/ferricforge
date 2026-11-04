import React, { useState, useEffect, useCallback } from 'react';
import {
  RustChannel,
  RustMode,
  RustEdition,
  RustCrateType,
  OutputTarget,
  ExecuteResponse,
  ParsedDiagnostic,
  RustSnippet,
  WorkspaceFile,
  OptimizationResult,
} from './types/rust';
import { CurriculumLesson, UserProgress } from './types/curriculum';
import { parseRustcDiagnostics } from './utils/diagnosticParser';
import { RUST_SNIPPETS } from './utils/rustSnippets';
import {
  INITIAL_USER_PROGRESS,
  CURRICULUM_LESSONS,
  calculateLevelFromXp,
  migrateUserProgress,
} from './utils/curriculumData';
import {
  bundleWorkspace,
  mapDiagnosticToWorkspace,
  addModDeclaration,
  removeModDeclaration,
  hasModDeclaration,
  getModuleNameFromPath,
  sanitizeWorkspaceFiles,
} from './utils/workspaceBundler';

import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CodeEditor } from './components/CodeEditor';
import { TerminalOutput } from './components/TerminalOutput';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { AssemblyViewer } from './components/AssemblyViewer';
import { CargoManager } from './components/CargoManager';
import { CookbookModal } from './components/CookbookModal';
import { ShareModal } from './components/ShareModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { BorrowGuideModal } from './components/BorrowGuideModal';
import { ClippyModal } from './components/ClippyModal';
import { OptimizerModal } from './components/OptimizerModal';
import { AcademyModal } from './components/AcademyModal';
import { ReferenceHubModal } from './components/ReferenceHubModal';
import { AppTheme, LayoutMode } from './types/theme';

import {
  Terminal as TerminalIcon,
  AlertCircle,
  Cpu,
  Package,
  Trophy,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeClipboardWrite,
  sanitizeCodeInput,
} from './utils/security';

const DEFAULT_CARGO_TOML = `[package]
name = "playground"
version = "0.1.0"
edition = "2021"

[dependencies]
# Click 'Crate Explorer' to add tokio, serde, rand, etc.
`;

// Strip internal/stack-trace details from client-facing error messages.
function safeClientError(message: string): string {
  return String(message)
    .replace(/at [^\n]*/g, '')
    .replace(/\([^)]*:\d+:\d+\)/g, '')
    .replace(/Error: /g, '')
    .trim() || 'An unexpected error occurred.';
}

// Helper to fetch JSON and throw on non-ok responses.
async function fetchJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Server error (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

const INITIAL_MAIN_RS = `mod math;

fn main() {
    println!("--- Multi-File Rust Workspace ---");
    let sum = math::add(15, 27);
    let fib = math::fibonacci(8);
    println!("math::add(15, 27) = {}", sum);
    println!("math::fibonacci(8) = {}", fib);
}
`;

const INITIAL_MATH_RS = `//! Math utilities module

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0;
            let mut b = 1;
            for _ in 2..=n {
                let next = a + b;
                a = b;
                b = next;
            }
            b
        }
    }
}
`;

export default function App() {
  // Playground settings
  const [channel, setChannel] = useState<RustChannel>('stable');
  const [mode, setMode] = useState<RustMode>('debug');
  const [edition, setEdition] = useState<RustEdition>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const ed = params.get('edition');
      if (ed === '2015' || ed === '2018' || ed === '2021' || ed === '2024') {
        return ed;
      }
    }
    return '2021';
  });
  const [crateType, setCrateType] = useState<RustCrateType>('bin');
  const [target, setTarget] = useState<OutputTarget>('execute');
  const [backtrace, setBacktrace] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = safeLocalStorageGet<'dark' | 'light'>('ferrisforge_theme', 'dark');
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'dark';
  });
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = safeLocalStorageGet<AppTheme>('ferrisforge_app_theme', 'glassmorphism');
      if (stored) return stored;
    }
    return 'glassmorphism';
  });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = safeLocalStorageGet<LayoutMode>('ferrisforge_layout_mode', 'split');
      if (stored) return stored;
    }
    return 'split';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [customSplit, setCustomSplit] = useState<number | null>(null);

  // Academy & Progression State (Persisted in localStorage)
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    if (typeof window !== 'undefined') {
      const stored = safeLocalStorageGet<unknown>('ferrisforge_user_progress', null);
      if (stored) {
        try {
          return migrateUserProgress(stored);
        } catch (e) {
          console.error('Failed to migrate user progress:', e);
        }
      }
    }
    return INITIAL_USER_PROGRESS;
  });

  const [celebrationBanner, setCelebrationBanner] = useState<{
    title: string;
    message: string;
    xpGained: number;
    isError?: boolean;
  } | null>(null);

  const [isVerifyingExercise, setIsVerifyingExercise] = useState(false);

  // Sync userProgress to localStorage
  useEffect(() => {
    safeLocalStorageSet('ferrisforge_user_progress', userProgress);
  }, [userProgress]);

  // Multi-File Workspace
  const [files, setFiles] = useState<WorkspaceFile[]>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const workspaceParam = params.get('workspace');
      const codeParam = params.get('code');

      const rawList = workspaceParam
        ? (() => {
            try {
              const parsed = JSON.parse(decodeURIComponent(workspaceParam));
              return Array.isArray(parsed) ? parsed : null;
            } catch (e) {
              console.error('Failed to parse workspace from URL:', e);
              return null;
            }
          })()
        : null;

      if (rawList) {
        return sanitizeWorkspaceFiles(rawList, INITIAL_MAIN_RS, DEFAULT_CARGO_TOML);
      }

      if (codeParam) {
        return sanitizeWorkspaceFiles(
          [{ p: 'src/main.rs', c: decodeURIComponent(codeParam) }],
          INITIAL_MAIN_RS,
          DEFAULT_CARGO_TOML
        );
      }
    }

    return [
      {
        path: 'src/main.rs',
        name: 'main.rs',
        content: INITIAL_MAIN_RS,
        isEntry: true,
      },
      {
        path: 'src/math.rs',
        name: 'math.rs',
        content: INITIAL_MATH_RS,
      },
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        content: DEFAULT_CARGO_TOML,
      },
    ];
  });

  const [activeFilePath, setActiveFilePath] = useState<string>('src/main.rs');

  // Execution & Diagnostics state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecuteResponse | null>(null);
  const [asmOutput, setAsmOutput] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<ParsedDiagnostic[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics' | 'asm' | 'cargo'>('terminal');

  // Modals state
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [isCookbookOpen, setIsCookbookOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isBorrowGuideOpen, setIsBorrowGuideOpen] = useState(false);
  const [isClippyOpen, setIsClippyOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isReferenceHubOpen, setIsReferenceHubOpen] = useState(false);
  const [academySection, setAcademySection] = useState<'curriculum' | 'frameworks' | 'capstones' | 'memory-explorer' | 'dsa'>('curriculum');
  const [optimizationData, setOptimizationData] = useState<OptimizationResult | null>(null);

  // Sync theme with HTML document class & data-mode attribute
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-mode', 'light');
    }
  }, [theme]);

  // Sync app visual theme to html element and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
    safeLocalStorageSet('ferrisforge_app_theme', appTheme);
  }, [appTheme]);

  // Sync dark/light mode to localStorage
  useEffect(() => {
    try {
      safeLocalStorageSet('ferrisforge_theme', theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }, [theme]);

  // Cross-tab/window theme sync: when another tab changes theme, apply it here too
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ferrisforge_app_theme' && e.newValue) {
        try {
          setAppTheme(e.newValue as AppTheme);
        } catch {}
      }
      if (e.key === 'ferrisforge_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue as 'dark' | 'light');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync layout mode to localStorage
  useEffect(() => {
    safeLocalStorageSet('ferrisforge_layout_mode', layoutMode);
  }, [layoutMode]);

  // Reset manual split when a layout preset is selected
  useEffect(() => {
    setCustomSplit(null);
  }, [layoutMode]);

  // Active file helper
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];
  const mainFile = files.find((f) => f.path === 'src/main.rs') || files[0];
  const cargoFile = files.find((f) => f.path === 'Cargo.toml');
  const cargoToml = cargoFile?.content || DEFAULT_CARGO_TOML;

  const levelInfo = calculateLevelFromXp(userProgress.totalXp);

  const handleChangeFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
  };

  const handleCreateModule = (modName: string, declareInMain: boolean, initialContent?: string) => {
    const cleanModName = modName.trim().replace(/\.rs$/, '');
    const path = `src/${cleanModName}.rs`;
    const name = `${cleanModName}.rs`;

    if (files.some((f) => f.path === path)) {
      setActiveFilePath(path);
      return;
    }

    const content =
      initialContent ||
      `//! Module ${cleanModName}\n\npub fn hello_${cleanModName}() {\n    println!("Hello from module ${cleanModName}!");\n}\n`;

    const newFile: WorkspaceFile = {
      path,
      name,
      content,
    };

    let updatedFiles = [...files, newFile];

    if (declareInMain) {
      const currentMain = files.find((f) => f.path === 'src/main.rs');
      if (currentMain) {
        const updatedMain = addModDeclaration(currentMain.content, cleanModName);
        updatedFiles = updatedFiles.map((f) =>
          f.path === 'src/main.rs' ? { ...f, content: updatedMain } : f
        );
      }
    }

    setFiles(updatedFiles);
    setActiveFilePath(path);
  };

  const handleDeleteModule = (path: string) => {
    if (path === 'src/main.rs' || path === 'Cargo.toml') return;
    const modName = getModuleNameFromPath(path);

    let updatedFiles = files.filter((f) => f.path !== path);
    const currentMain = files.find((f) => f.path === 'src/main.rs');
    if (currentMain && hasModDeclaration(currentMain.content, modName)) {
      const updatedMain = removeModDeclaration(currentMain.content, modName);
      updatedFiles = updatedFiles.map((f) =>
        f.path === 'src/main.rs' ? { ...f, content: updatedMain } : f
      );
    }

    setFiles(updatedFiles);
    if (activeFilePath === path) {
      setActiveFilePath('src/main.rs');
    }
  };

  const handleToggleModDeclaration = (modName: string) => {
    const currentMain = files.find((f) => f.path === 'src/main.rs');
    if (!currentMain) return;

    const isDeclared = hasModDeclaration(currentMain.content, modName);
    const updatedMain = isDeclared
      ? removeModDeclaration(currentMain.content, modName)
      : addModDeclaration(currentMain.content, modName);

    setFiles((prev) =>
      prev.map((f) => (f.path === 'src/main.rs' ? { ...f, content: updatedMain } : f))
    );
  };

  // Run / Compile / Test / Clippy with Workspace Bundler
  const handleRun = useCallback(async (targetOverride?: OutputTarget) => {
    const activeTarget = targetOverride || target;
    setIsRunning(true);
    const startTime = performance.now();

    const { bundledCode, lineMappings } = bundleWorkspace(files);

    try {
      if (activeTarget === 'execute') {
        const data = await fetchJson('/api/execute', {
          channel,
          mode,
          edition,
          crateType,
          tests: false,
          code: bundledCode,
          backtrace,
        });
        const durationMs = Math.round(performance.now() - startTime);
        setExecutionResult({ ...data, durationMs });

        const rawDiagnostics = parseRustcDiagnostics(data.stderr || '');
        const mappedDiags = rawDiagnostics.map((d) =>
          mapDiagnosticToWorkspace(d, lineMappings)
        );
        setDiagnostics(mappedDiags);

        if (mappedDiags.some((d) => d.type === 'error')) {
          setActiveTab('diagnostics');
          const firstErr = mappedDiags.find((d) => d.type === 'error');
          if (firstErr?.file) {
            setActiveFilePath(firstErr.file);
            setSelectedLine(firstErr.line);
          }
        } else {
          setActiveTab('terminal');
        }
      } else if (activeTarget === 'test') {
        const data = await fetchJson('/api/execute', {
          channel,
          mode,
          edition,
          crateType,
          tests: true,
          code: bundledCode,
          backtrace,
        });
        const durationMs = Math.round(performance.now() - startTime);
        setExecutionResult({ ...data, durationMs });

        const rawDiagnostics = parseRustcDiagnostics(data.stderr || '');
        const mappedDiags = rawDiagnostics.map((d) =>
          mapDiagnosticToWorkspace(d, lineMappings)
        );
        setDiagnostics(mappedDiags);
        setActiveTab('terminal');
      } else if (activeTarget === 'clippy') {
        const data = await fetchJson('/api/clippy', {
          channel,
          edition,
          crateType,
          code: bundledCode,
        });
        const durationMs = Math.round(performance.now() - startTime);
        setExecutionResult({ ...data, durationMs });

        const rawDiagnostics = parseRustcDiagnostics(data.stderr || '');
        const mappedDiags = rawDiagnostics.map((d) =>
          mapDiagnosticToWorkspace(d, lineMappings)
        );
        setDiagnostics(mappedDiags);
        setActiveTab('diagnostics');
      } else if (
        activeTarget === 'asm' ||
        activeTarget === 'llvm-ir' ||
        activeTarget === 'hir' ||
        activeTarget === 'mir' ||
        activeTarget === 'wasm' ||
        activeTarget === 'expand'
      ) {
        const data = await fetchJson('/api/compile', {
          channel,
          mode,
          edition,
          crateType,
          tests: false,
          backtrace,
          target: activeTarget,
          code: bundledCode,
        });
        const durationMs = Math.round(performance.now() - startTime);
        setExecutionResult({ ...data, durationMs });
        setAsmOutput(data.code || data.stdout || '');
        setActiveTab('asm');
      }
    } catch (err: unknown) {
      setExecutionResult({
        success: false,
        error: `Failed to communicate with compiler: ${safeClientError(err instanceof Error ? err.message : String(err))}`,
      });
      setActiveTab('terminal');
    } finally {
      setIsRunning(false);
    }
  }, [channel, mode, edition, crateType, target, files, backtrace]);

  // Format active file with rustfmt
  const handleFormat = useCallback(async () => {
    if (!activeFile.path.endsWith('.rs')) return;

    setIsFormatting(true);
    try {
      const data = await fetchJson('/api/format', {
        edition,
        code: activeFile.content,
      });
      if (data.success && data.code) {
        handleChangeFileContent(activeFile.path, data.code);
      }
    } catch (err) {
      console.error('Format failed:', err);
    } finally {
      setIsFormatting(false);
    }
  }, [edition, activeFile]);

  // AI Optimizer (optimizes active file preserving multi-file architecture)
  const handleOptimize = async () => {
    setIsOptimizing(true);
    setIsOptimizerOpen(true);

    try {
      const data = await fetchJson('/api/optimize', { code: activeFile.content });
      setOptimizationData(data);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Generate Unit Tests
  const handleGenerateTests = async () => {
    setIsRunning(true);
    const { bundledCode } = bundleWorkspace(files);

    try {
      const data = await fetchJson('/api/generate-tests', { code: bundledCode });
      if (data.testModuleCode) {
        handleCreateModule('tests', true, data.testModuleCode);
      }
    } catch (err) {
      console.error('Generate tests failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Academy: Unlock progressive hint
  const handleUnlockHint = (lessonId: string, hintIndex: number) => {
    setUserProgress((prev) => {
      const current = prev.unlockedHintIndices[lessonId] || [];
      if (current.includes(hintIndex)) return prev;

      return {
        ...prev,
        unlockedHintIndices: {
          ...prev.unlockedHintIndices,
          [lessonId]: [...current, hintIndex],
        },
      };
    });
  };

  // Academy: Load exercise starter code
  const handleLoadExercise = (starterCode: string) => {
    setFiles([
      {
        path: 'src/main.rs',
        name: 'main.rs',
        content: starterCode,
        isEntry: true,
      },
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        content: DEFAULT_CARGO_TOML,
      },
    ]);
    setActiveFilePath('src/main.rs');
    setDiagnostics([]);
    setExecutionResult(null);
  };

  // Academy: Load entire multi-file capstone project into workspace
  const handleLoadProjectWorkspace = (newFiles: WorkspaceFile[]) => {
    setFiles(newFiles);
    const entry = newFiles.find((f) => f.isEntry) || newFiles[0];
    setActiveFilePath(entry ? entry.path : 'src/main.rs');
    setIsAcademyOpen(false);
    setDiagnostics([]);
    setExecutionResult(null);
    setCelebrationBanner({
      title: 'Capstone Project Loaded into Workspace!',
      message: `Multi-file architecture loaded with ${newFiles.length} files. Inspect modules or click Run!`,
      xpGained: 30,
    });
    setUserProgress((prev) => {
      const nextXp = prev.totalXp + 30;
      const nextLevelInfo = calculateLevelFromXp(nextXp);
      return {
        ...prev,
        totalXp: nextXp,
        level: nextLevelInfo.level,
        levelTitle: nextLevelInfo.title,
      };
    });
  };

  // Academy: Verify exercise solution against test suite
  const handleVerifyExercise = async (lesson: CurriculumLesson) => {
    setIsVerifyingExercise(true);
    const { bundledCode } = bundleWorkspace(files);

    try {
      const data = await fetchJson('/api/execute', {
        channel: 'stable',
        mode: 'debug',
        edition: '2021',
        crateType: 'bin',
        tests: true,
        code: bundledCode,
        backtrace: false,
      });

      setExecutionResult(data);
      setActiveTab('terminal');

      // Check if tests passed: compile succeeded AND rustc reports "test result: ok"
      // (rustc prints "test result: ok. N passed" on stdout when all tests pass;
      // any failure prints "test result: FAILED" and/or a non-zero exit).
      const outputText = `${data.stdout || ''}\n${data.stderr || ''}`;
      const testsPassed =
        data.success &&
        /test result:\s*ok/.test(outputText) &&
        !/test result:\s*FAILED/.test(outputText);

      if (testsPassed) {
        const isNewCompletion = !userProgress.completedLessonIds.includes(lesson.id);

        if (isNewCompletion) {
          const nextXp = userProgress.totalXp + lesson.xpReward;
          const nextLevelInfo = calculateLevelFromXp(nextXp);

          setUserProgress((prev) => ({
            ...prev,
            totalXp: nextXp,
            level: nextLevelInfo.level,
            levelTitle: nextLevelInfo.title,
            completedLessonIds: [...prev.completedLessonIds, lesson.id],
          }));

          setCelebrationBanner({
            title: `Challenge Mastered: ${lesson.title}`,
            message: `All test assertions verified! You earned +${lesson.xpReward} XP. Rank: Level ${nextLevelInfo.level} ${nextLevelInfo.title}`,
            xpGained: lesson.xpReward,
          });
        } else {
          setCelebrationBanner({
            title: `Solution Re-Verified!`,
            message: `All test assertions pass cleanly.`,
            xpGained: 0,
          });
        }
      } else {
        setCelebrationBanner({
          title: 'Exercise Verification Incomplete',
          message: 'Some test assertions did not pass yet. Check the Terminal output tab on the right to inspect failed assertions and review hints in the Academy!',
          xpGained: 0,
          isError: true,
        });
      }
    } catch (err: unknown) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifyingExercise(false);
    }
  };

  // Academy: Score knowledge check submission and persist results
  const handleKnowledgeCheckSubmit = useCallback(
    (lessonId: string, answers: number[]) => {
      const lesson = CURRICULUM_LESSONS.find((l) => l.id === lessonId);
      if (!lesson?.knowledgeCheck) return;

      const questionResults: boolean[] = [];
      let correct = 0;

      lesson.knowledgeCheck.forEach((q, idx) => {
        const selected = answers[idx];
        const isCorrect = selected === q.correctAnswerIndex;
        questionResults.push(isCorrect);
        if (isCorrect) correct += 1;
      });

      const allCorrect = correct === lesson.knowledgeCheck.length;

      setUserProgress((prev) => {
        const nextXp = allCorrect ? prev.totalXp + Math.floor(lesson.xpReward / 2) : prev.totalXp;
        const nextLevelInfo = calculateLevelFromXp(nextXp);

        return {
          ...prev,
          totalXp: nextXp,
          level: nextLevelInfo.level,
          levelTitle: nextLevelInfo.title,
          knowledgeCheckResults: {
            ...prev.knowledgeCheckResults,
            [lessonId]: questionResults,
          },
        };
      });

      if (allCorrect) {
        setCelebrationBanner({
          title: 'Knowledge Check Perfect!',
          message: `You answered all ${correct} questions correctly for "${lesson.title}". Bonus +${Math.floor(lesson.xpReward / 2)} XP!`,
          xpGained: Math.floor(lesson.xpReward / 2),
        });
      } else {
        setCelebrationBanner({
          title: 'Knowledge Check Submitted',
          message: `You scored ${correct}/${lesson.knowledgeCheck.length}. Review the explanations and try again!`,
          xpGained: 0,
        });
      }
    },
    [CURRICULUM_LESSONS]
  );

  // Keybindings listener: Ctrl+Enter (Run) & Ctrl+S (Format)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, handleFormat]);

  const handleSelectSnippet = (snippet: RustSnippet) => {
    handleChangeFileContent('src/main.rs', snippet.code);
    setActiveFilePath('src/main.rs');
    setEdition(snippet.edition);
    if (snippet.mode) setMode(snippet.mode);
    setDiagnostics([]);
    setExecutionResult(null);
  };

  const handleInsertImport = (importSnippet: string) => {
    if (!mainFile.content.includes(importSnippet)) {
      handleChangeFileContent('src/main.rs', `${importSnippet}\n${mainFile.content}`);
    }
  };

  const errorCount = diagnostics.filter((d) => d.type === 'error').length;
  const warningCount = diagnostics.filter((d) => d.type === 'warning').length;

  const editorPaneStyle = customSplit !== null ? { width: `${customSplit}%` } : {};
  const inspectorPaneStyle = customSplit !== null ? { width: `${100 - customSplit}%` } : {};

  const editorWidth =
    layoutMode === 'zen'
      ? 'w-full md:w-[70%]'
      : layoutMode === 'analysis'
      ? 'w-full md:w-[35%]'
      : 'w-full md:w-1/2';

  const inspectorWidth =
    layoutMode === 'zen'
      ? 'w-full md:w-[30%]'
      : layoutMode === 'analysis'
      ? 'w-full md:w-[65%]'
      : 'w-full md:w-1/2';

  return (
    <div
      data-theme={appTheme}
      data-mode={theme}
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans antialiased transition-colors ${
        theme === 'dark'
          ? 'bg-neutral-900 text-neutral-100'
          : 'bg-white text-neutral-900'
      }`}
    >
      {/* Celebration / Notification Banner */}
      {celebrationBanner && (
        <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium shadow-md animate-fade-in fixed inset-x-0 top-0 z-50 ${
          celebrationBanner.isError
            ? 'bg-gradient-to-r from-red-700 via-amber-700 to-[#DE3804] text-white'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-[#DE3804] text-white'
        }`}>
          <div className="flex items-center gap-2">
            {celebrationBanner.isError ? (
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            ) : (
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span className="font-bold">{celebrationBanner.title}:</span>
            <span>{celebrationBanner.message}</span>
          </div>
          <button
            onClick={() => setCelebrationBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 hover:bg-black/20 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Top Navigation Bar with Logo and Academy Badge */}
      <TopBar
        isRunning={isRunning}
        onRun={() => handleRun()}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* 2. Developer Toolbar (controls moved to Sidebar) */}

      {/* 3. Main Workspace Split: Sidebar (optional) + Code Editor (Left) & Inspector (Right) */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenAcademy={() => { setAcademySection('curriculum'); setIsAcademyOpen(true); }}
            onOpenDsaLab={() => { setAcademySection('dsa'); setIsAcademyOpen(true); }}
            onOpenReferenceHub={() => setIsReferenceHubOpen(true)}
            onOpenCookbook={() => setIsCookbookOpen(true)}
            onOpenBorrowGuide={() => setIsBorrowGuideOpen(true)}
            onOpenCrates={() => setActiveTab('cargo')}
            onOpenClippyInfo={() => setIsClippyOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenShare={() => setIsShareOpen(true)}
            appTheme={appTheme}
            onChangeAppTheme={setAppTheme}
            layoutMode={layoutMode}
            onChangeLayoutMode={setLayoutMode}
            channel={channel}
            setChannel={setChannel}
            mode={mode}
            setMode={setMode}
            edition={edition}
            setEdition={setEdition}
            crateType={crateType}
            setCrateType={setCrateType}
            target={target}
            setTarget={setTarget}
            setActiveTab={setActiveTab}
            backtrace={backtrace}
            setBacktrace={setBacktrace}
            onFormat={handleFormat}
            isFormatting={isFormatting}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            onGenerateTests={handleGenerateTests}
            isGeneratingTests={isRunning}
            onResetCode={() => {
              setFiles([
                {
                  path: 'src/main.rs',
                  name: 'main.rs',
                  content: INITIAL_MAIN_RS,
                  isEntry: true,
                },
                {
                  path: 'src/math.rs',
                  name: 'math.rs',
                  content: INITIAL_MATH_RS,
                },
                {
                  path: 'Cargo.toml',
                  name: 'Cargo.toml',
                  content: DEFAULT_CARGO_TOML,
                },
              ]);
              setActiveFilePath('src/main.rs');
              setDiagnostics([]);
              setExecutionResult(null);
            }}
            totalXp={userProgress.totalXp}
            levelTitle={levelInfo.title}
            levelNumber={levelInfo.level}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0d1117]/50 border-b border-neutral-800 text-xs z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Split:</span>
              {[20, 30, 40, 50, 60, 70, 80].map((p) => (
                <button
                  key={p}
                  onClick={() => setCustomSplit(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    customSplit === p ? 'bg-[#DE3804] text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {p}%
                </button>
              ))}
              <button
                onClick={() => setCustomSplit(null)}
                className="px-2 py-0.5 rounded text-[10px] font-medium text-neutral-400 hover:text-white cursor-pointer"
              >
                Auto
              </button>
            </div>
            <div className="text-neutral-500 text-[10px]">
              Editor {customSplit ?? (layoutMode === 'zen' ? 70 : layoutMode === 'analysis' ? 30 : 50)}% •
              Inspector {100 - (customSplit ?? (layoutMode === 'zen' ? 70 : layoutMode === 'analysis' ? 30 : 50))}%
            </div>
          </div>

          {/* Panes container: editor + inspector responsive split */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left Pane: Multi-File Code Editor */}
          <div
            className={`${editorWidth} h-1/2 md:h-full flex flex-col transition-all duration-200 ease-in-out`}
            style={editorPaneStyle}
          >
            <CodeEditor
              files={files}
              activeFilePath={activeFilePath}
              onSelectFile={setActiveFilePath}
              onChangeFileContent={handleChangeFileContent}
              onCreateModule={handleCreateModule}
              onDeleteModule={handleDeleteModule}
              onToggleModDeclaration={handleToggleModDeclaration}
              diagnostics={diagnostics}
              selectedLine={selectedLine}
              onSelectLine={(l, file) => {
                if (file && file !== activeFilePath) {
                  setActiveFilePath(file);
                }
                setSelectedLine(l);
                setActiveTab('diagnostics');
              }}
            />
          </div>

          {/* Right Pane: Multi-Target Inspector Drawer */}
          <div
            className={`${inspectorWidth} h-1/2 md:h-full flex flex-col border-t md:border-t-0 md:border-l border-neutral-800 bg-[#0d1117] transition-all duration-200 ease-in-out`}
            style={inspectorPaneStyle}
          >
            {/* Tab Selection Bar */}
            <div className="flex items-center justify-between px-3 border-b border-neutral-800 bg-[#161b22] text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'terminal'
                      ? 'border-[#DE3804] text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Output / Terminal</span>
                </button>

                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'diagnostics'
                      ? 'border-[#DE3804] text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Diagnostics</span>
                  {(errorCount > 0 || warningCount > 0) && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        errorCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                      }`}
                    >
                      {errorCount > 0 ? errorCount : warningCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('asm')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'asm'
                      ? 'border-[#DE3804] text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Assembly (ASM)</span>
                </button>

                <button
                  onClick={() => setActiveTab('cargo')}
                  className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${
                    activeTab === 'cargo'
                      ? 'border-[#DE3804] text-white bg-neutral-800/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Cargo & Workspace</span>
                </button>
              </div>
            </div>

            {/* Active Tab View */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'terminal' && (
                <TerminalOutput
                  result={executionResult}
                  isRunning={isRunning}
                  onClear={() => setExecutionResult(null)}
                />
              )}

              {activeTab === 'diagnostics' && (
                <DiagnosticsPanel
                  diagnostics={diagnostics}
                  code={activeFile.content}
                  files={files}
                  stderr={executionResult?.stderr || ''}
                  onSelectLine={(l, file) => {
                    if (file && file !== activeFilePath) {
                      setActiveFilePath(file);
                    }
                    setSelectedLine(l);
                  }}
                  onApplyFix={(fixedCode, file) => {
                    const targetPath = file || activeFilePath;
                    handleChangeFileContent(targetPath, fixedCode);
                    setDiagnostics([]);
                  }}
                />
              )}

              {activeTab === 'asm' && (
                <AssemblyViewer
                  asmCode={asmOutput}
                  isCompiling={isRunning}
                  onRefreshAsm={handleRun}
                />
              )}

              {activeTab === 'cargo' && (
                <CargoManager
                  files={files}
                  cargoToml={cargoToml}
                  onChangeCargoToml={(newToml) =>
                    handleChangeFileContent('Cargo.toml', newToml)
                  }
                  onSelectFile={setActiveFilePath}
                  onCreateModule={handleCreateModule}
                  onDeleteModule={handleDeleteModule}
                  onToggleModDeclaration={handleToggleModDeclaration}
                  onInsertImport={handleInsertImport}
                />
              )}
            </div>
          </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AcademyModal
        isOpen={isAcademyOpen}
        onClose={() => setIsAcademyOpen(false)}
        initialSection={academySection}
        progress={userProgress}
        onUnlockHint={handleUnlockHint}
        onLoadExerciseToEditor={handleLoadExercise}
        onVerifyExercise={handleVerifyExercise}
        isVerifying={isVerifyingExercise}
        onLoadProjectWorkspace={handleLoadProjectWorkspace}
        onKnowledgeCheckSubmit={handleKnowledgeCheckSubmit}
      />

      <CookbookModal
        isOpen={isCookbookOpen}
        onClose={() => setIsCookbookOpen(false)}
        onSelectSnippet={handleSelectSnippet}
      />

      

      <BorrowGuideModal
        isOpen={isBorrowGuideOpen}
        onClose={() => setIsBorrowGuideOpen(false)}
        onLoadSnippet={(c) => {
          handleChangeFileContent('src/main.rs', c);
          setActiveFilePath('src/main.rs');
          setDiagnostics([]);
        }}
      />

      <ClippyModal
        isOpen={isClippyOpen}
        onClose={() => setIsClippyOpen(false)}
        onRunClippy={() => {
          setTarget('clippy');
          handleRun('clippy');
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        files={files}
        edition={edition}
      />

      <OptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        isLoading={isOptimizing}
        optimizationData={optimizationData}
        targetFileName={activeFile.name}
        onApplyRecommendedCode={(refactored) => {
          handleChangeFileContent(activeFilePath, refactored);
          setDiagnostics([]);
        }}
      />

      <ReferenceHubModal
        isOpen={isReferenceHubOpen}
        onClose={() => setIsReferenceHubOpen(false)}
        onLoadSnippetToEditor={(code) => {
          handleChangeFileContent('src/main.rs', code);
          setActiveFilePath('src/main.rs');
          setDiagnostics([]);
        }}
      />

    </div>
  );
}
