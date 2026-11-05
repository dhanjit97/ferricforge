/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Compass,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Code2,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface BorrowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCode: (code: string) => void;
}

interface BorrowCase {
  id: string;
  errorCode: string;
  title: string;
  description: string;
  invalidCode: string;
  validCode: string;
  systemsWhy: string;
}

const BORROW_CASES: BorrowCase[] = [
  {
    id: 'e0382-move',
    errorCode: 'E0382',
    title: 'Use of Moved Value (Ownership Transfer)',
    description: 'Passing or assigning a non-Copy type by value invalidates the original binding.',
    invalidCode: `fn main() {
    let s1 = String::from("ferric");
    let s2 = s1; // Ownership moved to s2!
    
    // ERROR[E0382]: borrow of moved value: \`s1\`
    println!("s1: {}", s1);
}`,
    validCode: `fn main() {
    let s1 = String::from("ferric");
    let s2 = &s1; // Borrowed immutably via &
    
    println!("s1: {}, s2: {}", s1, s2);
    // Both accessible safely!
}`,
    systemsWhy: 'String holds a heap pointer. If s1 were still valid after s2 = s1, both would call Drop::drop() at scope exit, causing a fatal double-free.',
  },
  {
    id: 'e0502-aliasing-xor-mut',
    errorCode: 'E0502',
    title: 'Simultaneous Immutable & Mutable Borrows (Aliasing XOR Mutability)',
    description: 'Reading through an immutable reference while a mutable reference exists is prohibited.',
    invalidCode: `fn main() {
    let mut vec = vec![1, 2, 3];
    let first = &vec[0]; // Immutable borrow
    
    // ERROR[E0502]: cannot borrow \`vec\` as mutable
    vec.push(4); 
    
    println!("First element: {}", first);
}`,
    validCode: `fn main() {
    let mut vec = vec![1, 2, 3];
    let first = vec[0]; // Copy the i32 value out
    
    vec.push(4); // Safe: no references outstanding
    println!("First was: {}", first);
}`,
    systemsWhy: 'vec.push() may reallocate the heap buffer if capacity is reached. If \`first\` still pointed to the old buffer, it would become a dangling pointer (use-after-free).',
  },
  {
    id: 'e0499-double-mut',
    errorCode: 'E0499',
    title: 'Multiple Mutable Borrows in the Same Scope',
    description: 'Only one exclusive mutable reference is permitted at any instant.',
    invalidCode: `fn main() {
    let mut counter = 0;
    let r1 = &mut counter;
    let r2 = &mut counter; // ERROR[E0499]: cannot borrow twice as mutable
    
    *r1 += 1;
    *r2 += 2;
}`,
    validCode: `fn main() {
    let mut counter = 0;
    {
        let r1 = &mut counter;
        *r1 += 1;
    } // r1 lifetime ends here (Non-Lexical Lifetimes)
    
    let r2 = &mut counter;
    *r2 += 2;
    println!("Counter: {}", counter);
}`,
    systemsWhy: 'Exclusive access guarantees that the compiler can optimize variable reads into CPU registers without worrying about another thread or pointer modifying the memory.',
  },
  {
    id: 'e0597-dangling',
    errorCode: 'E0597',
    title: 'Dangling Reference (Value Does Not Live Long Enough)',
    description: 'A reference cannot outlive the stack frame or scope of the data it references.',
    invalidCode: `fn main() {
    let r;
    {
        let x = 42;
        r = &x; // ERROR[E0597]: \`x\` does not live long enough
    } // x is popped off stack here
    
    println!("r: {}", r);
}`,
    validCode: `fn main() {
    let x = 42;
    let r = &x;
    println!("r: {}", r);
}`,
    systemsWhy: 'When a stack frame or inner block ends, stack memory is reclaimed. Reading a pointer to popped stack memory results in undefined behavior or memory corruption.',
  },
];

export const BorrowGuideModal: React.FC<BorrowGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadCode,
}) => {
  const [activeCaseId, setActiveCaseId] = useState<string>(BORROW_CASES[0].id);

  const activeCase = BORROW_CASES.find((c) => c.id === activeCaseId) || BORROW_CASES[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] sm:h-[86vh] bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.08] bg-[#161d2d] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-[#ff5400]/15 border border-[#ff5400]/40 flex items-center justify-center text-[#ff5400] shrink-0">
              <Compass size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#e1e2ec] leading-tight truncate">
                The Rust Borrow Checker &amp; Lifetimes Guide
              </h2>
              <p className="font-mono text-[10px] text-[#94a3b8] mt-0.5 truncate hidden sm:block">
                Deterministic memory safety without a garbage collector: Core rules &amp; error patterns
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

        {/* 3 Golden Rules Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 border-b border-white/[0.08] bg-[#0a0d14]/70 shrink-0">
          <div className="p-2 sm:p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
            <span className="font-mono text-[10px] font-bold text-[#ff5400] block mb-0.5">RULE 1: UNIQUE OWNERSHIP</span>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">Each value has an owner. There is exactly one owner at any instant.</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
            <span className="font-mono text-[10px] font-bold text-[#00f0ff] block mb-0.5">RULE 2: AUTOMATIC DROP</span>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">When an owner goes out of scope, its value is immediately deallocated.</p>
          </div>
          <div className="p-2 sm:p-2.5 rounded bg-[#161d2d] border border-white/[0.06]">
            <span className="font-mono text-[10px] font-bold text-[#10b981] block mb-0.5">RULE 3: ALIASING XOR MUTABILITY</span>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8]">Any number of immutable &amp;T OR exactly one mutable &amp;mut T. Never both.</p>
          </div>
        </div>

        {/* Responsive Layout: Stacked on mobile, 2-Column on Desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left / Top Error Cases */}
          <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0a0d14]/60 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 font-mono text-xs no-scrollbar">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#ff5400] font-semibold px-1 hidden md:block mb-1">
              Classic Traps Matrix
            </span>

            {BORROW_CASES.map((c) => {
              const isActive = c.id === activeCase.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCaseId(c.id)}
                  className={`text-left p-2 sm:p-2.5 rounded transition-all border shrink-0 md:shrink md:w-full ${
                    isActive
                      ? 'bg-[#ff5400]/15 border-[#ff5400] text-[#e1e2ec] font-semibold'
                      : 'bg-[#101520] border-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[10px] text-[#ff5400]">{c.errorCode}</span>
                    <span className="truncate text-[11px] max-w-[140px] md:max-w-none">{c.title.split(' ')[0]}</span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8]/80 mt-0.5 line-clamp-1 hidden md:block">{c.title}</p>
                </button>
              );
            })}
          </div>

          {/* Right / Main Code Comparison */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30">
                  {activeCase.errorCode}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#e1e2ec]">
                  {activeCase.title}
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                {activeCase.description}
              </p>
            </div>

            {/* Side-by-Side Code View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Invalid / Rejected */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#f43f5e] flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>Compiler Rejection (Bug)</span>
                  </span>
                  <button
                    onClick={() => {
                      onLoadCode(activeCase.invalidCode);
                      onClose();
                    }}
                    className="font-mono text-[10px] text-[#f43f5e] hover:underline"
                  >
                    Test Live &gt;
                  </button>
                </div>
                <div className="p-3 sm:p-3.5 rounded bg-[#0a0d14] border border-[#f43f5e]/30 font-mono text-[11px] sm:text-xs text-[#e1e2ec] whitespace-pre overflow-x-auto leading-relaxed">
                  {activeCase.invalidCode}
                </div>
              </div>

              {/* Valid / Accepted */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#10b981] flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Idiomatic Safe Fix</span>
                  </span>
                  <button
                    onClick={() => {
                      onLoadCode(activeCase.validCode);
                      onClose();
                    }}
                    className="font-mono text-[10px] text-[#10b981] hover:underline"
                  >
                    Test Live &gt;
                  </button>
                </div>
                <div className="p-3 sm:p-3.5 rounded bg-[#0a0d14] border border-[#10b981]/30 font-mono text-[11px] sm:text-xs text-[#e1e2ec] whitespace-pre overflow-x-auto leading-relaxed">
                  {activeCase.validCode}
                </div>
              </div>
            </div>

            {/* Systems Explanation */}
            <div className="p-3.5 sm:p-4 rounded bg-[#161d2d] border border-white/[0.08] space-y-1.5">
              <span className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider block">
                The Systems &amp; Hardware Rationale
              </span>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {activeCase.systemsWhy}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
