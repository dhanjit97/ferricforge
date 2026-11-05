/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RustChannel = 'stable' | 'beta' | 'nightly';
export type RustMode = 'debug' | 'release';
export type RustEdition = '2024' | '2021' | '2018' | '2015';
export type RustCrateType = 'bin' | 'lib';
export type RustCompileTarget = 'asm' | 'llvm-ir' | 'hir' | 'mir' | 'wasm';

export interface ExecuteRequest {
  channel?: RustChannel;
  mode?: RustMode;
  edition?: RustEdition;
  crateType?: RustCrateType;
  tests?: boolean;
  code: string;
  backtrace?: boolean;
}

export interface ExecuteResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitDetail?: string;
  error?: string;
  executionDurationMs?: number;
}

export interface CompileRequest {
  channel?: RustChannel;
  mode?: RustMode;
  edition?: RustEdition;
  crateType?: RustCrateType;
  tests?: boolean;
  code: string;
  target: RustCompileTarget;
}

export interface CompileResponse {
  success: boolean;
  code?: string;
  stdout: string;
  stderr: string;
  exitDetail?: string;
  error?: string;
  compilationDurationMs?: number;
}

export interface FormatResponse {
  success: boolean;
  code?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface ClippyResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

const RUST_PLAYGROUND_URL = 'https://play.rust-lang.org';

async function fetchPlayground(endpoint: string, payload: Record<string, unknown>, timeoutMs = 25000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${RUST_PLAYGROUND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        stdout: '',
        stderr: errText,
        error: `Rust Playground API returned HTTP ${response.status}: ${errText.slice(0, 300)}`,
      };
    }

    return await response.json();
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      stdout: '',
      stderr: isAbort ? 'Execution timed out after 25s (possible infinite loop or network latency)' : message,
      error: isAbort ? 'Execution timed out' : `Network error: ${message}`,
    };
  }
}

export async function executeRustCode(req: ExecuteRequest): Promise<ExecuteResponse> {
  const startTime = performance.now();
  const payload = {
    channel: req.channel || 'stable',
    mode: req.mode || 'debug',
    edition: req.edition || '2021',
    crateType: req.crateType || 'bin',
    tests: Boolean(req.tests),
    code: req.code,
    backtrace: Boolean(req.backtrace),
  };

  const data = await fetchPlayground('/execute', payload);
  const duration = Math.round(performance.now() - startTime);

  return {
    success: Boolean(data.success),
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    exitDetail: data.exitDetail,
    error: data.error,
    executionDurationMs: duration,
  };
}

export async function compileRustTarget(req: CompileRequest): Promise<CompileResponse> {
  const startTime = performance.now();
  const payload = {
    channel: req.channel || 'stable',
    mode: req.mode || 'release',
    edition: req.edition || '2021',
    crateType: req.crateType || 'bin',
    tests: Boolean(req.tests),
    code: req.code,
    target: req.target,
  };

  const data = await fetchPlayground('/compile', payload);
  const duration = Math.round(performance.now() - startTime);

  return {
    success: Boolean(data.success),
    code: data.code,
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    exitDetail: data.exitDetail,
    error: data.error,
    compilationDurationMs: duration,
  };
}

export async function formatRustCode(code: string, edition: RustEdition = '2021'): Promise<FormatResponse> {
  const data = await fetchPlayground('/format', {
    edition,
    code,
  });

  return {
    success: Boolean(data.success),
    code: data.code,
    stdout: data.stdout,
    stderr: data.stderr,
    error: data.error,
  };
}

export async function clippyRustCode(
  code: string,
  edition: RustEdition = '2021',
  channel: RustChannel = 'stable',
  crateType: RustCrateType = 'bin'
): Promise<ClippyResponse> {
  const data = await fetchPlayground('/clippy', {
    channel,
    crateType,
    edition,
    code,
  });

  return {
    success: Boolean(data.success),
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    error: data.error,
  };
}

export async function expandMacros(code: string, edition: RustEdition = '2021'): Promise<CompileResponse> {
  const startTime = performance.now();
  const data = await fetchPlayground('/macro-expansion', {
    edition,
    code,
  });
  const duration = Math.round(performance.now() - startTime);

  return {
    success: Boolean(data.success),
    code: data.code,
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    exitDetail: data.exitDetail,
    error: data.error,
    compilationDurationMs: duration,
  };
}
