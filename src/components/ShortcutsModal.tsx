/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Enter', desc: 'Compile & Execute Rust binary (Cargo Run)' },
    { key: 'Ctrl + Shift + B', desc: 'Inspect Assembly / Codegen IR' },
    { key: 'Ctrl + B', desc: 'Toggle Sidebar Workspace Explorer' },
    { key: 'Shift + Alt + F', desc: 'Format active buffer with rustfmt' },
    { key: 'Ctrl + Shift + C', desc: 'Run Cargo Clippy diagnostics' },
    { key: 'Tab', desc: 'Indent 4 spaces (Rust Standard)' },
    { key: 'Esc', desc: 'Close any active overlay or modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-[#e1e2ec]">
            <Keyboard size={18} className="text-[#00f0ff]" />
            <h3 className="font-bold text-sm">Keyboard Shortcuts &amp; Hotkeys</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.08]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded bg-[#161d2d] border border-white/[0.06] text-xs font-mono"
            >
              <span className="text-[#94a3b8]">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[#0a0d14] text-[#ff5400] border border-white/[0.1] font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
