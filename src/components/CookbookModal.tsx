/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileCode2,
  Search,
  Code2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RUST_SNIPPETS } from '../utils/rustSnippets';
import { RustSnippet } from '../types/rust';

interface CookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSnippet: (code: string) => void;
}

export const CookbookModal: React.FC<CookbookModalProps> = ({
  isOpen,
  onClose,
  onLoadSnippet,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(RUST_SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);

  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const el = categoryContainerRef.current;
    if (el) {
      el.scrollLeft += e.deltaY;
    }
  };

  if (!isOpen) return null;

  const categories = ['All', 'Basics', 'Borrowing & Lifetimes', 'Async & Concurrency', 'Idioms', 'Performance', 'Data Structures'];

  const filteredSnippets = RUST_SNIPPETS.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset selected snippet when category changes so the active highlight stays in view
  useEffect(() => {
    const firstInCategory = filteredSnippets[0];
    if (firstInCategory && selectedSnippetId !== firstInCategory.id) {
      setSelectedSnippetId(firstInCategory.id);
    }
  }, [selectedCategory, filteredSnippets]);

  const activeSnippet = filteredSnippets.find((s) => s.id === selectedSnippetId) || filteredSnippets[0] || RUST_SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[84vh] bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#161d2d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#ff5400]/15 border border-[#ff5400]/40 flex items-center justify-center text-[#ff5400]">
              <FileCode2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e1e2ec] leading-tight">
                Rust Systems Cookbook &amp; Recipes
              </h2>
              <p className="font-mono text-[10px] text-[#94a3b8] mt-0.5">
                Production-grade idioms, zero-copy parsers, concurrency patterns, and algorithms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.08] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Explorer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Snippet List */}
          <div className="w-72 border-r border-white/[0.08] bg-[#0a0d14]/70 p-3 flex flex-col gap-2 overflow-hidden font-mono text-xs">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#94a3b8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes..."
                className="w-full bg-[#161d2d] border border-white/[0.1] text-xs pl-8 pr-2.5 py-1.5 rounded text-[#e1e2ec] focus:outline-none focus:border-[#ff5400]"
              />
            </div>

            {/* Categories */}
            <div
              ref={categoryContainerRef}
              onWheel={handleCategoryWheel}
              className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin text-[10px]"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap ${
                    selectedCategory === c ? 'bg-[#ff5400] text-white font-bold' : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredSnippets.map((s) => {
                const isActive = s.id === activeSnippet.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSnippetId(s.id)}
                    className={`w-full text-left p-2.5 rounded transition-all border ${
                      isActive
                        ? 'bg-[#ff5400]/15 border-[#ff5400] text-[#e1e2ec] font-semibold'
                        : 'bg-[#101520] border-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] truncate font-bold">{s.title}</span>
                    </div>
                    <span className="text-[9px] text-[#ffb868] mt-0.5 block">{s.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Code Preview */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#ff5400] px-2 py-0.5 rounded bg-[#ff5400]/10 border border-[#ff5400]/30 uppercase">
                    {activeSnippet.category}
                  </span>
                  <h3 className="text-base font-bold text-[#e1e2ec] mt-2">
                    {activeSnippet.title}
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    {activeSnippet.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded bg-[#161d2d] border border-white/[0.08] text-[#94a3b8] hover:text-white transition-colors"
                    title="Copy Code"
                  >
                    {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={() => {
                      onLoadSnippet(activeSnippet.code);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ff5400] text-white font-semibold text-xs hover:bg-[#ff6d00] shadow-[0_0_16px_rgba(255,84,0,0.35)] transition-all font-mono"
                  >
                    <Code2 size={13} />
                    <span>Load in Workbench</span>
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="p-4 rounded bg-[#0a0d14] border border-white/[0.08] font-mono text-xs text-[#e1e2ec] whitespace-pre overflow-x-auto leading-relaxed">
                {activeSnippet.code}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px] text-[#94a3b8]">
              <span>RUST EDITION: 2021 / 2024</span>
              <span>ZERO-COST CHECK: VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
