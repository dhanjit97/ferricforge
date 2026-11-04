import React, { useEffect, useRef } from 'react';
import { CheckCircle2, X, Play, Sparkles, ExternalLink } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ClippyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunClippy: () => void;
}

export const ClippyModal: React.FC<ClippyModalProps> = ({
  isOpen,
  onClose,
  onRunClippy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  const clippyCategories = [
    {
      group: 'Style & Idioms',
      lint: 'clippy::bool_comparison',
      example: 'if x == true { ... } => if x { ... }',
      why: 'Direct boolean expressions are cleaner and idiomatic.',
    },
    {
      group: 'Complexity',
      lint: 'clippy::needless_range_loop',
      example: 'for i in 0..vec.len() { vec[i] } => for item in &vec { item }',
      why: 'Direct iteration avoids indexing bounds checks and is zero-cost.',
    },
    {
      group: 'Performance',
      lint: 'clippy::clone_on_copy',
      example: 'let y = x.clone(); where x: i32 => let y = x;',
      why: 'Copy types implement bitwise copying; explicit .clone() adds visual noise.',
    },
    {
      group: 'Correctness',
      lint: 'clippy::almost_swapped',
      example: 'a = b; b = a; => std::mem::swap(&mut a, &mut b);',
      why: 'Detects accidental overwrite bugs where developer forgot temporary variable.',
    },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden select-none theme-panel" ref={modalRef}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Clippy Lints Guide</h3>
              <p className="text-xs text-neutral-400">Rust's official linter with 700+ code quality rules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Clippy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs select-text">
          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-neutral-200">Run Clippy on Current Code</h4>
              <p className="text-neutral-400 text-xs mt-0.5">
                Catch common mistakes, anti-patterns, and performance pitfalls instantly.
              </p>
            </div>
            <button
              onClick={() => {
                onRunClippy();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium text-xs transition-colors cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Clippy Now</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Common Clippy Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {clippyCategories.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                      {c.group}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      {c.lint}
                    </span>
                  </div>
                  <pre className="p-1.5 bg-black/60 rounded font-mono text-[10.5px] text-neutral-300 overflow-x-auto whitespace-pre">
                    {c.example}
                  </pre>
                  <p className="text-[11px] text-neutral-400">{c.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
