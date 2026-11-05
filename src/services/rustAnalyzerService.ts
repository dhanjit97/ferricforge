export interface AnalyzerDiagnostic {
  id: string;
  file: string;
  line: number;
  col: number;
  endCol: number;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  sourceText?: string;
  quickFix?: {
    label: string;
    replacement: string;
    line: number;
  };
}

export interface InlayHint {
  line: number;
  col: number;
  label: string;
  kind: 'type' | 'parameter';
}

export interface AnalysisResult {
  diagnostics: AnalyzerDiagnostic[];
  inlayHints: InlayHint[];
  durationMs: number;
}

/**
 * Fast real-time Rust Analyzer service.
 * Executes in background worker / debounced stream (<15ms).
 * Analyzes syntax, immutability violations, borrowing rules, type inferences, and dead code.
 */
export function analyzeRustCode(code: string, filePath: string = 'src/main.rs'): AnalysisResult {
  const startTime = performance.now();
  const diagnostics: AnalyzerDiagnostic[] = [];
  const inlayHints: InlayHint[] = [];

  const lines = code.split('\n');

  // Track variable declarations in scope: name -> { isMut: boolean, line: number, type?: string, referenced: boolean }
  const declaredVars = new Map<string, { isMut: boolean; line: number; type?: string; referenced: boolean }>();
  const declaredFunctions = new Map<string, { params: string[]; line: number }>();

  // Delimiter balance stacks
  const delimiterStack: { char: string; line: number; col: number }[] = [];
  const matchingPairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

  // First pass: Index functions and variables
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const rawLine = lines[lineIdx];
    const trimmed = rawLine.trim();

    // Ignore full comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Check delimiter matching
    for (let colIdx = 0; colIdx < rawLine.length; colIdx++) {
      const char = rawLine[colIdx];
      // Skip strings and comments
      if (char === '"' || char === '\'') {
        // Simple skip till end of quote
        const nextQuote = rawLine.indexOf(char, colIdx + 1);
        if (nextQuote !== -1) {
          colIdx = nextQuote;
          continue;
        }
      }

      if (char === '{' || char === '(' || char === '[') {
        delimiterStack.push({ char, line: lineNum, col: colIdx + 1 });
      } else if (char === '}' || char === ')' || char === ']') {
        const expected = matchingPairs[char];
        const last = delimiterStack.pop();
        if (!last || last.char !== expected) {
          diagnostics.push({
            id: `syntax-unmatched-delim-${lineNum}-${colIdx}`,
            file: filePath,
            line: lineNum,
            col: colIdx + 1,
            endCol: colIdx + 2,
            severity: 'error',
            code: 'unmatched-delimiter',
            message: `Syntax Error: unmatched closing delimiter '${char}'`,
            sourceText: char,
          });
        }
      }
    }

    // 1. Detect function definitions: fn foo(a: i32, b: String)
    const fnMatch = rawLine.match(/\bfn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      const paramsRaw = fnMatch[2];
      const paramNames = paramsRaw
        .split(',')
        .map((p) => p.trim().split(':')[0].trim())
        .filter((p) => p && p !== '&self' && p !== '&mut self' && p !== 'self');

      declaredFunctions.set(fnName, { params: paramNames, line: lineNum });
    }

    // 2. Detect variable declarations: let [mut] name [: type] = ...;
    const letMatch = rawLine.match(/\blet\s+(mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*([^=;]+))?\s*(?:=\s*([^;]+))?;/);
    if (letMatch) {
      const isMut = Boolean(letMatch[1]);
      const varName = letMatch[2];
      const explicitType = letMatch[3]?.trim();
      const rhsExpr = letMatch[4]?.trim();

      // Check if missing semicolon (if let is on this line but no semicolon at end of statement)
      if (!rawLine.includes(';') && !rawLine.includes('{') && !trimmed.endsWith(',')) {
        diagnostics.push({
          id: `missing-semi-${lineNum}`,
          file: filePath,
          line: lineNum,
          col: rawLine.length,
          endCol: rawLine.length + 1,
          severity: 'error',
          code: 'expected-semicolon',
          message: `Expected ';' after variable declaration`,
          quickFix: {
            label: "Add ';'",
            replacement: rawLine + ';',
            line: lineNum,
          },
        });
      }

      // Infer basic type for Inlay Hint if not explicit
      let inferredType = explicitType;
      if (!inferredType && rhsExpr) {
        if (/^\d+$/.test(rhsExpr)) inferredType = 'i32';
        else if (/^\d+\.\d+$/.test(rhsExpr)) inferredType = 'f64';
        else if (rhsExpr.startsWith('"')) inferredType = '&str';
        else if (rhsExpr === 'true' || rhsExpr === 'false') inferredType = 'bool';
        else if (rhsExpr.includes('vec!') || rhsExpr.includes('Vec::new')) inferredType = 'Vec<_>';
        else if (rhsExpr.includes('String::from') || rhsExpr.includes('.to_string()') || rhsExpr.includes('.into()')) inferredType = 'String';

        if (inferredType && !explicitType) {
          const varCol = rawLine.indexOf(varName) + varName.length;
          inlayHints.push({
            line: lineNum,
            col: varCol,
            label: `: ${inferredType}`,
            kind: 'type',
          });
        }
      }

      // Check for unsigned negative literal: let x: u32 = -5;
      if (explicitType?.startsWith('u') && rhsExpr?.startsWith('-')) {
        const rhsCol = rawLine.indexOf(rhsExpr);
        diagnostics.push({
          id: `type-mismatch-neg-${lineNum}`,
          file: filePath,
          line: lineNum,
          col: rhsCol + 1,
          endCol: rhsCol + rhsExpr.length + 1,
          severity: 'error',
          code: 'E0600',
          message: `Cannot apply unary operator '-' to type '${explicitType}'`,
          sourceText: rhsExpr,
        });
      }

      declaredVars.set(varName, {
        isMut,
        line: lineNum,
        type: explicitType || inferredType,
        referenced: false,
      });
    }

    // 3. Immutability re-assignment checks: var = ... or var += ...
    const assignMatch = rawLine.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|\/=|%=|=)(?!=)/);
    if (assignMatch && !trimmed.startsWith('let ') && !trimmed.startsWith('const ')) {
      const targetVar = assignMatch[1];
      const operator = assignMatch[2];
      const decl = declaredVars.get(targetVar);

      if (decl) {
        decl.referenced = true;
        if (!decl.isMut) {
          const colStart = rawLine.indexOf(targetVar) + 1;
          diagnostics.push({
            id: `cannot-mutate-immut-${lineNum}-${targetVar}`,
            file: filePath,
            line: lineNum,
            col: colStart,
            endCol: colStart + targetVar.length,
            severity: 'error',
            code: 'E0384',
            message: `Cannot assign to immutable variable '${targetVar}'`,
            sourceText: targetVar,
            quickFix: {
              label: `Make binding mutable ('let mut ${targetVar}')`,
              replacement: lines[decl.line - 1].replace(
                new RegExp(`\\blet\\s+${targetVar}\\b`),
                `let mut ${targetVar}`
              ),
              line: decl.line,
            },
          });
        }
      }
    }

    // 4. Method mutation on immutable: e.g. x.push(...) where x is not mut
    const methodMutMatch = rawLine.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\.(push|push_str|insert|clear|pop|truncate)\(/);
    if (methodMutMatch) {
      const varName = methodMutMatch[1];
      const decl = declaredVars.get(varName);
      if (decl) {
        decl.referenced = true;
        if (!decl.isMut) {
          const colStart = rawLine.indexOf(varName) + 1;
          diagnostics.push({
            id: `cannot-borrow-mut-${lineNum}-${varName}`,
            file: filePath,
            line: lineNum,
            col: colStart,
            endCol: colStart + varName.length,
            severity: 'error',
            code: 'E0596',
            message: `Cannot borrow '${varName}' as mutable, as it is not declared as mutable`,
            sourceText: varName,
            quickFix: {
              label: `Change to 'let mut ${varName}'`,
              replacement: lines[decl.line - 1].replace(
                new RegExp(`\\blet\\s+${varName}\\b`),
                `let mut ${varName}`
              ),
              line: decl.line,
            },
          });
        }
      }
    }

    // 5. Inlay Parameter Hints for function calls
    for (const [fnName, fnInfo] of declaredFunctions.entries()) {
      const callPattern = new RegExp(`\\b${fnName}\\s*\\(([^)]+)\\)`, 'g');
      let callMatch;
      while ((callMatch = callPattern.exec(rawLine)) !== null) {
        const args = callMatch[1].split(',').map((a) => a.trim());
        let argOffset = rawLine.indexOf('(', callMatch.index) + 1;

        for (let aIdx = 0; aIdx < Math.min(args.length, fnInfo.params.length); aIdx++) {
          const pName = fnInfo.params[aIdx];
          const argText = args[aIdx];

          // Only display if argument is not already named identically
          if (pName && argText !== pName && !argText.startsWith('&')) {
            inlayHints.push({
              line: lineNum,
              col: argOffset,
              label: `${pName}: `,
              kind: 'parameter',
            });
          }
          argOffset += argText.length + 2;
        }
      }
    }

    // Mark variables as referenced if their word appears in other statements
    for (const [varName, info] of declaredVars.entries()) {
      if (lineNum !== info.line) {
        const wordRegex = new RegExp(`\\b${varName}\\b`);
        if (wordRegex.test(rawLine)) {
          info.referenced = true;
        }
      }
    }
  }

  // Check unclosed delimiters at EOF
  if (delimiterStack.length > 0) {
    const unclosed = delimiterStack[delimiterStack.length - 1];
    diagnostics.push({
      id: `unclosed-delim-${unclosed.line}`,
      file: filePath,
      line: unclosed.line,
      col: unclosed.col,
      endCol: unclosed.col + 1,
      severity: 'error',
      code: 'unclosed-delimiter',
      message: `Syntax Error: unclosed delimiter '${unclosed.char}'`,
      sourceText: unclosed.char,
    });
  }

  // 6. Unused variable warnings
  for (const [varName, info] of declaredVars.entries()) {
    if (!info.referenced && !varName.startsWith('_') && varName !== 'main') {
      const declLine = lines[info.line - 1] || '';
      const colStart = declLine.indexOf(varName) + 1;
      diagnostics.push({
        id: `unused-var-${info.line}-${varName}`,
        file: filePath,
        line: info.line,
        col: colStart,
        endCol: colStart + varName.length,
        severity: 'warning',
        code: 'unused_variables',
        message: `Unused variable: '${varName}' (prefix with '_' to silence)`,
        sourceText: varName,
        quickFix: {
          label: `Rename to '_${varName}'`,
          replacement: declLine.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`),
          line: info.line,
        },
      });
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
  return { diagnostics, inlayHints, durationMs };
}
