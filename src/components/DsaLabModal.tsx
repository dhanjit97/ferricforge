/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DSA_TOPICS, DsaTopic } from '../utils/dsaData';
import {
  Binary,
  Layers,
  ArrowRight,
  Play,
  Copy,
  Check,
  Cpu,
  Brain,
  HelpCircle,
  Network,
  GitFork,
  Flame,
  Search,
} from 'lucide-react';

interface DsaLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSnippetToEditor: (code: string) => void;
}

export const DsaLabModal: React.FC<DsaLabModalProps> = ({
  isOpen,
  onClose,
  onLoadSnippetToEditor,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(DSA_TOPICS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTopic = DSA_TOPICS.find((t) => t.id === selectedTopicId) || DSA_TOPICS[0];

  const filteredTopics = DSA_TOPICS.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.rustParadigm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.whyTrickyInRust.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTopic.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleLoadAndRun = () => {
    onLoadSnippetToEditor(currentTopic.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#121214] border border-neutral-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#16161a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[#DE3804]">
              <Binary className="w-5 h-5 text-[#DE3804]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  DSA in Rust: Memory Models & Algorithms Lab
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Zero-Unsafe
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Master how Rust solves Linked Lists, Graphs, Trees, and Divide-and-Conquer without fighting the borrow checker.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer text-sm font-semibold"
            aria-label="Close DSA Lab"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Topics list */}
          <div className="w-80 border-r border-neutral-800 bg-[#14151a] flex flex-col shrink-0">
            {/* Search & Categories */}
            <div className="p-3 border-b border-neutral-800/80 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search DSA topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'lists-stacks', label: 'Lists/Stacks' },
                  { id: 'trees-graphs', label: 'Trees/Graphs' },
                  { id: 'algorithms', label: 'Algorithms' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium ${
                      selectedCategory === cat.id
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredTopics.map((topic) => {
                const isSelected = topic.id === currentTopic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1f26] border-orange-500/50 shadow-sm'
                        : 'bg-transparent border-neutral-800/60 hover:bg-neutral-900/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs font-semibold leading-snug line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-neutral-300'
                        }`}
                      >
                        {topic.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          topic.difficulty === 'Beginner'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : topic.difficulty === 'Intermediate'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {topic.difficulty}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate">
                        {topic.rustParadigm.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Memory Tip */}
            <div className="p-3 border-t border-neutral-800 bg-[#121214] text-[11px] text-neutral-400 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                <strong>The 1 Golden Rule:</strong> Standard C++ OOP pointers fail in Rust due to aliasing XOR mutability. Use arenas (Vec) or Box / Weak!
              </span>
            </div>
          </div>

          {/* Right Main Detail Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Topic Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-orange-400 uppercase tracking-wider">
                    {currentTopic.category.replace('-', ' ')}
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-xs text-neutral-400">{currentTopic.rustParadigm}</span>
                </div>
                <h1 className="text-xl font-bold text-white">{currentTopic.title}</h1>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={handleLoadAndRun}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Load into Playground</span>
                </button>
              </div>
            </div>

            {/* Complexity Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Access / Search</div>
                <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                  {currentTopic.timeComplexity.search || currentTopic.timeComplexity.access || 'O(n)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Insertion</div>
                <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                  {currentTopic.timeComplexity.insertion || 'O(1)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Deletion</div>
                <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                  {currentTopic.timeComplexity.deletion || 'O(1)'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Space Complexity</div>
                <div className="text-sm font-mono font-bold text-orange-400 mt-0.5">
                  {currentTopic.spaceComplexity}
                </div>
              </div>
            </div>

            {/* Why it's tricky in Rust */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-neutral-300">
              <div className="flex items-center gap-2 mb-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>The Borrow Checker Dilemma in Rust</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-300">
                {currentTopic.whyTrickyInRust}
              </p>
            </div>

            {/* Visual ASCII Memory Model */}
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Memory Architecture Diagram</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Stack ↔ Heap Layout</span>
              </div>
              <pre className="p-3 rounded-lg bg-black/60 border border-neutral-800/80 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                {currentTopic.memoryDiagram.trim()}
              </pre>
            </div>

            {/* Core Concepts */}
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Idiomatic Rust Principles</span>
              </h3>
              <ul className="space-y-2 text-xs text-neutral-300">
                {currentTopic.conceptExplanation.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Runnable Rust Implementation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Complete Runnable Implementation with Unit Tests</span>
                </span>
                <span className="text-[10px] text-neutral-400">Click &quot;Load into Playground&quot; above to run</span>
              </div>

              <div className="relative rounded-xl border border-neutral-800 bg-[#0d1117] overflow-hidden">
                <pre className="p-4 text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed max-h-96">
                  {currentTopic.code}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
