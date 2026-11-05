/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Zap,
} from 'lucide-react';
import { RustCompileTarget, compileRustTarget, CompileResponse } from '../services/rustPlayground';

interface AssemblyViewerProps {
  code: string;
  edition: string;
}

export const AssemblyViewer: React.FC<AssemblyViewerProps> = ({ code, edition }) => {
  const [target, setTarget] = useState<RustCompileTarget>('asm');
  const [optMode, setOptMode] = useState<'release' | 'debug'>('release');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ durationMs?: number; lines?: number }>({});

  const handleCompile = async () => {
    setIsLoading(true);
    const res: CompileResponse = await compileRustTarget({
      code,
      target,
      mode: optMode,
      edition: edition as any,
      crateType: 'bin',
    });

    setIsLoading(false);
    const content = res.code || res.stdout || res.stderr || 'No assembly output generated.';
    setOutput(content);
    setStats({
      durationMs: res.compilationDurationMs,
      lines: content.split('\n').length,
    });
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detect SIMD vectorization in assembly output
  const hasVectorization = output.includes('xmm') || output.includes('ymm') || output.includes('vmov') || output.includes('padd');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] font-mono text-xs select-none overflow-hidden">
      {/* Control Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-white/8 bg-[#101520] shrink-0">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-[#00f0ff]" />
          <span className="font-bold text-[#e1e2ec] text-[11px]">DISASSEMBLY INSPECTOR</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Target Format Selector */}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as RustCompileTarget)}
            className="bg-[#0a0d14] border border-white/10 rounded px-2 py-0.5 text-[11px] text-[#e1e2ec] focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="asm">x86_64 Assembly</option>
            <option value="llvm-ir">LLVM IR</option>
            <option value="hir">High-Level IR (HIR)</option>
            <option value="mir">Mid-Level IR (MIR)</option>
            <option value="wasm">WebAssembly (WASM)</option>
          </select>

          {/* Opt Level */}
          <select
            value={optMode}
            onChange={(e) => setOptMode(e.target.value as 'release' | 'debug')}
            className="bg-[#0a0d14] border border-white/10 rounded px-2 py-0.5 text-[11px] text-[#ffb868] focus:outline-none focus:border-[#ffb868]"
          >
            <option value="release">Release (-O3)</option>
            <option value="debug">Debug (-O0)</option>
          </select>

          {/* Trigger Generate Button */}
          <button
            onClick={handleCompile}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff] hover:text-black font-semibold transition-all"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            <span>Compile</span>
          </button>

          {output && (
            <button
              onClick={handleCopy}
              className="p-1 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d] transition-colors"
              title="Copy Disassembly"
            >
              {copied ? <Check size={13} className="text-[#10b981]" /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Disassembly Output View */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed select-text whitespace-pre overflow-x-auto text-[#e1e2ec]/90">
        {!output && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#94a3b8]/60 py-10">
            <Cpu size={28} className="mb-2 text-[#00f0ff] opacity-40" />
            <p className="font-mono text-xs text-[#e1e2ec]">No compiler IR compiled yet</p>
            <p className="text-[11px] text-[#94a3b8]/60 mt-1 max-w-xs">
              Click "Compile" above to generate target x86_64 assembly, LLVM-IR, or MIR from your active code buffer.
            </p>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center gap-2 text-[#00f0ff]">
            <Loader2 size={16} className="animate-spin" />
            <span>Emitting {target.toUpperCase()} through rustc codegen...</span>
          </div>
        ) : (
          <div>
            {/* Vectorization Banner */}
            {hasVectorization && (
              <div className="mb-3 p-2 rounded bg-[#10b981]/10 border border-[#10b981]/30 flex items-center gap-2 text-[#10b981] text-[10px]">
                <Zap size={12} />
                <span className="font-bold">AUTO-VECTORIZATION DETECTED:</span>
                <span>The LLVM backend emitted SIMD instructions (xmm/ymm registers).</span>
              </div>
            )}

            <code>{output}</code>
          </div>
        )}
      </div>

      {/* Telemetry Footer */}
      <div className="h-6 px-3 border-t border-white/6 bg-[#101520] flex items-center justify-between text-[10px] text-[#94a3b8] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#00f0ff] font-semibold">TARGET: {target.toUpperCase()}</span>
          {stats.lines && <span>{stats.lines} instructions</span>}
        </div>
        {stats.durationMs && <span>Codegen: {stats.durationMs}ms</span>}
      </div>
    </div>
  );
};
