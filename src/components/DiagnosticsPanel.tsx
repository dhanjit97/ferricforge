/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Wand2,
  ExternalLink,
  ChevronRight,
  Code2,
  Terminal,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { ParsedDiagnostic } from '../types/rust';
import { explainRustDiagnostic, DiagnosticExplanation } from '../services/geminiService';

interface DiagnosticsPanelProps {
  diagnostics: ParsedDiagnostic[];
  onSelectDiagnostic: (diag: ParsedDiagnostic) => void;
  onApplyFix?: (diag: ParsedDiagnostic) => void;
  code: string;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  onSelectDiagnostic,
  onApplyFix,
  code,
}) => {
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<DiagnosticExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExplain = async (diag: ParsedDiagnostic) => {
    setSelectedDiagId(diag.id);
    setIsExplaining(true);
    setAiExplanation(null);

    const explanation = await explainRustDiagnostic(code, diag.rawText || diag.message, diag.errorCode);
    setAiExplanation(explanation);
    setIsExplaining(false);
  };

  if (diagnostics.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#94a3b8]">
        <div className="w-12 h-12 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] mb-3">
          <CheckCircle2 size={24} />
        </div>
        <h4 className="font-mono text-sm font-bold text-[#e1e2ec]">Zero Compiler Diagnostics</h4>
        <p className="text-xs text-[#94a3b8] mt-1 max-w-xs leading-relaxed">
          The code passes the borrow checker, type contracts, and lifetime invariants cleanly.
        </p>
        <div className="flex items-center gap-2 mt-4 px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25 font-mono text-[10px]">
          <span>BORROW CHECKER CLEAN</span>
          <span>•</span>
          <span>ZERO-COST VERIFIED</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-none">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#ff5400] font-semibold">
          Compiler Diagnostics ({diagnostics.length})
        </span>
        <span className="font-mono text-[10px] text-[#94a3b8]">Click to jump to line</span>
      </div>

      <div className="space-y-2.5">
        {diagnostics.map((diag) => {
          const isError = diag.type === 'error';
          const isWarning = diag.type === 'warning';
          const isSelected = selectedDiagId === diag.id;

          return (
            <div
              key={diag.id}
              className={`p-3 rounded bg-[#161d2d] border transition-all ${
                isError
                  ? 'border-[#f43f5e]/40 hover:border-[#f43f5e]'
                  : 'border-[#ff9e00]/40 hover:border-[#ff9e00]'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => onSelectDiagnostic(diag)}
                  className="flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  {isError ? (
                    <AlertCircle size={14} className="text-[#f43f5e] shrink-0" />
                  ) : (
                    <AlertTriangle size={14} className="text-[#ff9e00] shrink-0" />
                  )}

                  {diag.errorCode ? (
                    <a
                      href={`https://doc.rust-lang.org/error_codes/${diag.errorCode}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-1.5 py-0.2 rounded bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 font-bold hover:bg-[#f43f5e]/25 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                      title="Open Rust Error Index"
                    >
                      {diag.errorCode}
                    </a>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-[#f43f5e]">
                      {diag.type}
                    </span>
                  )}

                  <span className="text-[#00f0ff] font-semibold text-[11px]">
                    {diag.file || 'main.rs'}:{diag.line}:{diag.col}
                  </span>
                </div>

                {/* AI Explain button */}
                <button
                  onClick={() => handleExplain(diag)}
                  disabled={isExplaining && isSelected}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ff5400]/10 hover:bg-[#ff5400] text-[#ff6d00] hover:text-white border border-[#ff5400]/30 transition-all text-[10px] font-semibold"
                  title="Explain with AI Systems Architect"
                >
                  {isExplaining && isSelected ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  <span>Explain</span>
                </button>
              </div>

              {/* Error Message */}
              <p
                onClick={() => onSelectDiagnostic(diag)}
                className="mt-2 text-[#e1e2ec] font-mono text-[11px] leading-relaxed cursor-pointer"
              >
                {diag.message}
              </p>

              {/* Code Snippet if present */}
              {diag.snippet && (
                <div className="mt-2 p-2 rounded bg-[#0a0d14] border border-white/[0.04] text-[11px] text-[#94a3b8] overflow-x-auto whitespace-pre">
                  {diag.snippet}
                </div>
              )}

              {/* Suggestion / Quick Fix */}
              {diag.suggestion && (
                <div className="mt-2 flex items-center justify-between p-2 rounded bg-[#10b981]/10 border border-[#10b981]/25">
                  <span className="text-[10px] text-[#10b981] font-mono truncate mr-2">
                    💡 Suggestion: {diag.suggestion}
                  </span>
                  {onApplyFix && (
                    <button
                      onClick={() => onApplyFix(diag)}
                      className="px-2 py-0.5 rounded bg-[#10b981] text-black font-bold text-[10px] hover:bg-[#10b981]/90 transition-colors shrink-0"
                    >
                      Apply Fix
                    </button>
                  )}
                </div>
              )}

              {/* AI Explanation Accordion */}
              {isSelected && aiExplanation && (
                <div className="mt-3 p-3 rounded bg-[#0a0d14] border border-[#ff5400]/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#ff5400] font-bold text-[11px]">
                    <Sparkles size={12} />
                    <span>Systems Architect Diagnosis</span>
                  </div>
                  <p className="text-[11px] text-[#e1e2ec] leading-relaxed font-sans">
                    {aiExplanation.summary}
                  </p>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-[#00f0ff] font-bold block mb-0.5 uppercase tracking-wider">
                      Underlying Invariant
                    </span>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed font-sans">
                      {aiExplanation.underlyingCause}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-[#ffb868] font-bold block mb-0.5 uppercase tracking-wider">
                      Memory & Stack Insight
                    </span>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed font-sans">
                      {aiExplanation.systemsInsight}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-[#10b981] font-bold block mb-0.5 uppercase tracking-wider">
                      Actionable Solution
                    </span>
                    <p className="text-[10px] text-[#e1e2ec] leading-relaxed font-sans">
                      {aiExplanation.suggestedFix}
                    </p>
                  </div>

                  {aiExplanation.fixedCodeSnippet && (
                    <div className="mt-1 p-2 rounded bg-[#161d2d] border border-white/[0.08] text-[10px] text-[#10b981] font-mono whitespace-pre overflow-x-auto">
                      {aiExplanation.fixedCodeSnippet}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
