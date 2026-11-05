/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  AlertCircle,
  Layers,
  Cpu,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TerminalOutput } from './TerminalOutput';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { TypeMemoryExplorer } from './TypeMemoryExplorer';
import { AssemblyViewer } from './AssemblyViewer';
import { ParsedDiagnostic } from '../types/rust';

interface InspectorPanelProps {
  stdout: string;
  stderr: string;
  isRunning: boolean;
  durationMs?: number;
  exitDetail?: string;
  onClearTerminal: () => void;
  diagnostics: ParsedDiagnostic[];
  onSelectDiagnostic: (diag: ParsedDiagnostic) => void;
  onApplyFix?: (diag: ParsedDiagnostic) => void;
  code: string;
  edition: string;
  onJumpToErrorLine?: (line: number) => void;
  className?: string;
}

export type InspectorTab = 'terminal' | 'diagnostics' | 'memory' | 'asm';

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  stdout,
  stderr,
  isRunning,
  durationMs,
  exitDetail,
  onClearTerminal,
  diagnostics,
  onSelectDiagnostic,
  onApplyFix,
  code,
  edition,
  onJumpToErrorLine,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('terminal');

  // Listen for custom tab switch events (e.g. from Inspect ASM in TopBar)
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const custom = e as CustomEvent<InspectorTab>;
      if (custom.detail) {
        setActiveTab(custom.detail);
      }
    };
    window.addEventListener('switch-inspector-tab', handleSwitch);
    return () => window.removeEventListener('switch-inspector-tab', handleSwitch);
  }, []);

  // When diagnostics arrive with errors, switch to diagnostics if output is currently empty
  useEffect(() => {
    if (diagnostics.some((d) => d.type === 'error') && !stdout) {
      setActiveTab('diagnostics');
    }
  }, [diagnostics, stdout]);

  const errorCount = diagnostics.filter((d) => d.type === 'error').length;
  const warningCount = diagnostics.filter((d) => d.type === 'warning').length;

  const handleSelectDiag = (diag: ParsedDiagnostic) => {
    onSelectDiagnostic(diag);
    if (diag.line && onJumpToErrorLine) {
      onJumpToErrorLine(diag.line);
    }
  };

  return (
    <aside
      className={`w-full lg:w-[380px] xl:w-[440px] shrink-0 h-full flex flex-col bg-[#101520] border-t lg:border-t-0 lg:border-l border-white/[0.08] select-none z-20 min-w-0 ${className}`}
    >
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0d14]/70 px-1 pt-1 shrink-0 font-mono text-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {/* Terminal Tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold transition-all border-b-2 ${
              activeTab === 'terminal'
                ? 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/5'
                : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
            }`}
          >
            <TerminalIcon size={13} />
            <span>Output</span>
          </button>

          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold transition-all border-b-2 ${
              activeTab === 'diagnostics'
                ? 'text-[#ff5400] border-[#ff5400] bg-[#ff5400]/5'
                : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
            }`}
          >
            <AlertCircle size={13} />
            <span>Diagnostics</span>
            {errorCount > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-[#f43f5e] text-white font-bold">
                {errorCount}
              </span>
            )}
            {errorCount === 0 && warningCount > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-[#ff9e00] text-black font-bold">
                {warningCount}
              </span>
            )}
          </button>

          {/* Memory Visualizer Tab */}
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold transition-all border-b-2 ${
              activeTab === 'memory'
                ? 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/5'
                : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
            }`}
          >
            <Layers size={13} />
            <span>Memory</span>
          </button>

          {/* ASM Tab */}
          <button
            onClick={() => setActiveTab('asm')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold transition-all border-b-2 ${
              activeTab === 'asm'
                ? 'text-[#ffb868] border-[#ffb868] bg-[#ffb868]/5'
                : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
            }`}
          >
            <Cpu size={13} />
            <span>ASM</span>
          </button>
        </div>
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {activeTab === 'terminal' && (
          <TerminalOutput
            stdout={stdout}
            stderr={stderr}
            isRunning={isRunning}
            durationMs={durationMs}
            exitDetail={exitDetail}
            onClear={onClearTerminal}
            onJumpToErrorLine={onJumpToErrorLine}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsPanel
            diagnostics={diagnostics}
            onSelectDiagnostic={handleSelectDiag}
            onApplyFix={onApplyFix}
            code={code}
          />
        )}

        {activeTab === 'memory' && <TypeMemoryExplorer code={code} />}

        {activeTab === 'asm' && <AssemblyViewer code={code} edition={edition} />}
      </div>
    </aside>
  );
};
