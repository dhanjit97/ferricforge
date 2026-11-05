/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TypeMemoryExplorerProps {
  code: string;
}

interface StackVariable {
  name: string;
  type: string;
  stackAddress: string;
  stackSize: string;
  heapPointer?: string;
  heapDetails?: {
    len: number;
    cap: number;
    elements: string[];
    heapAddress: string;
  };
  borrowState: 'owned' | 'borrowed' | 'mut_borrowed' | 'moved';
  lifetimeScope: string;
}

export const TypeMemoryExplorer: React.FC<TypeMemoryExplorerProps> = ({ code }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('auto');
  const [viewFilter, setViewFilter] = useState<'all' | 'stack' | 'heap'>('all');

  // Parse variables from user code or use educational preset models
  const parsedVariables: StackVariable[] = useMemo(() => {
    if (selectedPreset === 'string_model') {
      return [
        {
          name: 'greeting',
          type: 'String',
          stackAddress: '0x7ffd10a0',
          stackSize: '24 bytes (ptr + cap + len)',
          heapPointer: '0x55c820f0',
          heapDetails: {
            len: 5,
            cap: 8,
            elements: ['h', 'e', 'l', 'l', 'o'],
            heapAddress: '0x55c820f0',
          },
          borrowState: 'owned',
          lifetimeScope: "'main [L1-L18]",
        },
        {
          name: 'view_ref',
          type: '&str',
          stackAddress: '0x7ffd10b8',
          stackSize: '16 bytes (ptr + len)',
          heapPointer: '0x55c820f0',
          borrowState: 'borrowed',
          lifetimeScope: "'view [L5-L12]",
        },
      ];
    }

    if (selectedPreset === 'vec_growth') {
      return [
        {
          name: 'numbers',
          type: 'Vec<i32>',
          stackAddress: '0x7ffd2000',
          stackSize: '24 bytes (ptr: 8, cap: 8, len: 8)',
          heapPointer: '0x55d911a0',
          heapDetails: {
            len: 4,
            cap: 8,
            elements: ['10', '20', '30', '40'],
            heapAddress: '0x55d911a0',
          },
          borrowState: 'owned',
          lifetimeScope: "'main [L1-L24]",
        },
      ];
    }

    if (selectedPreset === 'box_indirection') {
      return [
        {
          name: 'boxed_node',
          type: 'Box<TreeNode>',
          stackAddress: '0x7ffd3000',
          stackSize: '8 bytes (single pointer)',
          heapPointer: '0x55e940b0',
          heapDetails: {
            len: 1,
            cap: 1,
            elements: ['val: 42', 'left: None', 'right: None'],
            heapAddress: '0x55e940b0',
          },
          borrowState: 'owned',
          lifetimeScope: "'tree [L2-L30]",
        },
      ];
    }

    // Auto-parse from the current Rust code
    const lines = code.split('\n');
    const vars: StackVariable[] = [];
    let addrCounter = 0x7ffd10a0;
    let heapCounter = 0x55b10000;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const letMatch = trimmed.match(/let\s+(mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*([^=;]+))?\s*(?:=\s*([^;]+))?/);
      if (letMatch) {
        const isMut = Boolean(letMatch[1]);
        const name = letMatch[2];
        const rawType = letMatch[3]?.trim();
        const rhs = letMatch[4]?.trim() || '';

        // Infer type and heap structure
        let type = rawType || 'i32';
        let stackSize = '4 bytes';
        let heapPointer: string | undefined = undefined;
        let heapDetails: StackVariable['heapDetails'] | undefined = undefined;

        if (rhs.includes('String::from') || rhs.includes('.to_string()') || type === 'String') {
          type = 'String';
          stackSize = '24 bytes';
          const match = rhs.match(/["']([^"']*)["']/);
          const strVal = match ? match[1] : 'rust';
          heapPointer = `0x${heapCounter.toString(16)}`;
          heapDetails = {
            len: strVal.length,
            cap: strVal.length + 4,
            elements: strVal.split('').slice(0, 12),
            heapAddress: heapPointer,
          };
          heapCounter += 0x20;
        } else if (rhs.includes('vec!') || rhs.includes('Vec::new') || type.startsWith('Vec')) {
          type = type.startsWith('Vec') ? type : 'Vec<i32>';
          stackSize = '24 bytes';
          const elemsMatch = rhs.match(/vec!\[(.*)\]/);
          const elements = elemsMatch ? elemsMatch[1].split(',').map((s) => s.trim()) : ['1', '2', '3'];
          heapPointer = `0x${heapCounter.toString(16)}`;
          heapDetails = {
            len: elements.length,
            cap: Math.max(4, elements.length * 2),
            elements: elements.slice(0, 8),
            heapAddress: heapPointer,
          };
          heapCounter += 0x40;
        } else if (rhs.includes('Box::new') || type.startsWith('Box')) {
          type = 'Box<T>';
          stackSize = '8 bytes (raw ptr)';
          heapPointer = `0x${heapCounter.toString(16)}`;
          heapDetails = {
            len: 1,
            cap: 1,
            elements: ['Value: 42'],
            heapAddress: heapPointer,
          };
          heapCounter += 0x20;
        } else if (rhs.startsWith('&mut ')) {
          type = '&mut ' + rhs.replace('&mut ', '');
          stackSize = '8 bytes (exclusive ptr)';
        } else if (rhs.startsWith('&')) {
          type = '&' + rhs.replace('&', '');
          stackSize = '8 bytes (shared ptr)';
        } else if (rhs.startsWith('"')) {
          type = '&str';
          stackSize = '16 bytes (fat ptr)';
        }

        vars.push({
          name,
          type,
          stackAddress: `0x${addrCounter.toString(16)}`,
          stackSize,
          heapPointer,
          heapDetails,
          borrowState: isMut ? 'owned' : 'owned',
          lifetimeScope: `'frame_${idx + 1}`,
        });

        addrCounter += 0x18;
      }
    });

    if (vars.length === 0) {
      return [
        {
          name: 'buffer',
          type: 'String',
          stackAddress: '0x7ffd10a0',
          stackSize: '24 bytes (ptr + cap + len)',
          heapPointer: '0x55b10000',
          heapDetails: {
            len: 11,
            cap: 16,
            elements: ['F', 'e', 'r', 'r', 'i', 'c', 'F', 'o', 'r', 'g', 'e'],
            heapAddress: '0x55b10000',
          },
          borrowState: 'owned',
          lifetimeScope: "'main",
        },
      ];
    }

    return vars.slice(0, 6);
  }, [code, selectedPreset]);

  const heapVars = useMemo(() => parsedVariables.filter((v) => v.heapDetails), [parsedVariables]);

  return (
    <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-none space-y-3 min-w-0">
      {/* Preset & Filter Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#00f0ff] font-bold text-[11px]">
            <Layers size={13} />
            <span>MEMORY TOPOLOGY</span>
          </div>

          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="bg-[#0a0d14] border border-white/[0.1] rounded px-2 py-0.5 text-[10px] text-[#e1e2ec] focus:outline-none focus:border-[#00f0ff] max-w-[160px] truncate"
          >
            <option value="auto">Auto-Detect from Code</option>
            <option value="string_model">String: Fat Pointer</option>
            <option value="vec_growth">Vec&lt;T&gt;: Growth</option>
            <option value="box_indirection">Box&lt;T&gt;: Indirection</option>
          </select>
        </div>

        {/* View Filter Pills */}
        <div className="flex items-center gap-1 bg-[#0a0d14] p-0.5 rounded border border-white/[0.06] text-[10px]">
          <button
            onClick={() => setViewFilter('all')}
            className={`flex-1 py-0.5 rounded transition-all ${
              viewFilter === 'all' ? 'bg-[#ff5400] text-white font-bold' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            All Planes
          </button>
          <button
            onClick={() => setViewFilter('stack')}
            className={`flex-1 py-0.5 rounded transition-all ${
              viewFilter === 'stack' ? 'bg-[#ff5400] text-white font-bold' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Stack Frame ({parsedVariables.length})
          </button>
          <button
            onClick={() => setViewFilter('heap')}
            className={`flex-1 py-0.5 rounded transition-all ${
              viewFilter === 'heap' ? 'bg-[#00f0ff] text-black font-bold' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Heap ({heapVars.length})
          </button>
        </div>
      </div>

      {/* Aliasing XOR Mutability Invariant Card */}
      <div className="p-2.5 rounded bg-[#161d2d] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck size={16} className="text-[#10b981] shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#e1e2ec] uppercase tracking-wider truncate">
              Aliasing XOR Mutability
            </div>
            <div className="text-[9px] text-[#94a3b8] truncate">
              &amp;T <span className="text-[#00f0ff] font-bold">XOR</span> &amp;mut T
            </div>
          </div>
        </div>
        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 shrink-0">
          CLEAN
        </span>
      </div>

      {/* Stack Frame View */}
      {(viewFilter === 'all' || viewFilter === 'stack') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] font-bold text-[#ff5400] tracking-wider uppercase">
              Call Stack (L1 / Register Frame)
            </span>
            <span className="text-[9px] text-[#94a3b8]">RAII Drop</span>
          </div>

          <div className="space-y-2">
            {parsedVariables.map((v, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#101520] border border-white/[0.08] hover:border-[#ff5400]/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-[#e1e2ec] truncate">{v.name}</span>
                    <span className="font-mono text-[10px] text-[#00f0ff] truncate max-w-[120px]">{v.type}</span>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-500 shrink-0">{v.stackAddress}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                  <span>Size: {v.stackSize}</span>
                  <span className="text-[#ffb868] text-[9px] truncate">{v.lifetimeScope}</span>
                </div>

                {v.heapPointer && (
                  <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400">Pointer to Heap:</span>
                    <span className="text-[#00f0ff] font-bold flex items-center gap-1">
                      <span>{v.heapPointer}</span>
                      <ArrowRight size={10} className="text-[#00f0ff]" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heap Allocations View */}
      {(viewFilter === 'all' || viewFilter === 'heap') && heapVars.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] font-bold text-[#00f0ff] tracking-wider uppercase">
              Heap Allocations
            </span>
            <span className="text-[9px] text-[#94a3b8]">Single-Owner Buffer</span>
          </div>

          <div className="space-y-2">
            {heapVars.map((v, idx) => {
              const heap = v.heapDetails!;
              const unallocated = Math.max(0, heap.cap - heap.len);
              const visibleUnallocated = Math.min(6, unallocated);

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#101520] border border-[#00f0ff]/30 shadow-[0_0_12px_rgba(0,240,255,0.06)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Database size={12} className="text-[#00f0ff] shrink-0" />
                      <span className="font-bold text-xs text-[#00f0ff] truncate">{heap.heapAddress}</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#94a3b8] shrink-0">
                      Len: {heap.len} / Cap: {heap.cap}
                    </span>
                  </div>

                  {/* Byte Cells */}
                  <div className="flex flex-wrap gap-1 p-1.5 rounded bg-[#0a0d14] border border-white/[0.06]">
                    {heap.elements.map((el, eIdx) => (
                      <div
                        key={eIdx}
                        className="px-1.5 py-0.5 rounded bg-[#161d2d] text-[#e1e2ec] font-mono text-[10px] border border-white/[0.1] text-center min-w-[20px]"
                      >
                        {el}
                      </div>
                    ))}
                    {Array.from({ length: visibleUnallocated }).map((_, cIdx) => (
                      <div
                        key={`cap-${cIdx}`}
                        className="px-1.5 py-0.5 rounded bg-[#0a0d14] text-neutral-600 font-mono text-[10px] border border-dashed border-white/[0.06] text-center min-w-[20px]"
                        title="Uninitialized capacity byte"
                      >
                        0x0
                      </div>
                    ))}
                    {unallocated > 6 && (
                      <div className="px-1 py-0.5 text-[9px] text-[#94a3b8]/60 flex items-center">
                        +{unallocated - 6} more cap
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-neutral-400">
                    <span>Drop: Drop::drop()</span>
                    <span className="text-[#10b981]">Deterministic Deallocation</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Systems Telemetry Notes */}
      <div className="p-2.5 rounded bg-[#0a0d14] border border-white/[0.06] space-y-1 text-[10px] text-[#94a3b8] leading-relaxed">
        <div className="flex items-center gap-1.5 text-[#ffb868] font-bold">
          <Sparkles size={11} />
          <span>Zero-Cost Runtime Guarantee</span>
        </div>
        <p>
          Memory is reclaimed deterministically at block exit. No stop-the-world garbage collection pauses, no hidden runtime overhead.
        </p>
      </div>
    </div>
  );
};
