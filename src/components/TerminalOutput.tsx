import React, { useState } from 'react';
import { parseAnsiToSpans } from '../utils/ansi';
import { ExecuteResponse } from '../types/rust';
import { Terminal, Copy, Check, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface TerminalOutputProps {
  result: ExecuteResponse | null;
  isRunning: boolean;
  onClear: () => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  result,
  isRunning,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'stdout' | 'stderr'>('all');

  const stdout = result?.stdout || '';
  const stderr = result?.stderr || '';

  const handleCopy = async () => {
    const combined = `--- STDOUT ---\n${stdout}\n\n--- STDERR ---\n${stderr}`;
    try {
      await navigator.clipboard.writeText(combined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const isSuccess = result?.success;
  const exitDetail = result?.exitDetail || (result ? (isSuccess ? 'Exited with status 0' : 'Compilation / Runtime Error') : '');

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-neutral-200 font-mono text-xs overflow-hidden select-none">
      {/* Top Bar / Status */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-[#161b22] text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-400" />
          <span className="font-semibold text-neutral-300">Terminal</span>

          {result && (
            <div className="flex items-center gap-1.5 ml-2">
              <span
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                  isSuccess
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                )}
                <span>{exitDetail}</span>
              </span>

              {result.durationMs && (
                <span className="flex items-center gap-1 text-[11px] text-neutral-400 tabular-nums ml-1">
                  <Clock className="w-3 h-3" />
                  <span>{result.durationMs}ms</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* View filters and Actions */}
        <div className="flex items-center gap-2">
          {result && (stdout || stderr) && (
            <div className="flex items-center gap-1 p-0.5 bg-neutral-800/80 rounded">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                  viewFilter === 'all'
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              {stdout && (
                <button
                  onClick={() => setViewFilter('stdout')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    viewFilter === 'stdout'
                      ? 'bg-neutral-700 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Stdout
                </button>
              )}
              {stderr && (
                <button
                  onClick={() => setViewFilter('stderr')}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                    viewFilter === 'stderr'
                      ? 'bg-neutral-700 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Stderr
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleCopy}
            disabled={!result}
            title="Copy Output"
            className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer disabled:opacity-30"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            disabled={!result}
            title="Clear Console"
            className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 p-4 overflow-auto font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap select-text">
        {isRunning ? (
          <div className="flex items-center gap-2 text-neutral-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#DE3804] animate-ping" />
            <span>Compiling and executing in Rust playground cloud sandbox...</span>
          </div>
        ) : !result ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-12">
            <Terminal className="w-8 h-8 stroke-[1.5] text-neutral-600 mb-2" />
            <p className="text-neutral-400 font-sans font-medium text-sm">Ready to compile & run</p>
            <p className="text-neutral-600 text-xs mt-1">Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-400 font-mono">Ctrl + Enter</kbd> or click Run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compiler / Build diagnostic output (stderr) */}
            {(viewFilter === 'all' || viewFilter === 'stderr') && stderr && (
              <div className="space-y-1">
                <div className="text-[11px] font-sans font-medium text-neutral-500 tracking-wider uppercase">
                  Cargo / Compiler Pipeline:
                </div>
                <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                  {parseAnsiToSpans(stderr).map((span, idx) => (
                    <span key={idx} style={span.style}>
                      {span.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Program Output (stdout) */}
            {(viewFilter === 'all' || viewFilter === 'stdout') && stdout && (
              <div className="space-y-1">
                <div className="text-[11px] font-sans font-medium text-emerald-400/80 tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Program Standard Output:
                </div>
                <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800/80 text-emerald-300">
                  {parseAnsiToSpans(stdout).map((span, idx) => (
                    <span key={idx} style={span.style}>
                      {span.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!stdout && !stderr && (
              <div className="text-neutral-400 italic">Program finished cleanly with no console output.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
