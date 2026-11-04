import React, { useState, useEffect } from 'react';
import { ParsedDiagnostic, AiExplanation, WorkspaceFile } from '../types/rust';
import { generateHeuristicBorrowTimeline } from '../utils/diagnosticParser';
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle,
  HelpCircle,
  Wand2,
  ChevronRight,
  Code2,
} from 'lucide-react';

interface DiagnosticsPanelProps {
  diagnostics: ParsedDiagnostic[];
  code: string;
  files?: WorkspaceFile[];
  stderr: string;
  onSelectLine: (line: number, file?: string) => void;
  onApplyFix: (fixedCode: string, file?: string) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  code,
  files,
  stderr,
  onSelectLine,
  onApplyFix,
}) => {
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, AiExplanation>>({});
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [appliedFixId, setAppliedFixId] = useState<string | null>(null);

  const errors = diagnostics.filter((d) => d.type === 'error');
  const warnings = diagnostics.filter((d) => d.type === 'warning');

  // Reset selected diagnostic when the diagnostics list changes
  useEffect(() => {
    if (diagnostics.length === 0) {
      setSelectedDiagId(null);
    } else if (!selectedDiagId || !diagnostics.find((d) => d.id === selectedDiagId)) {
      setSelectedDiagId(diagnostics[0]?.id || null);
    }
  }, [diagnostics, selectedDiagId]);

  const activeDiag = diagnostics.find((d) => d.id === selectedDiagId) || diagnostics[0] || null;

  const handleAskAi = async (diag: ParsedDiagnostic) => {
    setLoadingAiId(diag.id);
    const targetFile = diag.file;
    const fileCode = files?.find((f) => f.path === targetFile)?.content || code;

    try {
      const response = await fetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fileCode,
          errorOutput: diag.rawText || stderr,
          selectedDiagnostic: `${diag.errorCode ? `[${diag.errorCode}] ` : ''}${diag.message}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiExplanations((prev) => ({
          ...prev,
          [diag.id]: data,
        }));
      }
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
    } finally {
      setLoadingAiId(null);
    }
  };

  const handleApplyAiFix = (diagId: string, fixCode: string) => {
    onApplyFix(fixCode, activeDiag?.file);
    setAppliedFixId(diagId);
    setTimeout(() => setAppliedFixId(null), 3000);
  };

  if (diagnostics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-[#0d1117]">
        <CheckCircle className="w-10 h-10 text-emerald-500/80 mb-2" />
        <h3 className="font-semibold text-neutral-300 text-sm">Clean Compilation</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          No compiler errors or warnings detected by rustc. Your code satisfies all ownership, lifetime, and type invariants.
        </p>
      </div>
    );
  }

  const activeAiExp = activeDiag ? aiExplanations[activeDiag.id] : undefined;
  const borrowTimeline = activeDiag
    ? activeAiExp?.borrowTimeline || generateHeuristicBorrowTimeline(activeDiag, code)
    : [];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-neutral-200 text-xs overflow-hidden select-none theme-panel">
      {/* Diagnostics Header & Counts */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#161b22]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-neutral-300">rustc Diagnostics</span>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-medium">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span>{errors.length} {errors.length === 1 ? 'Error' : 'Errors'}</span>
              </span>
            )}
            {warnings.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>{warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}</span>
              </span>
            )}
          </div>
        </div>

        {activeDiag && (
          <button
            onClick={() => handleAskAi(activeDiag)}
            disabled={loadingAiId === activeDiag.id}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{loadingAiId === activeDiag.id ? 'Analyzing...' : 'Explain with AI'}</span>
          </button>
        )}
      </div>

      {/* Main split: List of Diagnostics on Left, Deep Explainer on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List of Issues (Minimum width ensures items don't get squished) */}
        <div className="w-56 shrink-0 border-r border-neutral-800 overflow-y-auto divide-y divide-neutral-800/60 bg-[#0f141c]">
          {diagnostics.map((diag) => {
            const isSelected = (activeDiag && activeDiag.id === diag.id);
            const isError = diag.type === 'error';

            return (
              <div
                key={diag.id}
                onClick={() => {
                  setSelectedDiagId(diag.id);
                  onSelectLine(diag.line, diag.file);
                }}
                className={`p-3 cursor-pointer transition-colors theme-card ${
                  isSelected
                    ? 'bg-neutral-800/80 border-l-2 border-l-[#DE3804]'
                    : 'hover:bg-neutral-800/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 truncate pr-1">
                    {isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] text-neutral-400 truncate">
                      {diag.file ? `${diag.file}:${diag.line}` : `Line ${diag.line}`}:{diag.col}
                    </span>
                  </div>

                  {diag.errorCode && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">
                      {diag.errorCode}
                    </span>
                  )}
                </div>

                <p className="text-[12px] font-medium text-neutral-200 line-clamp-2 leading-snug">
                  {diag.message}
                </p>

                {diag.suggestion && (
                  <div className="mt-1.5 text-[11px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                    <Check className="w-3 h-3 shrink-0" />
                    <span className="truncate">{diag.suggestion}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Detail & Ownership Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d1117] select-text">
          {activeDiag ? (
            <>
              {/* Header Box */}
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                        activeDiag.type === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {activeDiag.type}
                    </span>

                    {activeDiag.errorCode && (
                      <a
                        href={`https://doc.rust-lang.org/error_codes/${activeDiag.errorCode}.html`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-mono text-[#DE3804] hover:underline"
                      >
                        <span>{activeDiag.errorCode} Reference</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectLine(activeDiag.line, activeDiag.file)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      Jump to {activeDiag.file ? `${activeDiag.file}:${activeDiag.line}` : `line ${activeDiag.line}`}
                    </span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="font-semibold text-sm text-neutral-100">
                  {activeDiag.message}
                </div>

                {activeDiag.snippet && (
                  <pre className="p-2 rounded bg-black/50 border border-neutral-800 text-neutral-300 font-mono text-xs overflow-x-auto whitespace-pre">
                    {activeDiag.snippet}
                  </pre>
                )}
              </div>

              {/* Ownership & Borrow Timeline (Visualizer) */}
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#DE3804]" />
                    <span>Ownership & Lifetime Flow Analysis</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Borrow Checker Invariants</span>
                </div>

                <div className="space-y-2 relative pl-4 border-l-2 border-neutral-800">
                  {borrowTimeline.map((step) => (
                    <div key={step.step} className="relative group">
                      <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-neutral-700 border-2 border-[#0d1117] group-hover:bg-[#DE3804] transition-colors" />
                      <div className="text-[11.5px] text-neutral-300 font-sans">
                        <span className="font-mono text-neutral-500 mr-1.5">Step {step.step}:</span>
                        {step.description}
                        {step.line && (
                          <button
                            onClick={() => onSelectLine(step.line!)}
                            className="ml-2 font-mono text-[10px] text-[#DE3804] hover:underline cursor-pointer"
                          >
                            (Line {step.line})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Explanation & Auto-Fix Card */}
              {activeAiExp ? (
                <div className="p-4 rounded-lg bg-neutral-900 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Compiler Explainer & Solution</span>
                    </div>

                    {activeAiExp.fixedFullCode && (
                      <button
                        onClick={() => handleApplyAiFix(activeDiag.id, activeAiExp.fixedFullCode!)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        {appliedFixId === activeDiag.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied!</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Apply Fix to Code</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {activeAiExp.errorSummary}
                  </p>

                  <div className="text-xs text-neutral-400 leading-relaxed bg-black/30 p-2.5 rounded border border-neutral-800">
                    <strong className="text-neutral-200">Why this happens: </strong>
                    {activeAiExp.cause}
                  </div>

                  {activeAiExp.suggestedFix && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-neutral-400">Suggested Fix:</div>
                      <pre className="p-2.5 bg-black/60 border border-neutral-800 rounded font-mono text-emerald-400 text-xs overflow-x-auto">
                        {activeAiExp.suggestedFix}
                      </pre>
                    </div>
                  )}

                  {activeAiExp.idiomaticTip && (
                    <div className="text-[11px] text-neutral-400 italic flex items-start gap-1.5 pt-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{activeAiExp.idiomaticTip}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded bg-neutral-900/50 border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-neutral-400 text-xs">
                    Need an in-depth breakdown of this error with borrow diagrams?
                  </span>
                  <button
                    onClick={() => handleAskAi(activeDiag)}
                    disabled={loadingAiId === activeDiag.id}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-medium text-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{loadingAiId === activeDiag.id ? 'Thinking...' : 'Explain with AI'}</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-neutral-500 text-center py-8">Select a diagnostic on the left to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
};
