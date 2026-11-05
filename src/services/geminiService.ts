/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export interface DiagnosticExplanation {
  summary: string;
  underlyingCause: string;
  systemsInsight: string;
  suggestedFix: string;
  fixedCodeSnippet?: string;
}

export interface CodeOptimization {
  summary: string;
  zeroCostOpportunities: string[];
  memoryOptimizations: string[];
  suggestedCode: string;
}

export async function explainRustDiagnostic(
  code: string,
  errorOutput: string,
  errorCode?: string
): Promise<DiagnosticExplanation> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
    (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) || '';

  if (!apiKey) {
    // High-quality deterministic fallback for standard Rust compiler errors
    return generateLocalDiagnosticExplanation(code, errorOutput, errorCode);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a Principal Rust Systems Engineer and compiler architect.
A developer encountered the following rustc diagnostic in their code:

Diagnostic / Compiler Output:
\`\`\`text
${errorOutput.slice(0, 4000)}
\`\`\`

Source Code:
\`\`\`rust
${code.slice(0, 4000)}
\`\`\`

Provide a deep systems-level breakdown explaining what rustc's borrow checker or type system is enforcing here and how to write idiomatic, zero-cost, memory-safe code to solve it.

Respond in JSON matching this schema:
{
  "summary": "1-2 sentence high-level summary of the issue",
  "underlyingCause": "Detailed technical explanation of what rule (ownership, borrow check, lifetime, trait bound, type mismatch) was violated",
  "systemsInsight": "Low-level insight into stack/heap, non-lexical lifetimes, or zero-cost design",
  "suggestedFix": "Clear step-by-step guidance on how to fix",
  "fixedCodeSnippet": "The corrected Rust code snippet"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'Rust compiler diagnostic identified.',
      underlyingCause: parsed.underlyingCause || 'Constraint enforcement by rustc.',
      systemsInsight: parsed.systemsInsight || 'Rust enforces strict compile-time memory safety without a garbage collector.',
      suggestedFix: parsed.suggestedFix || 'Review the suggested compiler note and adjust variable mutability or lifetimes.',
      fixedCodeSnippet: parsed.fixedCodeSnippet || undefined,
    };
  } catch {
    return generateLocalDiagnosticExplanation(code, errorOutput, errorCode);
  }
}

function generateLocalDiagnosticExplanation(
  code: string,
  errorOutput: string,
  errorCode?: string
): DiagnosticExplanation {
  const lower = (errorOutput + ' ' + (errorCode || '')).toLowerCase();

  if (lower.includes('e0382') || lower.includes('use of moved value')) {
    return {
      summary: 'Use of moved value: Ownership has already been transferred.',
      underlyingCause: 'Rust types that do not implement the `Copy` trait have move semantics by default. When passed to a function or assigned by value, the original binding becomes invalidated.',
      systemsInsight: 'At the assembly and stack level, the stack pointer or memory responsibility passed to the recipient frame. Rust invalidates the slot at compile-time to prevent double-free bugs without runtime overhead.',
      suggestedFix: 'Borrow the value with `&` or `&mut` instead of taking ownership, or explicitly call `.clone()` if a deep duplicate is genuinely required.',
      fixedCodeSnippet: '// Pass as reference instead of taking ownership:\n// fn inspect(data: &String) { ... }\n// inspect(&my_variable);',
    };
  }

  if (lower.includes('e0502') || lower.includes('cannot borrow') || lower.includes('mutable more than once')) {
    return {
      summary: 'Aliasing XOR Mutability violation: Simultaneous conflicting borrows.',
      underlyingCause: "Rust's core invariant: You may have any number of immutable references (&T) OR exactly one mutable reference (&mut T), but NEVER both simultaneously.",
      systemsInsight: 'This guarantees data-race freedom and pointer stability at compile time. If memory could mutate while an immutable pointer reads it, iterators would invalidate and memory safety would break.',
      suggestedFix: 'Scope the mutable borrow into a separate block `{ ... }`, finish mutating before reading, or restructure the algorithm to avoid simultaneous access.',
      fixedCodeSnippet: '// Limit the mutable borrow lifetime scope:\n{\n    let mut_ref = &mut data;\n    mut_ref.push(42);\n}\n// Now safe to borrow immutably:\nprintln!("{:?}", data);',
    };
  }

  if (lower.includes('e0384') || lower.includes('cannot assign to immutable variable')) {
    return {
      summary: 'Mutation of immutable variable: Variables are immutable by default in Rust.',
      underlyingCause: 'The variable was declared with `let` instead of `let mut`. Rust defaults to immutability to foster predictable, safe systems programming.',
      systemsInsight: 'Immutability allows the compiler to optimize register allocations and eliminate speculative memory re-reads.',
      suggestedFix: 'Add the `mut` keyword to the variable declaration: `let mut ...`.',
      fixedCodeSnippet: 'let mut count = 0;\ncount += 1;',
    };
  }

  if (lower.includes('e0597') || lower.includes('does not live long enough')) {
    return {
      summary: 'Dangling reference prevented: Value dropped while still borrowed.',
      underlyingCause: 'A reference is attempting to outlive the data it points to. Rust prevents dangling pointers by verifying lifetime parameters at compile time.',
      systemsInsight: 'The referenced stack allocation will be dropped at the end of its enclosing scope. Dereferencing it later would access deallocated stack or heap memory.',
      suggestedFix: 'Extend the lifetime of the owned value, move the value into the longer-lived scope, or return an owned type instead of a reference.',
    };
  }

  return {
    summary: 'The Rust compiler detected an error preventing safe code generation.',
    underlyingCause: 'Rustc enforces memory safety, type contracts, and lifetime invariants strictly before producing machine code.',
    systemsInsight: 'Zero-cost abstractions mean errors are caught at compile-time rather than causing runtime segmentation faults, memory leaks, or race conditions.',
    suggestedFix: 'Examine the line and column indicated in the diagnostic gutter, verify matching types and semicolon placement, and check variable mutability.',
  };
}
