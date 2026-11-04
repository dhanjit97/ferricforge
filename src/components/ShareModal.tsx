import React, { useState, useEffect, useRef } from 'react';
import { WorkspaceFile } from '../types/rust';
import { Share2, Copy, Check, Download, FileCode, X, Package, AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: WorkspaceFile[];
  edition: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  files,
  edition,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
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

  const mainFile = files.find((f) => f.path === 'src/main.rs') || files[0];
  const cargoTomlFile = files.find((f) => f.path === 'Cargo.toml');

  // Encode multi-file state in URL hash
  const filesPayload = encodeURIComponent(
    JSON.stringify(
      files.map((f) => ({
        p: f.path,
        c: f.content,
      }))
    )
  );

  const shareUrl = `${window.location.origin}${window.location.pathname}#workspace=${filesPayload}&edition=${edition}`;

  // Browsers typically cap URLs around 64–8 KB. Warn instead of silently
  // producing a link that won't load when opened.
  const urlTooLong = shareUrl.length > 60000;

  // Combined markdown of all files
  const markdownSnippet = files
    .map((f) => `// ================= file: ${f.path} =================\n\`\`\`rust\n${f.content}\n\`\`\``)
    .join('\n\n');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownSnippet);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadFile = (file: WorkspaceFile) => {
    const mime = file.path.endsWith('.toml') ? 'text/plain' : 'text/rust';
    const blob = new Blob([file.content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden select-none theme-panel" ref={modalRef}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#DE3804]" />
            <h3 className="text-sm font-bold text-neutral-100">Share & Export Multi-File Project</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Share"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Shareable Link */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-medium">
              Multi-File Workspace Permalink ({files.length} {files.length === 1 ? 'file' : 'files'})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 font-mono text-[11px] truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {urlTooLong && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="font-medium">
                  Link is very large ({Math.round(shareUrl.length / 1024)} KB) and may not open in some browsers.
                </span>
              </div>
            )}
          </div>

          {/* Copy as Markdown */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-medium">Export Workspace as Markdown</label>
            <button
              onClick={handleCopyMarkdown}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded transition-colors cursor-pointer font-medium"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">All Modules Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Copy All Files (main.rs, modules, Cargo.toml)</span>
                </>
              )}
            </button>
          </div>

          {/* Download options */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <label className="text-neutral-400 font-medium">Download Individual Project Files</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleDownloadFile(file)}
                  className="flex items-center justify-between p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 transition-colors cursor-pointer truncate"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {file.path.endsWith('.toml') ? (
                      <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-[#DE3804] shrink-0" />
                    )}
                    <span className="font-mono text-[11px] truncate">{file.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
