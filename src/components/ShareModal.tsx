/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Share2, Copy, Check, Download, Link2 } from 'lucide-react';
import { WorkspaceFile } from '../types/rust';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: WorkspaceFile[];
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, files }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const mainFile = files.find((f) => f.path === 'src/main.rs') || files[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mainFile?.content || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([mainFile?.content || ''], { type: 'text/rust' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mainFile?.name || 'main.rs';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#101520] border border-white/[0.12] rounded-lg shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-[#e1e2ec]">
            <Share2 size={18} className="text-[#00f0ff]" />
            <h3 className="font-bold text-sm">Share or Export Workspace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-white/[0.08]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {/* Share Link */}
          <div className="p-3 rounded bg-[#161d2d] border border-white/[0.06] space-y-2">
            <span className="text-[11px] text-[#94a3b8] block">Share Current Workbench Session</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="flex-1 bg-[#0a0d14] border border-white/[0.1] rounded px-2.5 py-1.5 text-[11px] text-[#e1e2ec] outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff] hover:text-black font-bold transition-all shrink-0"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 p-2.5 rounded bg-[#161d2d] border border-white/[0.08] hover:border-white/[0.2] text-[#e1e2ec] flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
              <span>Copy Source</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 p-2.5 rounded bg-[#ff5400] hover:bg-[#ff6d00] text-white flex items-center justify-center gap-1.5 font-bold shadow-[0_0_12px_rgba(255,84,0,0.3)] transition-all"
            >
              <Download size={14} />
              <span>Download .rs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
