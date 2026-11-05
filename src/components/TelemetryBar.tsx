/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Zap,
  Globe,
  Radio,
  Sparkles,
} from 'lucide-react';

interface TelemetryBarProps {
  channel: string;
  edition: string;
  mode: string;
  hasErrors: boolean;
  hasUnsafe: boolean;
  isCompiling: boolean;
  latencyMs?: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  channel,
  edition,
  mode,
  hasErrors,
  hasUnsafe,
  isCompiling,
  latencyMs = 380,
}) => {
  return (
    <footer className="h-7 px-3 border-t border-white/[0.08] bg-[#101520] flex items-center justify-between font-mono text-[10px] select-none text-[#94a3b8] shrink-0 z-30">
      {/* Left indicators */}
      <div className="flex items-center gap-3">
        {/* Compiler Connection status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCompiling
                ? 'bg-[#00f0ff] animate-ping'
                : 'bg-[#10b981]'
            }`}
          />
          <span className="text-[#e1e2ec]">
            {isCompiling ? 'rustc compiling...' : 'play.rust-lang.org'}
          </span>
        </div>

        <span className="text-neutral-700">|</span>

        {/* Borrow Checker Status Badge */}
        {hasErrors ? (
          <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 font-bold">
            <ShieldAlert size={11} />
            <span>BORROW CHECK: REJECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold">
            <ShieldCheck size={11} />
            <span>BORROW CHECKER: CLEAN</span>
          </div>
        )}

        {/* Unsafe block detector badge */}
        {hasUnsafe && (
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#ff5400]/15 text-[#ff6d00] border border-[#ff5400]/35 font-bold">
            <Zap size={10} />
            <span>UNSAFE BLOCK DETECTED</span>
          </div>
        )}

        {/* Zero-Cost Abstraction Chip */}
        <div className="hidden md:flex items-center gap-1 text-[#00f0ff]">
          <span>Monomorphized</span>
        </div>
      </div>

      {/* Right Telemetry stats */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1">
          <span>ARCH:</span>
          <span className="text-[#e1e2ec] font-semibold">x86_64-linux</span>
        </div>

        <span className="hidden lg:inline text-neutral-700">|</span>

        <div className="hidden sm:flex items-center gap-1">
          <span>EDITION:</span>
          <span className="text-[#e1e2ec] font-semibold">{edition}</span>
        </div>

        <span className="hidden sm:inline text-neutral-700">|</span>

        <div className="flex items-center gap-1">
          <span>OPT:</span>
          <span className={mode === 'release' ? 'text-[#ffb868] font-bold' : 'text-[#94a3b8]'}>
            {mode === 'release' ? '-O3 (Release)' : '-O0 (Debug)'}
          </span>
        </div>

        <span className="text-neutral-700">|</span>

        <div className="flex items-center gap-1 text-[9px] text-[#94a3b8]/70">
          <span>{latencyMs}ms</span>
        </div>
      </div>
    </footer>
  );
};
