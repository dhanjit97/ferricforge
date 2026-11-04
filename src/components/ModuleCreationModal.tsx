import React, { useState, useEffect, useRef } from 'react';
import { FilePlus2, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ModuleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateModule: (modName: string, declareInMain: boolean) => void;
}

export const ModuleCreationModal: React.FC<ModuleCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateModule,
}) => {
  const [newModName, setNewModName] = useState('');
  const [autoDeclareInMain, setAutoDeclareInMain] = useState(true);
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

  const submitCreateModule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newModName.trim().replace(/\.rs$/, '');
    if (!cleanName) return;

    onCreateModule(cleanName, autoDeclareInMain);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#16161a] border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden theme-panel" ref={modalRef}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#121215]">
          <div className="flex items-center gap-2">
            <FilePlus2 className="w-4 h-4 text-[#DE3804]" />
            <h3 className="text-xs font-bold text-neutral-100">Create New Rust Module</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white cursor-pointer"
            aria-label="Close Module Creator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submitCreateModule} className="p-4 space-y-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Module Name</label>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 font-mono text-xs">src/</span>
              <input
                type="text"
                autoFocus
                placeholder="e.g. math, models, utils"
                value={newModName}
                onChange={(e) =>
                  setNewModName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
              />
              <span className="text-neutral-500 font-mono text-xs">.rs</span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={autoDeclareInMain}
              onChange={(e) => setAutoDeclareInMain(e.target.checked)}
              className="rounded border-neutral-700 text-[#DE3804] focus:ring-[#DE3804]"
            />
            <span className="text-neutral-300 text-xs">
              Declare in <code className="font-mono text-neutral-200">src/main.rs</code> (
              <code className="font-mono text-[#DE3804]">mod {newModName || '...'}</code>;)
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newModName.trim()}
              className="px-3.5 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white font-medium rounded transition-colors cursor-pointer disabled:opacity-40"
            >
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
