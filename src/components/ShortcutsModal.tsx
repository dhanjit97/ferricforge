import React, { useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
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

  const shortcuts = [
    { key: 'Ctrl + Enter / ⌘ + Enter', action: 'Run / Execute Code' },
    { key: 'Ctrl + S / ⌘ + S', action: 'Format Code with rustfmt' },
    { key: 'Tab', action: 'Indent 4 spaces' },
    { key: 'Shift + Tab', action: 'Dedent 4 spaces' },
    { key: '{ [ ( "', action: 'Auto-close matching brackets and quotes' },
    { key: 'Click Gutter Error Dot', action: 'Select line & open diagnostics details' },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden select-none theme-panel" ref={modalRef}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#DE3804]" />
            <h3 className="text-sm font-bold text-neutral-100">Playground Keybindings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Keybindings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 divide-y divide-neutral-800/80 text-xs">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5">
              <span className="text-neutral-300">{s.action}</span>
              <kbd className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded font-mono text-[11px] text-amber-400 shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
