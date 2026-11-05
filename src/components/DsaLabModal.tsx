/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Layers,
  Cpu,
  Database,
  ArrowRight,
  FileCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DSA_TOPICS, DsaTopic } from '../utils/dsaData';

interface DsaLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCode: (code: string) => void;
}

export const DsaLabModal: React.FC<DsaLabModalProps> = ({
  isOpen,
  onClose,
  onLoadCode,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(DSA_TOPICS[0].id);

  const topic = DSA_TOPICS.find((t) => t.id === selectedTopicId) || DSA_TOPICS[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] sm:h-[86vh] bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.08] bg-[#161d2d] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#e1e2ec] leading-tight truncate">
                Rust DSA &amp; Memory Topology Lab
              </h2>
              <p className="font-mono text-[10px] text-[#94a3b8] mt-0.5 truncate hidden sm:block">
                Low-level pointer semantics, self-referential graph limits, and zero-cost layouts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Responsive Layout: Stacked on mobile, 2-column on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left / Top Topics Selector */}
          <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0a0d14]/70 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 font-mono text-xs no-scrollbar">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#00f0ff] font-semibold px-1 hidden md:block mb-1">
              Data Structures ({DSA_TOPICS.length})
            </span>

            {DSA_TOPICS.map((t) => {
              const isActive = t.id === topic.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  className={`text-left p-2 sm:p-2.5 rounded transition-all border shrink-0 md:shrink md:w-full ${
                    isActive
                      ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-[#e1e2ec] font-semibold'
                      : 'bg-[#101520] border-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] truncate max-w-[140px] md:max-w-none">{t.title}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2 mt-1 text-[9px] text-[#94a3b8]/70">
                    <span className="text-[#ffb868]">{t.difficulty}</span>
                    <span>•</span>
                    <span>{t.spaceComplexity}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right / Main Topic Details */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#00f0ff] tracking-wider px-2 py-0.5 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30">
                  {topic.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#e1e2ec] mt-2">
                  {topic.title}
                </h3>
                <p className="font-mono text-xs text-[#ffb868] mt-1 break-words">
                  Rust Paradigm: {topic.rustParadigm}
                </p>
              </div>

              <button
                onClick={() => {
                  onLoadCode(topic.code);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ff5400] text-white font-semibold text-xs hover:bg-[#ff6d00] shadow-[0_0_16px_rgba(255,84,0,0.35)] transition-all shrink-0 font-mono"
              >
                <FileCode size={13} />
                <span>Load in Workbench</span>
              </button>
            </div>

            {/* Complexity Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
                <span className="text-[10px] text-[#94a3b8] block">Search</span>
                <span className="font-bold text-[#00f0ff] text-xs sm:text-sm mt-0.5 block truncate">{topic.timeComplexity.search || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
                <span className="text-[10px] text-[#94a3b8] block">Insertion</span>
                <span className="font-bold text-[#10b981] text-xs sm:text-sm mt-0.5 block truncate">{topic.timeComplexity.insertion || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
                <span className="text-[10px] text-[#94a3b8] block">Deletion</span>
                <span className="font-bold text-[#f43f5e] text-xs sm:text-sm mt-0.5 block truncate">{topic.timeComplexity.deletion || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
                <span className="text-[10px] text-[#94a3b8] block">Space</span>
                <span className="font-bold text-[#ffb868] text-xs sm:text-sm mt-0.5 block truncate">{topic.spaceComplexity}</span>
              </div>
            </div>

            {/* Why Tricky in Rust */}
            <div className="p-3.5 rounded bg-[#161d2d] border border-[#ff5400]/30 space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#ff5400]">
                <AlertTriangle size={13} />
                <span>WHY TRICKY IN RUST? (THE SYSTEMS PERSPECTIVE)</span>
              </div>
              <p className="text-xs text-[#e1e2ec] leading-relaxed">
                {topic.whyTrickyInRust}
              </p>
            </div>

            {/* Memory Topology ASCII Diagram */}
            {topic.memoryDiagram && (
              <div className="space-y-2">
                <span className="font-mono text-xs font-bold text-[#00f0ff]">
                  Stack &amp; Heap Memory Topology
                </span>
                <div className="p-3 sm:p-4 rounded bg-[#0a0d14] border border-white/[0.08] font-mono text-[11px] sm:text-xs text-[#00f0ff] whitespace-pre overflow-x-auto leading-tight">
                  {topic.memoryDiagram}
                </div>
              </div>
            )}

            {/* Key Architectural Invariants */}
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#10b981]">
                Key Rules &amp; Memory Invariants
              </span>
              <ul className="space-y-1.5">
                {topic.keyRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#94a3b8]">
                    <CheckCircle2 size={13} className="text-[#10b981] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code Implementation */}
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-[#e1e2ec]">
                Zero-Leak Rust Implementation
              </span>
              <div className="p-3 sm:p-4 rounded bg-[#0a0d14] border border-white/[0.08] font-mono text-[11px] sm:text-xs text-[#e1e2ec] whitespace-pre overflow-x-auto max-h-72">
                {topic.code}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
