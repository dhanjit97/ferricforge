export type RustChannel = 'stable' | 'beta' | 'nightly';
export type RustMode = 'debug' | 'release';
export type RustEdition = '2015' | '2018' | '2021' | '2024';
export type RustCrateType = 'bin' | 'lib';
export type OutputTarget = 'execute' | 'test' | 'clippy' | 'asm' | 'llvm-ir' | 'hir' | 'mir' | 'wasm' | 'expand';

export interface ExecuteResponse {
  success: boolean;
  exitDetail?: string;
  stdout?: string;
  stderr?: string;
  code?: string; // For compile/format output
  error?: string;
  durationMs?: number;
}

export interface WorkspaceFile {
  path: string; // e.g. "src/main.rs", "src/math.rs", "Cargo.toml"
  name: string; // e.g. "main.rs", "math.rs", "Cargo.toml"
  content: string;
  isReadOnly?: boolean;
  isEntry?: boolean;
}

export interface ParsedDiagnostic {
  id: string;
  type: 'error' | 'warning' | 'note' | 'help';
  errorCode?: string; // e.g., "E0382"
  message: string;
  file?: string; // e.g. "src/main.rs" or "src/math.rs"
  line: number;
  col: number;
  snippet?: string;
  suggestion?: string;
  rawText: string;
}

export interface BorrowTimelineStep {
  step: number;
  description: string;
  line?: number;
}

export interface AiExplanation {
  errorCode?: string | null;
  errorSummary: string;
  cause: string;
  borrowTimeline?: BorrowTimelineStep[];
  suggestedFix?: string;
  fixedFullCode?: string;
  idiomaticTip?: string;
}

export interface OptimizationItem {
  title: string;
  explanation: string;
  diffSnippet?: string;
}

export interface OptimizationResult {
  score?: string;
  summary?: string;
  optimizations?: OptimizationItem[];
  recommendedCode?: string;
}

export interface RustSnippet {
  id: string;
  title: string;
  category: 'Basics' | 'Borrowing & Lifetimes' | 'Async & Concurrency' | 'Idioms' | 'Performance' | 'Data Structures';
  description: string;
  code: string;
  edition: RustEdition;
  mode?: RustMode;
}

export interface CrateItem {
  name: string;
  version: string;
  description: string;
  features?: string[];
  importSnippet: string;
  category: string;
  popular?: boolean;
}
