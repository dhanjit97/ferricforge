import React, { useState, useEffect, useRef } from 'react';
import { RUST_SNIPPETS } from '../utils/rustSnippets';
import { RustSnippet } from '../types/rust';
import { BookOpen, Search, ArrowRight, X, Play } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippet: (snippet: RustSnippet) => void;
}

export const CookbookModal: React.FC<CookbookModalProps> = ({
  isOpen,
  onClose,
  onSelectSnippet,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(RUST_SNIPPETS[0]?.id || '');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside the modal when open
  useFocusTrap(isOpen, modalRef);

  if (!isOpen) return null;

  const categories = ['all', 'Basics', 'Borrowing & Lifetimes', 'Async & Concurrency', 'Idioms', 'Performance'];

  const filtered = RUST_SNIPPETS.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || s.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const previewSnippet = filtered.length > 0
    ? (filtered.find((s) => s.id === selectedSnippetId) || filtered[0])
    : null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden select-none theme-panel" ref={modalRef}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#DE3804]/20 text-[#DE3804]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Rust Cookbook & Idiom Library</h2>
              <p className="text-xs text-neutral-400">Curated, battle-tested patterns ready to run</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Cookbook"
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center justify-between gap-4 px-5 py-2.5 border-b border-neutral-800/80 bg-[#141417]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search cookbook (borrowing, async, iterators, simd)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#DE3804] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Split: List on Left, Preview on Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Snippet List */}
          <div className="w-2/5 border-r border-neutral-800 overflow-y-auto divide-y divide-neutral-800/60 p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 text-xs">
                No snippets found matching "{search}".
              </div>
            ) : (
              filtered.map((snippet) => {
                const isSelected = previewSnippet?.id === snippet.id;
                return (
                  <div
                    key={snippet.id}
                    onClick={() => setSelectedSnippetId(snippet.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-800/90 border border-neutral-700 shadow-xs'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500">
                        {snippet.category}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.2 rounded">
                        Edition {snippet.edition}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-neutral-200 mb-1">
                      {snippet.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {snippet.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Snippet Preview */}
          <div className="flex-1 flex flex-col bg-[#0e0e11] overflow-hidden select-text">
            {previewSnippet ? (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#121215]">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-200">{previewSnippet.title}</h3>
                    <p className="text-[11px] text-neutral-400">{previewSnippet.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSnippet(previewSnippet);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium text-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load & Run</span>
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-neutral-300 bg-[#0a0a0d]">
                  <pre className="whitespace-pre">{previewSnippet.code}</pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs">
                No snippet selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
