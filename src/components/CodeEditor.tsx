/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  FileCode,
  FileText,
  X,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WorkspaceFile, ParsedDiagnostic } from '../types/rust';
import { tokenizeRustLine } from '../utils/rustHighlighter';
import { analyzeRustCode, InlayHint } from '../services/rustAnalyzerService';

interface CodeEditorProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onCodeChange: (newContent: string) => void;
  diagnostics: ParsedDiagnostic[];
  onApplyFix?: (diag: ParsedDiagnostic) => void;
  edition: string;
  jumpToLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCloseFile,
  onCodeChange,
  diagnostics,
  onApplyFix,
  edition,
  jumpToLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [flashLine, setFlashLine] = useState<number | null>(null);

  const currentFile = useMemo(
    () => files.find((f) => f.path === activeFilePath) || files[0],
    [files, activeFilePath]
  );

  const code = currentFile?.content || '';
  const lines = useMemo(() => code.split('\n'), [code]);

  // Run local rust analyzer for real-time in-editor inlay hints & quick checks
  const { inlayHints } = useMemo(() => {
    if (!currentFile || !currentFile.path.endsWith('.rs')) {
      return { inlayHints: [] as InlayHint[] };
    }
    return analyzeRustCode(code, currentFile.path);
  }, [code, currentFile]);

  // Combine remote rustc diagnostics with local hints
  const fileDiagnostics = useMemo(() => {
    return diagnostics.filter(
      (d) => !d.file || d.file === activeFilePath || d.file.endsWith(currentFile?.name || '')
    );
  }, [diagnostics, activeFilePath, currentFile]);

  // Jump to line effect when diagnostic or symbol is clicked
  useEffect(() => {
    if (jumpToLine && jumpToLine > 0 && textareaRef.current) {
      const targetScroll = Math.max(0, (jumpToLine - 5) * 21);
      textareaRef.current.scrollTop = targetScroll;
      if (highlightRef.current) highlightRef.current.scrollTop = targetScroll;
      if (gutterRef.current) gutterRef.current.scrollTop = targetScroll;

      // Find character index of target line
      const lineArray = code.split('\n');
      let charOffset = 0;
      for (let i = 0; i < Math.min(jumpToLine - 1, lineArray.length); i++) {
        charOffset += lineArray[i].length + 1;
      }

      textareaRef.current.selectionStart = charOffset;
      textareaRef.current.selectionEnd = charOffset + (lineArray[jumpToLine - 1]?.length || 0);
      textareaRef.current.focus();

      setFlashLine(jumpToLine);
      const timer = setTimeout(() => setFlashLine(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [jumpToLine, code]);

  // Synchronize scrolling between textarea, highlight layer, and gutter
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleCursorUpdate = () => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const textBefore = code.slice(0, selStart);
    const lineNum = textBefore.split('\n').length;
    const colNum = selStart - textBefore.lastIndexOf('\n');
    setCursorPos({ line: lineNum, col: colNum });
  };

  // Support Tab key indentation (4 spaces per Rust standard)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onCodeChange(newCode);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Common typography and box sizing styles for 100% pixel-perfect caret and glyph alignment
  const editorStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    lineHeight: '21px',
    letterSpacing: '0px',
    wordSpacing: '0px',
    fontVariantLigatures: 'none',
    tabSize: 4,
    whiteSpace: 'pre',
    padding: '12px',
    margin: 0,
    boxSizing: 'border-box',
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none relative">
      {/* 1. Multi-File Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101520] h-10 px-2 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 overflow-x-auto min-w-0">
          {files.map((file) => {
            const isActive = file.path === activeFilePath;
            const isMain = file.path === 'src/main.rs';
            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-mono cursor-pointer transition-all border-t-2 shrink-0 ${
                  isActive
                    ? 'border-[#ff5400] bg-[#0a0d14] text-[#e1e2ec] font-semibold shadow-sm'
                    : 'border-transparent bg-transparent text-[#94a3b8] hover:text-[#e1e2ec] hover:bg-[#161d2d]/60'
                }`}
              >
                {file.path.endsWith('.rs') ? (
                  <FileCode size={13} className={isActive ? 'text-[#ff5400]' : 'text-[#ff7a29]/70'} />
                ) : (
                  <FileText size={13} className="text-[#00f0ff]" />
                )}
                <span className="truncate max-w-[120px]">{file.name}</span>

                {!isMain && files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.path);
                    }}
                    className="p-0.5 rounded text-[#94a3b8] hover:text-[#f43f5e] hover:bg-white/[0.08] opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Close tab"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Breadcrumb Path */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[#94a3b8]/70 px-2 shrink-0">
          <span className="truncate max-w-[180px]">workspace &gt; {activeFilePath}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161d2d] text-[#00f0ff] border border-white/[0.06] shrink-0">
            Rust {edition}
          </span>
        </div>
      </div>

      {/* 2. Main Editor Workspace (Gutter + Highlight View + Textarea) */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden font-mono text-[13px] leading-[21px]">
        {/* Line Numbers & Diagnostic Gutter */}
        <div
          ref={gutterRef}
          className="w-12 shrink-0 py-3 bg-[#0a0d14] border-r border-white/[0.06] select-none text-right pr-2 text-[#94a3b8]/40 overflow-hidden font-mono text-[12px]"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasError = fileDiagnostics.some((d) => d.line === lineNum && d.type === 'error');
            const hasWarning = fileDiagnostics.some((d) => d.line === lineNum && d.type === 'warning');
            const isCurrent = cursorPos.line === lineNum;
            const isFlashing = flashLine === lineNum;

            return (
              <div
                key={lineNum}
                className={`relative h-[21px] flex items-center justify-end gap-1 ${
                  isCurrent ? 'text-[#e1e2ec] font-bold' : ''
                } ${isFlashing ? 'text-[#ff5400] font-black' : ''}`}
              >
                {hasError && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] shadow-[0_0_6px_#f43f5e] shrink-0"
                    title="Compiler Error"
                  />
                )}
                {hasWarning && !hasError && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff9e00] shrink-0" title="Compiler Warning" />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area & Syntax Overlay Container */}
        <div className="relative flex-1 min-w-0 h-full overflow-hidden">
          {/* Syntax Highlighted Render Layer */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            style={editorStyle}
            className="absolute inset-0 pointer-events-none overflow-hidden text-[#e1e2ec] z-0 select-none"
          >
            {lines.map((rawLine, idx) => {
              const lineNum = idx + 1;
              const isCurrentLine = cursorPos.line === lineNum;
              const isFlashing = flashLine === lineNum;
              const lineDiag = fileDiagnostics.find((d) => d.line === lineNum);
              const hintsForLine = inlayHints.filter((h: InlayHint) => h.line === lineNum);

              let lineBgClass = '';
              if (isFlashing) lineBgClass = 'bg-[#ff5400]/25';
              else if (isCurrentLine) lineBgClass = 'bg-white/[0.025]';

              return (
                <div
                  key={idx}
                  className={`h-[21px] whitespace-pre min-w-max ${lineBgClass} -mx-3 px-3`}
                >
                  {rawLine ? (
                    currentFile?.path.endsWith('.rs') ? (
                      tokenizeRustLine(rawLine).map((token, tIdx) => {
                        let colorClass = 'text-[#e1e2ec]';
                        if (token.type === 'keyword') colorClass = 'text-[#ff5400] font-semibold';
                        else if (token.type === 'type') colorClass = 'text-[#00f0ff]';
                        else if (token.type === 'macro') colorClass = 'text-[#ffb868]';
                        else if (token.type === 'string') colorClass = 'text-[#10b981]';
                        else if (token.type === 'comment') colorClass = 'text-[#64748b] italic';
                        else if (token.type === 'number') colorClass = 'text-[#f43f5e]';
                        else if (token.type === 'operator') colorClass = 'text-[#d3fbff]';
                        else if (token.type === 'lifetime') colorClass = 'text-[#ffb59c] font-medium';

                        return (
                          <span key={tIdx} className={colorClass}>
                            {token.text}
                          </span>
                        );
                      })
                    ) : (
                      <span>{rawLine}</span>
                    )
                  ) : (
                    <span>{'\u00A0'}</span>
                  )}

                  {/* Non-intrusive Inlay Hints at end of line */}
                  {hintsForLine.map((hint: InlayHint, hIdx: number) => (
                    <span
                      key={hIdx}
                      className="inline-block ml-3 px-1 py-0 rounded text-[10px] leading-tight bg-[#161d2d] text-[#00f0ff]/70 border border-[#00f0ff]/20 font-mono select-none"
                    >
                      {hint.label}
                    </span>
                  ))}

                  {/* Inline Error Badge at end of line */}
                  {lineDiag && (
                    <span className="inline-flex items-center gap-1 ml-4 px-1.5 py-0 rounded text-[10px] bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30 font-mono">
                      <AlertCircle size={10} />
                      <span>{lineDiag.errorCode || 'error'}: {lineDiag.message.slice(0, 50)}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Textarea (User Input) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onScroll={handleScroll}
            onSelect={handleCursorUpdate}
            onClick={handleCursorUpdate}
            onKeyUp={handleCursorUpdate}
            onKeyDown={handleKeyDown}
            style={editorStyle}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 bg-transparent text-transparent caret-[#00f0ff] resize-none outline-none overflow-auto z-10 selection:bg-[#ff5400]/30 selection:text-transparent"
          />
        </div>
      </div>

      {/* 3. Bottom Editor Telemetry Strip */}
      <div className="h-6 px-3 border-t border-white/[0.08] bg-[#0a0d14] flex items-center justify-between font-mono text-[11px] text-[#94a3b8] select-none shrink-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="text-[#e1e2ec]">rustc 1.85.0</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span>Ln {cursorPos.line},</span>
            <span>Col {cursorPos.col}</span>
          </div>

          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="hidden sm:inline truncate">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {fileDiagnostics.length > 0 ? (
            <div className="flex items-center gap-1 text-[#f43f5e]">
              <AlertCircle size={12} />
              <span>{fileDiagnostics.length} diagnostics</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#10b981]">
              <CheckCircle2 size={12} />
              <span className="text-[10px] hidden sm:inline">Zero Borrow Violations</span>
            </div>
          )}

          <span className="text-neutral-600">|</span>
          <span className="text-[#ff5400] font-semibold truncate max-w-[100px]">{currentFile?.name}</span>
        </div>
      </div>
    </div>
  );
};
