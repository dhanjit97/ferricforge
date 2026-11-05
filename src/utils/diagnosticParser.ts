import { ParsedDiagnostic, BorrowTimelineStep } from '../types/rust';

export function parseRustcDiagnostics(stderr: string): ParsedDiagnostic[] {
  if (!stderr) return [];

  const diagnostics: ParsedDiagnostic[] = [];
  const lines = stderr.split('\n');

  let currentDiag: Partial<ParsedDiagnostic> | null = null;
  let rawAccumulator: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for diagnostic headers like:
    // error[E0382]: borrow of moved value: `s`
    // error: mismatched types
    // warning: unused variable: `x`
    const headerMatch = line.match(/^(error|warning)(?:\[([A-Z0-9]+)\])?:\s+(.*)$/);

    if (headerMatch) {
      if (currentDiag && currentDiag.message) {
        diagnostics.push({
          id: `diag-${diagnostics.length}`,
          type: (currentDiag.type || 'error'),
          errorCode: currentDiag.errorCode,
          message: currentDiag.message,
          line: currentDiag.line || 1,
          col: currentDiag.col || 1,
          snippet: currentDiag.snippet,
          suggestion: currentDiag.suggestion,
          rawText: rawAccumulator.join('\n'),
        });
      }

      currentDiag = {
        type: headerMatch[1] as 'error' | 'warning',
        errorCode: headerMatch[2],
        message: headerMatch[3],
        line: 1,
        col: 1,
      };
      rawAccumulator = [line];
      continue;
    }

    if (currentDiag) {
      rawAccumulator.push(line);

      // Check for line pointer: --> src/main.rs:4:5 or --> <anon>:3:14
      const locMatch = line.match(/-->\s+(?:src\/main\.rs|<anon>|main\.rs):(\d+):(\d+)/);
      if (locMatch) {
        currentDiag.line = parseInt(locMatch[1], 10);
        currentDiag.col = parseInt(locMatch[2], 10);
      }

      // Check for code snippet line (e.g. " 4 |     take_ownership(s);")
      if (/^\s*\d+\s*\|/.test(line)) {
        if (!currentDiag.snippet) {
          currentDiag.snippet = line.trim();
        } else {
          currentDiag.snippet += '\n' + line.trim();
        }
      }

      // Check for suggestions: "help: try: `...`" or "help: consider..."
      const helpMatch = line.match(/help:\s+(.*)$/);
      if (helpMatch) {
        currentDiag.suggestion = helpMatch[1];
      }
    }
  }

  // Push final diagnostic if exists
  if (currentDiag && currentDiag.message) {
    diagnostics.push({
      id: `diag-${diagnostics.length}`,
      type: (currentDiag.type || 'error'),
      errorCode: currentDiag.errorCode,
      message: currentDiag.message,
      line: currentDiag.line || 1,
      col: currentDiag.col || 1,
      snippet: currentDiag.snippet,
      suggestion: currentDiag.suggestion,
      rawText: rawAccumulator.join('\n'),
    });
  }

  return diagnostics;
}

// Generate an intuitive ownership flow for common borrow checker errors
export function generateHeuristicBorrowTimeline(diag: ParsedDiagnostic, code: string): BorrowTimelineStep[] {
  const codeLines = code.split('\n');

  if (diag.errorCode === 'E0382') {
    // Borrow of moved value
    return [
      {
        step: 1,
        description: `Value declared and allocated with ownership`,
        line: Math.max(1, diag.line - 2),
      },
      {
        step: 2,
        description: `Ownership was moved into another function or variable`,
        line: Math.max(1, diag.line - 1),
      },
      {
        step: 3,
        description: `Attempted access or borrow here at line ${diag.line} after value was already invalidated`,
        line: diag.line,
      },
      {
        step: 4,
        description: `Fix: Pass by reference (&T) or explicitly duplicate with .clone() if type permits`,
      },
    ];
  }

  if (diag.errorCode === 'E0502') {
    // Cannot borrow as mutable because it is also borrowed as immutable
    return [
      {
        step: 1,
        description: `First borrowed as immutable (&T)`,
        line: Math.max(1, diag.line - 2),
      },
      {
        step: 2,
        description: `Attempted to borrow mutably (&mut T) at line ${diag.line} while original borrow is still alive`,
        line: diag.line,
      },
      {
        step: 3,
        description: `Rust Aliasing Rule: You can have ANY number of &T, OR exactly ONE &mut T, never both simultaneously.`,
      },
      {
        step: 4,
        description: `Fix: End the immutable borrow scope before taking the mutable borrow, or restructure access.`,
      },
    ];
  }

  if (diag.errorCode === 'E0499' || diag.errorCode === 'E0524') {
    // Cannot borrow as mutable more than once at a time
    return [
      {
        step: 1,
        description: `First mutable borrow (&mut T) created`,
        line: Math.max(1, diag.line - 2),
      },
      {
        step: 2,
        description: `Second mutable borrow attempted at line ${diag.line} before the first was dropped`,
        line: diag.line,
      },
      {
        step: 3,
        description: `Fix: Ensure the first mutable borrow completes or goes out of scope before the next borrow.`,
      },
    ];
  }

  if (diag.errorCode === 'E0597') {
    // Borrowed value does not live long enough
    return [
      {
        step: 1,
        description: `Value created in temporary scope or inner block`,
        line: Math.max(1, diag.line - 1),
      },
      {
        step: 2,
        description: `Reference taken and attempted to escape outliving its owner at line ${diag.line}`,
        line: diag.line,
      },
      {
        step: 3,
        description: `Fix: Move the value to an outer scope, return an owned T instead of &T, or adjust lifetime.`,
      },
    ];
  }

  // Generic fallback timeline for errors with line locations
  return [
    {
      step: 1,
      description: `Declaration context in scope`,
      line: Math.max(1, diag.line - 1),
    },
    {
      step: 2,
      description: `Compiler rejection: ${diag.message}`,
      line: diag.line,
    },
  ];
}
