import React, { useRef, useEffect, useState } from 'react';
import { tokenizeRustLine } from '../utils/rustHighlighter';
import { WorkspaceFile, ParsedDiagnostic } from '../types/rust';
import {
  getModuleNameFromPath,
  hasModDeclaration,
  isValidModuleName,
} from '../utils/workspaceBundler';
import {
  analyzeRustCode,
  AnalyzerDiagnostic,
  InlayHint,
} from '../services/rustAnalyzerService';
import { ModuleCreationModal } from './ModuleCreationModal';
import {
  Copy,
  Check,
  FileCode,
  Package,
  Plus,
  Trash2,
  FolderTree,
  Folder,
  X,
  FilePlus2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Wand2,
} from 'lucide-react';

interface CodeEditorProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onChangeFileContent: (path: string, content: string) => void;
  onCreateModule: (modName: string, declareInMain: boolean) => void;
  onDeleteModule: (path: string) => void;
  onToggleModDeclaration: (modName: string) => void;
  diagnostics: ParsedDiagnostic[];
  selectedLine?: number | null;
  onSelectLine?: (line: number, file?: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onChangeFileContent,
  onCreateModule,
  onDeleteModule,
  onToggleModDeclaration,
  diagnostics,
  selectedLine,
  onSelectLine,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showFileTree, setShowFileTree] = useState(true);

  // Real-time background rust-analyzer states
  const [realtimeDiagnostics, setRealtimeDiagnostics] = useState<AnalyzerDiagnostic[]>([]);
  const [inlayHints, setInlayHints] = useState<InlayHint[]>([]);
  const [analyzerDuration, setAnalyzerDuration] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showInlayHints, setShowInlayHints] = useState<boolean>(true);
  const [hoveredDiagnostic, setHoveredDiagnostic] = useState<AnalyzerDiagnostic | null>(null);

  // New module modal
  const [isCreatingMod, setIsCreatingMod] = useState(false);

  // Active file object
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];
  const activeContent = activeFile?.content || '';
  const currentLines = activeContent.split('\n');

  const mainFile = files.find((f) => f.path === 'src/main.rs');
  const mainContent = mainFile?.content || '';

  const isModuleFile = activeFile.path.startsWith('src/') && activeFile.path !== 'src/main.rs';
  const currentModName = isModuleFile ? getModuleNameFromPath(activeFile.path) : '';
  const isDeclaredInMain = isModuleFile ? hasModDeclaration(mainContent, currentModName) : true;

  // Real-time Background Analysis Service (<150ms debounced)
  useEffect(() => {
    if (!activeFile.path.endsWith('.rs')) {
      setRealtimeDiagnostics([]);
      setInlayHints([]);
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const result = analyzeRustCode(activeContent, activeFile.path);
      setRealtimeDiagnostics(result.diagnostics);
      setInlayHints(result.inlayHints);
      setAnalyzerDuration(result.durationMs);
      setIsAnalyzing(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [activeContent, activeFile.path]);

  // Combined line diagnostics mapping (combining real-time analyzer + rustc compiler)
  const lineDiagnosticsMap = React.useMemo(() => {
    const map = new Map<number, { severity: 'error' | 'warning'; message: string; diag?: AnalyzerDiagnostic }>();

    // 1. First add real-time analyzer diagnostics
    realtimeDiagnostics.forEach((d) => {
      map.set(d.line, {
        severity: d.severity === 'error' ? 'error' : 'warning',
        message: d.message,
        diag: d,
      });
    });

    // 2. Also overlay rustc compiler diagnostics if present
    diagnostics
      .filter((d) => d.file === activeFile.path || (!d.file && activeFile.path === 'src/main.rs'))
      .forEach((d) => {
        if (!map.has(d.line) || d.type === 'error') {
          map.set(d.line, {
            severity: d.type === 'error' ? 'error' : 'warning',
            message: d.message,
          });
        }
      });

    return map;
  }, [realtimeDiagnostics, diagnostics, activeFile.path]);

  // Inlay hints grouped by line
  const inlayHintsByLine = React.useMemo(() => {
    const map = new Map<number, InlayHint[]>();
    if (!showInlayHints) return map;
    inlayHints.forEach((h) => {
      const list = map.get(h.line) || [];
      list.push(h);
      map.set(h.line, list);
    });
    return map;
  }, [inlayHints, showInlayHints]);

  // Jump to selected line
  useEffect(() => {
    if (selectedLine && textareaRef.current) {
      const lines = activeContent.split('\n');
      let charCount = 0;
      for (let i = 0; i < Math.min(selectedLine - 1, lines.length); i++) {
        charCount += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        charCount,
        charCount + (lines[selectedLine - 1]?.length || 0)
      );

      const lineHeight = 21;
      const targetScroll = Math.max(0, (selectedLine - 4) * lineHeight);
      textareaRef.current.scrollTop = targetScroll;
    }
  }, [selectedLine, activeFilePath]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (highlightOverlayRef.current) {
      highlightOverlayRef.current.scrollTop = target.scrollTop;
      highlightOverlayRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const before = activeContent.substring(0, start);
        const after = activeContent.substring(end);
        const currentLineStart = before.lastIndexOf('\n') + 1;
        const linePrefix = before.substring(currentLineStart);
        if (linePrefix.startsWith('    ')) {
          const newContent =
            before.substring(0, currentLineStart) + linePrefix.substring(4) + after;
          onChangeFileContent(activeFile.path, newContent);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(
              currentLineStart,
              start - 4
            );
          }, 0);
        }
      } else {
        const newContent =
          activeContent.substring(0, start) + '    ' + activeContent.substring(end);
        onChangeFileContent(activeFile.path, newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
      return;
    }

    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')',
      '"': '"',
    };

    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const newContent =
        activeContent.substring(0, start) + e.key + closeChar + activeContent.substring(end);
      onChangeFileContent(activeFile.path, newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = activeContent.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const applyQuickFix = (fix: NonNullable<AnalyzerDiagnostic['quickFix']>) => {
    const lines = activeContent.split('\n');
    lines[fix.line - 1] = fix.replacement;
    onChangeFileContent(activeFile.path, lines.join('\n'));
    setHoveredDiagnostic(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-neutral-200 border-r border-neutral-800 select-none">
      {/* File Tabs & Actions Strip */}
      <div className="flex items-center justify-between px-2 pt-2 border-b border-neutral-800 bg-[#121214] text-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {/* Toggle File Tree Button */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            title={showFileTree ? 'Hide File Tree' : 'Show File Tree'}
            className={`p-1.5 rounded transition-colors mr-1 cursor-pointer ${
              showFileTree
                ? 'bg-neutral-800 text-neutral-200'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>

          {/* Open Tabs */}
          {files.map((file) => {
            const isActive = file.path === activeFile.path;
            const isCargo = file.path === 'Cargo.toml';
            const isMain = file.path === 'src/main.rs';
            const fileDiags = diagnostics.filter((d) => d.file === file.path || (!d.file && isMain));
            const hasError = fileDiags.some((d) => d.type === 'error');
            const hasWarning = fileDiags.some((d) => d.type === 'warning');

            return (
              <div
                key={file.path}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t font-mono text-xs transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#18181b] text-neutral-100 border-t-2 border-t-[#DE3804]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
                onClick={() => onSelectFile(file.path)}
              >
                {isCargo ? (
                  <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <FileCode
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isMain ? 'text-[#DE3804]' : 'text-sky-400'
                    }`}
                  />
                )}
                <span>{file.name}</span>

                {(hasError || hasWarning) && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      hasError ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                  />
                )}

                {!isMain && !isCargo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete module ${file.name}?`)) {
                        onDeleteModule(file.path);
                      }
                    }}
                    title="Delete Module"
                    className="ml-1 text-neutral-500 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setIsCreatingMod(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-t text-xs transition-colors cursor-pointer shrink-0"
            title="Create new .rs module in src/"
          >
            <Plus className="w-3.5 h-3.5 text-[#DE3804]" />
            <span className="font-sans text-[11px] font-medium">+ New Module</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-1.5 pr-2 shrink-0">
          {/* Toggle Inlay Hints */}
          <button
            onClick={() => setShowInlayHints(!showInlayHints)}
            title={showInlayHints ? 'Disable Inlay Type Hints' : 'Enable Inlay Type Hints'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              showInlayHints
                ? 'bg-neutral-800 text-sky-400'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            <span>Hints</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1 px-2 py-0.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors text-[11px] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Undeclared Module Notice */}
      {isModuleFile && !isDeclaredInMain && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Module <code className="font-mono font-bold">{currentModName}</code> is not declared in <code className="font-mono">src/main.rs</code>.
            </span>
          </div>
          <button
            onClick={() => onToggleModDeclaration(currentModName)}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded text-[11px] transition-colors cursor-pointer"
          >
            Add `mod {currentModName};` to main.rs
          </button>
        </div>
      )}

      {/* Editor Body Split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Mini File Tree */}
        {showFileTree && (
          <div className="w-48 shrink-0 border-r border-neutral-800 bg-[#121214] p-2 flex flex-col justify-between text-xs select-none">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                <span>Workspace</span>
                <button
                  onClick={() => setIsCreatingMod(true)}
                  title="New Module"
                  className="hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div
                  onClick={() => onSelectFile('Cargo.toml')}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                    activeFile.path === 'Cargo.toml'
                      ? 'bg-neutral-800 text-amber-400 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cargo.toml</span>
                </div>

                <div className="pt-1">
                  <div className="flex items-center gap-1 text-neutral-500 px-2 py-0.5 text-[11px]">
                    <Folder className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-sans font-medium text-neutral-400">src/</span>
                  </div>

                  <div className="pl-3 space-y-0.5 mt-0.5">
                    {files
                      .filter((f) => f.path.startsWith('src/'))
                      .map((file) => {
                        const isMain = file.path === 'src/main.rs';
                        const isSelected = file.path === activeFile.path;
                        const modName = getModuleNameFromPath(file.path);
                        const declared = isMain || hasModDeclaration(mainContent, modName);

                        return (
                          <div
                            key={file.path}
                            onClick={() => onSelectFile(file.path)}
                            className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#DE3804]/20 text-[#DE3804] font-medium'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCode
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isMain ? 'text-[#DE3804]' : 'text-sky-400'
                                }`}
                              />
                              <span className="truncate">{file.name}</span>
                            </div>

                            {!isMain && (
                              <span
                                title={declared ? 'Declared in main.rs' : 'Undeclared'}
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  declared ? 'bg-emerald-500' : 'bg-amber-400'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCreatingMod(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 rounded font-sans text-xs transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-[#DE3804]" />
              <span>Add Module</span>
            </button>
          </div>
        )}

        {/* Editor Main */}
        <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] leading-[21px]">
          {/* Gutter */}
          <div
            ref={gutterRef}
            className="w-12 shrink-0 py-3 bg-[#0d1117] border-r border-neutral-800 text-neutral-500 text-right pr-2.5 select-none overflow-hidden tabular-nums font-mono text-xs"
          >
            {currentLines.map((_, idx) => {
              const lineNum = idx + 1;
              const lineDiag = lineDiagnosticsMap.get(lineNum);
              const isSelected = selectedLine === lineNum;

              return (
                <div
                  key={lineNum}
                  onClick={() => onSelectLine && onSelectLine(lineNum, activeFile.path)}
                  className={`relative h-[21px] flex items-center justify-end group cursor-pointer ${
                    isSelected ? 'text-neutral-200 font-bold' : ''
                  }`}
                >
                  {lineDiag && (
                    <span
                      onMouseEnter={() => lineDiag.diag && setHoveredDiagnostic(lineDiag.diag)}
                      title={`${lineDiag.severity.toUpperCase()}: ${lineDiag.message}`}
                      className={`absolute left-1.5 w-2 h-2 rounded-full cursor-help ${
                        lineDiag.severity === 'error' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                    />
                  )}
                  <span className="group-hover:text-neutral-300 transition-colors">{lineNum}</span>
                </div>
              );
            })}
          </div>

          {/* Code Container */}
          <div className="relative flex-1 h-full overflow-hidden">
            {/* Syntax Highlight & Squiggly Overlay */}
            <div
              ref={highlightOverlayRef}
              aria-hidden="true"
              className="absolute inset-0 p-3 overflow-hidden pointer-events-none whitespace-pre select-none"
            >
              {currentLines.map((line, idx) => {
                const lineNum = idx + 1;
                const lineDiag = lineDiagnosticsMap.get(lineNum);
                const isSelected = selectedLine === lineNum;
                const tokens =
                  activeFile.path === 'Cargo.toml'
                    ? [{ text: line, type: 'plain' as const }]
                    : tokenizeRustLine(line);

                const lineHints = inlayHintsByLine.get(lineNum) || [];

                return (
                  <div
                    key={lineNum}
                    className={`h-[21px] relative ${
                      isSelected ? 'bg-amber-500/10 -mx-3 px-3' : ''
                    }`}
                  >
                    {/* Render Syntax Tokens */}
                    {tokens.map((token, tIdx) => {
                      let colorClass = 'text-neutral-200';
                      if (token.type === 'keyword') colorClass = 'text-[#f472b6] font-medium';
                      else if (token.type === 'type') colorClass = 'text-[#38bdf8] font-medium';
                      else if (token.type === 'macro') colorClass = 'text-[#fb923c] font-medium';
                      else if (token.type === 'string') colorClass = 'text-[#4ade80]';
                      else if (token.type === 'comment') colorClass = 'text-[#71717a] italic';
                      else if (token.type === 'number') colorClass = 'text-[#a78bfa]';
                      else if (token.type === 'attribute') colorClass = 'text-[#facc15]';
                      else if (token.type === 'lifetime') colorClass = 'text-[#fbbf24] font-semibold';
                      else if (token.type === 'operator') colorClass = 'text-[#94a3b8]';
                      else if (token.type === 'punctuation') colorClass = 'text-[#cbd5e1]';

                      return (
                        <span key={tIdx} className={colorClass}>
                          {token.text}
                        </span>
                      );
                    })}

                    {/* Inlay Hints rendered inline at end of variable */}
                    {lineHints.map((hint, hIdx) => (
                      <span
                        key={hIdx}
                        className="ml-1 text-[11px] text-neutral-500 font-mono select-none px-1 py-0.2 rounded bg-neutral-800/60 border border-neutral-700/50"
                      >
                        {hint.label}
                      </span>
                    ))}

                    {/* Real-time Squiggly Line Error Indicator */}
                    {lineDiag && (
                      <span
                        className={`absolute bottom-0 left-0 right-0 h-[2px] pointer-events-auto cursor-help ${
                          lineDiag.severity === 'error'
                            ? 'bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:4px_2px]'
                            : 'bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:4px_2px]'
                        }`}
                        onMouseEnter={() => lineDiag.diag && setHoveredDiagnostic(lineDiag.diag)}
                      />
                    )}

                    {line.length === 0 && <span>&nbsp;</span>}
                  </div>
                );
              })}
            </div>

            {/* Editable Textarea */}
            <textarea
              ref={textareaRef}
              value={activeContent}
              onChange={(e) => onChangeFileContent(activeFile.path, e.target.value)}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorPosition}
              onClick={() => {
                updateCursorPosition();
                setHoveredDiagnostic(null);
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-white resize-none outline-none font-mono whitespace-pre overflow-auto"
              style={{
                tabSize: 4,
              }}
            />

            {/* Floating rust-analyzer Hover Tooltip */}
            {hoveredDiagnostic && (
              <div
                className="absolute right-4 top-4 z-40 max-w-md p-3.5 rounded-lg bg-[#16161a] border border-neutral-700 shadow-2xl text-xs space-y-2 select-text font-sans animate-fade-in"
              >
                <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {hoveredDiagnostic.severity === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="font-mono text-[11px] font-bold text-neutral-200">
                      rust-analyzer [{hoveredDiagnostic.code}]
                    </span>
                  </div>
                  <button
                    onClick={() => setHoveredDiagnostic(null)}
                    className="text-neutral-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-neutral-300 text-xs leading-relaxed">
                  {hoveredDiagnostic.message}
                </p>

                {hoveredDiagnostic.quickFix && (
                  <button
                    onClick={() => applyQuickFix(hoveredDiagnostic.quickFix!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded text-xs font-semibold transition-colors cursor-pointer w-full justify-center"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Quick Fix: {hoveredDiagnostic.quickFix.label}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status Bar with Real-Time Analyzer Indicator */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-neutral-800 bg-[#121214] text-[11px] text-neutral-400 tabular-nums">
        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-300 font-medium">{activeFile.path}</span>
          <span>·</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>·</span>
          <span>{currentLines.length} lines</span>
        </div>

        {/* Real-time rust-analyzer service badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-sans">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAnalyzing
                  ? 'bg-amber-400 animate-ping'
                  : realtimeDiagnostics.some((d) => d.severity === 'error')
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-neutral-300 font-mono text-[10px]">
              rust-analyzer:
            </span>
            {isAnalyzing ? (
              <span className="text-neutral-500 text-[10px]">analyzing...</span>
            ) : realtimeDiagnostics.length > 0 ? (
              <span className="text-amber-400 text-[10px] font-mono">
                {realtimeDiagnostics.filter((d) => d.severity === 'error').length} err,{' '}
                {realtimeDiagnostics.filter((d) => d.severity === 'warning').length} warn
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px]">Ready ({analyzerDuration}ms)</span>
            )}
          </div>

          <span className="text-neutral-600">|</span>
          <span className="text-neutral-500">
            {files.length} {files.length === 1 ? 'file' : 'files'} in workspace
          </span>
        </div>
      </div>

      {/* New Module Modal */}
      <ModuleCreationModal
        isOpen={isCreatingMod}
        onClose={() => setIsCreatingMod(false)}
        onCreateModule={onCreateModule}
      />
    </div>
  );
};
