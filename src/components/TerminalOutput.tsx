/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  Trash2,
  Clock,
  ArrowDownCircle,
} from 'lucide-react';
import { parseAnsiToSpans } from '../utils/ansi';
import { safeBoundedOutput } from '../utils/security';

interface TerminalOutputProps {
  stdout: string;
  stderr: string;
  isRunning: boolean;
  durationMs?: number;
  exitDetail?: string;
  onClear: () => void;
  onJumpToErrorLine?: (line: number) => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  stdout,
  stderr,
  isRunning,
  durationMs,
  exitDetail,
  onClear,
  onJumpToErrorLine,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Bound output buffer size to strictly prevent memory exhaustion & tab freeze
  const rawCombined = (stdout || '') + (stderr ? (stdout ? '\n' : '') + stderr : '');
  const combinedOutput = useMemo(() => safeBoundedOutput(rawCombined, 3000, 150000), [rawCombined]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combinedOutput, autoScroll]);

  const handleCopy = () => {
    if (!combinedOutput) return;
    navigator.clipboard.writeText(combinedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = exitDetail?.includes('status 0') || (!exitDetail && !stderr && stdout);
  const spans = useMemo(() => parseAnsiToSpans(combinedOutput), [combinedOutput]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] font-mono select-none overflow-hidden text-xs min-w-0">
      {/* Integrated Status & Telemetry Header */}
      <div className="flex items-center justify-between h-9 px-3 border-b border-white/[0.08] bg-[#101520] shrink-0 text-[11px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 text-[#94a3b8] shrink-0">
            <TerminalIcon size={13} className="text-[#00f0ff]" />
            <span className="font-bold text-[#e1e2ec] hidden sm:inline">TERMINAL CONSOLE</span>
            <span className="font-bold text-[#e1e2ec] sm:hidden">CONSOLE</span>
          </div>

          {/* Exit Code Badge */}
          {exitDetail && (
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] truncate max-w-[130px] sm:max-w-none ${
                isSuccess
                  ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                  : 'bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30'
              }`}
            >
              {exitDetail}
            </span>
          )}

          {/* Duration Badge */}
          {durationMs !== undefined && durationMs > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[#94a3b8]/70 text-[10px] shrink-0">
              <Clock size={11} />
              <span>{durationMs}ms</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded transition-colors ${
              autoScroll ? 'text-[#00f0ff] bg-[#00f0ff]/10' : 'text-[#94a3b8] hover:text-[#e1e2ec]'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle size={13} />
          </button>

          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] transition-colors"
            title="Copy Terminal Output"
          >
            {copied ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
          </button>

          <button
            onClick={onClear}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f43f5e] hover:bg-[#161d2d] transition-colors"
            title="Clear Console"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Buffer Scroll View */}
      <div className="flex-1 p-3 overflow-y-auto select-text font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words min-w-0">
        {isRunning ? (
          <div className="flex items-center gap-2 text-[#00f0ff] py-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00f0ff] animate-ping shrink-0" />
            <span className="font-mono text-xs">Compiling &amp; executing binary on remote target...</span>
          </div>
        ) : !combinedOutput ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#94a3b8]/50 py-10">
            <TerminalIcon size={24} className="mb-2 opacity-40 text-[#00f0ff]" />
            <p className="font-mono text-xs text-[#94a3b8]/80">Output buffer empty</p>
            <p className="text-[11px] text-[#94a3b8]/50 mt-1">Press "Run" (Ctrl+Enter) to compile and execute Rust binary</p>
          </div>
        ) : (
          <div>
            {spans.map((span, idx) => (
              <span
                key={idx}
                style={{
                  color: span.style.color || '#e1e2ec',
                  fontWeight: span.style.fontWeight,
                  textDecoration: span.style.textDecoration,
                }}
              >
                {span.text}
              </span>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Terminal Bottom Telemetry Bar */}
      <div className="h-6 px-3 border-t border-white/[0.06] bg-[#101520] flex items-center justify-between text-[10px] text-[#94a3b8] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[#00f0ff] font-semibold">STDOUT/STDERR</span>
          <span>{combinedOutput.length} B</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Linux (glibc)</span>
          <span>•</span>
          <span className="text-[#10b981]">Safe Sandbox</span>
        </div>
      </div>
    </div>
  );
};
