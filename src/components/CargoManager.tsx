/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Boxes,
  Search,
  Plus,
  ExternalLink,
  Check,
  FileCode,
  Tag,
} from 'lucide-react';
import { POPULAR_CRATES } from '../utils/crateRegistry';
import { CrateItem } from '../types/rust';

interface CargoManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCrate: (crateName: string, version: string) => void;
  onLoadSnippet: (code: string) => void;
}

export const CargoManager: React.FC<CargoManagerProps> = ({
  isOpen,
  onClose,
  onAddCrate,
  onLoadSnippet,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addedCrates, setAddedCrates] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const categories = ['All', 'Async & Network', 'Serialization', 'Utilities', 'Performance'];

  const filteredCrates = POPULAR_CRATES.filter((c: CrateItem) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleAdd = (c: CrateItem) => {
    onAddCrate(c.name, c.version);
    setAddedCrates((prev) => new Set([...prev, c.name]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[80vh] bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#161d2d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#ffb868]/15 border border-[#ffb868]/40 flex items-center justify-center text-[#ffb868]">
              <Boxes size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e1e2ec] leading-tight">
                Cargo Crates Registry &amp; Dependencies
              </h2>
              <p className="font-mono text-[10px] text-[#94a3b8] mt-0.5">
                Popular crates pre-cached and supported on the Rust Playground
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

        {/* Filter Bar */}
        <div className="p-4 border-b border-white/[0.08] bg-[#0a0d14]/70 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crates (tokio, serde, anyhow, rayon, rand)..."
              className="w-full bg-[#161d2d] border border-white/[0.1] text-xs font-mono pl-9 pr-3 py-2 rounded text-[#e1e2ec] focus:outline-none focus:border-[#ffb868]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded font-mono text-[11px] whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-[#ffb868]/15 border-[#ffb868] text-[#ffb868] font-bold'
                    : 'bg-[#161d2d] border-transparent text-[#94a3b8] hover:text-[#e1e2ec]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Crates Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCrates.map((crate: CrateItem) => {
            const isAdded = addedCrates.has(crate.name);
            return (
              <div
                key={crate.name}
                className="p-3.5 rounded bg-[#161d2d] border border-white/[0.06] hover:border-white/[0.15] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#ffb868]">{crate.name}</span>
                      <span className="font-mono text-[10px] text-[#94a3b8]">v{crate.version}</span>
                    </div>

                    <a
                      href={`https://crates.io/crates/${crate.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#94a3b8] hover:text-[#00f0ff] p-1"
                      title="View on crates.io"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <p className="text-xs text-[#94a3b8] mt-1.5 line-clamp-2 leading-relaxed">
                    {crate.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => {
                      onLoadSnippet(crate.importSnippet);
                      onClose();
                    }}
                    className="flex items-center gap-1 font-mono text-[10px] text-[#00f0ff] hover:underline"
                  >
                    <FileCode size={11} />
                    <span>View Example</span>
                  </button>

                  <button
                    onClick={() => handleAdd(crate)}
                    className={`flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded transition-all border ${
                      isAdded
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                        : 'bg-[#ff5400] text-white hover:bg-[#ff6d00] border-[#ff7a29]/40'
                    }`}
                  >
                    {isAdded ? <Check size={12} /> : <Plus size={12} />}
                    <span>{isAdded ? 'Added' : 'Add to Cargo.toml'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
