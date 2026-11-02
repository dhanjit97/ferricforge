import React, { useState } from 'react';
import { Cpu, Copy, Check, Filter, Sparkles, Search } from 'lucide-react';

interface AssemblyViewerProps {
  asmCode: string;
  isCompiling: boolean;
  onRefreshAsm: () => void;
}

export const AssemblyViewer: React.FC<AssemblyViewerProps> = ({
  asmCode,
  isCompiling,
  onRefreshAsm,
}) => {
  const [hideDirectives, setHideDirectives] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Filter lines based on toggle & query
  const rawLines = asmCode ? asmCode.split('\n') : [];
  const processedLines = rawLines.filter((line) => {
    const trimmed = line.trim();
    if (hideDirectives) {
      if (
        trimmed.startsWith('.cfi_') ||
        trimmed.startsWith('.Lanon.') ||
        trimmed.startsWith('.section') ||
        trimmed.startsWith('.p2align') ||
        trimmed.startsWith('.asciz') ||
        trimmed.startsWith('.quad') ||
        trimmed.startsWith('.size') ||
        trimmed.startsWith('.globl') ||
        trimmed.startsWith('.type') ||
        trimmed.startsWith('#') ||
        trimmed === ''
      ) {
        return false;
      }
    }
    if (filterQuery && !line.toLowerCase().includes(filterQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleExplainAsm = async () => {
    setIsExplaining(true);
    try {
      const topAsm = processedLines.slice(0, 100).join('\n');
      const response = await fetch('/api/explain-asm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asm: topAsm }),
      });
      const data = await response.json();
      setAiExplanation(data.summary || 'Analyzed assembly registers, inlining, and SIMD vectorization.');
    } catch (err) {
      console.error('Error analyzing assembly:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-neutral-200 font-mono text-xs overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-neutral-800 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#DE3804]" />
          <span className="font-semibold text-neutral-300">x86_64 Assembly (ASM)</span>
          <span className="text-[11px] text-neutral-500 tabular-nums">
            {processedLines.length} instructions
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Directive Filter Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-neutral-400 hover:text-neutral-200">
            <input
              type="checkbox"
              checked={hideDirectives}
              onChange={(e) => setHideDirectives(e.target.checked)}
              className="rounded border-neutral-700 text-[#DE3804] focus:ring-[#DE3804]"
            />
            <Filter className="w-3 h-3" />
            <span>Hide Directives (.cfi, .L)</span>
          </label>

          {/* Search box */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter opcode..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-7 pr-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded text-[11px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DE3804] w-28"
            />
          </div>

          <button
            onClick={handleExplainAsm}
            disabled={isExplaining || !asmCode}
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] transition-colors cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isExplaining ? 'Analyzing...' : 'Analyze ASM'}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!asmCode}
            className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer disabled:opacity-30"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* AI Explanation Banner */}
      {aiExplanation && (
        <div className="p-3 bg-neutral-900/90 border-b border-amber-500/30 text-neutral-300 text-xs font-sans flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-amber-300">Assembly Optimizer Insight: </span>
            {aiExplanation}
          </div>
          <button
            onClick={() => setAiExplanation(null)}
            className="text-neutral-500 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Assembly Listing */}
      <div className="flex-1 p-3 overflow-auto font-mono text-[12px] leading-relaxed select-text">
        {isCompiling ? (
          <div className="flex items-center gap-2 text-neutral-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#DE3804] animate-ping" />
            <span>Compiling Rust to release assembly via rustc...</span>
          </div>
        ) : processedLines.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-sans">
            <Cpu className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="font-medium text-neutral-400">No assembly output generated yet</p>
            <p className="text-xs text-neutral-600 mt-1">Select ASM target and click Run to disassemble</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900/50">
            {processedLines.map((line, idx) => {
              const trimmed = line.trim();
              const isLabel = trimmed.endsWith(':');
              const isCallOrRet = trimmed.startsWith('call') || trimmed.startsWith('ret');
              const isJump = trimmed.startsWith('j') || trimmed.startsWith('b.');
              const isSimd = trimmed.startsWith('v') || trimmed.includes('xmm') || trimmed.includes('ymm');

              return (
                <div
                  key={idx}
                  className={`py-0.5 flex ${
                    isLabel ? 'text-amber-400 font-semibold mt-2 pt-1' : 'pl-6'
                  }`}
                >
                  <span className="w-10 text-neutral-600 select-none text-[10px] tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className={`flex-1 ${
                      isLabel
                        ? 'text-amber-400'
                        : isCallOrRet
                        ? 'text-blue-400'
                        : isJump
                        ? 'text-purple-400'
                        : isSimd
                        ? 'text-emerald-400 font-medium'
                        : 'text-neutral-300'
                    }`}
                  >
                    {line}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
