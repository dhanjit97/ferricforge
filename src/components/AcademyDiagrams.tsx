import React from 'react';
import { ArrowRight, Edit2, EyeOff, X } from 'lucide-react';

/* ============================================================================
   SHARED DIAGRAM STYLES
   Matches the clean technical diagram style: grid background, bordered boxes,
   highlighted cells, arrows, monospace labels.
   ============================================================================ */

const DIAGRAM_BG = 'bg-[url("data:image/svg+xml,%3Csvg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M24 0v24H0V0z\" fill=\"none\" stroke=\"%23374151\" stroke-width=\"1\" vector-effect=\"non-scaling-stroke\" /%3E%3C/svg%3E")]';
const BOX_BORDER = 'border border-neutral-700/60';
const BOX_BG = 'bg-neutral-900/50';
const BOX_TEXT = 'text-neutral-300';
const HIGHLIGHT_BG = 'bg-[#DE3804]/20 border-[#DE3804]/50';
const HIGHLIGHT_TEXT = 'text-[#DE3804]';
const OK_BG = 'bg-emerald-500/20 border-emerald-500/50';
const OK_TEXT = 'text-emerald-400';
const WARN_BG = 'bg-amber-500/20 border-amber-500/50';
const WARN_TEXT = 'text-amber-400';

/* ------------------------------------------------------------------ */
/*  Small labeled box used inside diagrams                            */
/* ------------------------------------------------------------------ */
interface DiagramCellProps {
  label?: string;
  value?: string | number;
  className?: string;
  highlight?: 'accent' | 'ok' | 'warn' | 'none';
}

export const DiagramCell: React.FC<DiagramCellProps> = ({
  label,
  value,
  className = '',
  highlight = 'none',
}) => {
  const hl: Record<string, string> = {
    accent: `${HIGHLIGHT_BG} ${HIGHLIGHT_TEXT}`,
    ok: `${OK_BG} ${OK_TEXT}`,
    warn: `${WARN_BG} ${WARN_TEXT}`,
    none: '',
  };
  const hlClasses = hl[highlight] || '';

  const base = `relative flex flex-col items-center justify-center px-3 py-2 ${BOX_BORDER} ${BOX_BG} ${BOX_TEXT} text-[10px] font-mono min-w-[80px] ${className} ${hlClasses} animate-fade-in`;

  return (
    <div className={base}>
      {label && (
        <span className="mb-0.5 text-[9px] opacity-70 uppercase tracking-wider">{label}</span>
      )}
      {value && <span className="font-semibold text-neutral-100">{String(value)}</span>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Arrow connector between two diagram elements                      */
/* ------------------------------------------------------------------ */
interface ArrowProps {
  from: 'top' | 'bottom' | 'left' | 'right';
  to: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
  className?: string;
}

export const DiagramArrow: React.FC<ArrowProps> = ({ label, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center h-6 ${className}`}>
      <ArrowRight className="w-3 h-3 text-neutral-500 shrink-0" />
      {label && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-neutral-500 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Diagram wrapper with grid background                              */
/* ------------------------------------------------------------------ */
interface DiagramWrapperProps {
  title?: string;
  children: React.ReactNode;
}

export const DiagramWrapper: React.FC<DiagramWrapperProps> = ({ title, children }) => {
  return (
    <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 mb-4">
      {title && (
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {title}
          </span>
        </div>
      )}
      <div className={`relative ${DIAGRAM_BG} rounded-lg p-3 border border-neutral-700/40`}>
        {children}
      </div>
    </div>
  );
};

/* ============================================================================
   VARIABLE DIAGRAM — "Labeled Storage Box" metaphor
   Shows memory cells and a variable pointing to one cell with label+value
   ============================================================================ */

interface VariableDiagramProps {
  variableName: string;
  variableValue: string | number;
  address?: string;
  isMutable?: boolean;
}

export const VariableDiagram: React.FC<VariableDiagramProps> = ({
  variableName,
  variableValue,
  address = '0x1001',
  isMutable = false,
}) => {
  return (
    <DiagramWrapper title="Variable as a Labeled Storage Box">
      <div className="flex flex-col items-center gap-4">
        {/* Memory bank: row of cells */}
        <div className="flex items-end gap-1 mb-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <DiagramCell
              key={i}
              label={`cell ${i}`}
              value={i === 2 ? variableValue : '—'}
              highlight={i === 2 ? 'accent' : 'none'}
              className="h-12 w-14 flex-col"
            />
          ))}
        </div>

        {/* Arrow from variable to memory cell */}
        <DiagramArrow from="bottom" to="top" label="points to" />

        {/* Variable box */}
        <div className="flex items-center gap-3">
          <DiagramCell
            label="variable"
            value={variableName}
            highlight="accent"
            className="w-24"
          />
          <DiagramCell
            label="address"
            value={address}
            highlight="none"
            className="w-20"
          />
          {isMutable && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono">
              <Edit2 className="w-3 h-3" /> `mut` — can change value
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[9px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-[#DE3804]/30 border border-[#DE3804]/50" />
            assigned cell
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-neutral-700/50 border border-neutral-700/50" />
            empty cell
          </span>
        </div>
      </div>
    </DiagramWrapper>
  );
};

/* ============================================================================
   IMMUTABLE vs MUTABLE DIAGRAM
   Side-by-side comparison: stone monument vs dry-erase board
   ============================================================================ */

interface MutableVsImmutableProps {}

export const MutableVsImmutableDiagram: React.FC<MutableVsImmutableProps> = () => {
  return (
    <DiagramWrapper title="Immutable vs Mutable Variables">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Immutable side */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-rose-400 mb-1">
            IMMUTABLE — `let score = 100;`
          </div>
          <div className={`${BOX_BORDER} ${BOX_BG} p-3 rounded-lg flex flex-col items-center gap-2 min-w-[180px]`}>
            <DiagramCell label="kind" value="immutable" highlight="none" className="w-full" />
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 text-[9px] font-mono">
              <X className="w-3 h-3" />
              value locked in stone
            </div>
            <DiagramCell label="value" value="100" highlight="warn" className="w-full animate-pulse" />
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-rose-950/20 border border-rose-900/40 text-rose-400 text-[9px] font-mono">
              <EyeOff className="w-3 h-3" />
              `score = 110;` → compile error
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 text-center leading-relaxed max-w-xs">
            Once written, the box is sealed. Cannot be overwritten.
          </p>
        </div>

        {/* Mutable side */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            MUTABLE — `let mut lives = 3;`
          </div>
          <div className={`${BOX_BORDER} ${BOX_BG} p-3 rounded-lg flex flex-col items-center gap-2 min-w-[180px]`}>
            <DiagramCell label="kind" value="mutable" highlight="ok" className="w-full" />
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-[9px] font-mono">
              <Edit2 className="w-3 h-3" />
              `mut` sticker on the box
            </div>
            <DiagramCell label="value" value="3" highlight="ok" className="w-full" />
            <DiagramArrow from="bottom" to="top" label="can change" />
            <DiagramCell label="new value" value="2" highlight="ok" className="w-full" />
          </div>
          <p className="text-[10px] text-neutral-500 text-center leading-relaxed max-w-xs">
            With `mut`, you can erase and rewrite the value.
          </p>
        </div>
      </div>
    </DiagramWrapper>
  );
};

/* ============================================================================
   MEMORY LAYOUT DIAGRAM — Stack vs Heap
   Shows where different types live in memory
   ============================================================================ */

interface MemoryLayoutProps {}

export const MemoryLayoutDiagram: React.FC<MemoryLayoutProps> = () => {
  return (
    <DiagramWrapper title="Memory Layout — Stack vs Heap">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Stack */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-sky-400 mb-1">STACK</div>
          <div className="flex flex-col gap-1 w-full max-w-xs">
            <DiagramCell label="i32 score" value="100" highlight="none" className="w-full h-8" />
            <DiagramCell label="bool flag" value="true" highlight="none" className="w-full h-8" />
            <DiagramCell label="f64 ratio" value="0.75" highlight="none" className="w-full h-8" />
            <DiagramCell label="(top)" value="—" highlight="none" className="w-full h-8 opacity-50" />
          </div>
          <p className="text-[9px] text-neutral-500 text-center">
            Fixed-size values, LIFO order
          </p>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex items-center text-neutral-500 text-[9px]">
          ← values copied when moved →
        </div>

        {/* Heap */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-xs font-semibold text-emerald-400 mb-1">HEAP</div>
          <div className="relative w-full max-w-xs">
            <div className="absolute -top-6 left-0 text-[9px] text-neutral-500">
              String::from("hello")
            </div>
            <div className={`${BOX_BORDER} ${BOX_BG} p-3 rounded-lg flex flex-col items-center gap-2`}>
              <DiagramCell label="ptr" value="0x2004" highlight="accent" className="w-full h-8" />
              <DiagramCell label="len" value="5" highlight="none" className="w-full h-8" />
              <DiagramCell label="cap" value="5" highlight="none" className="w-full h-8" />
            </div>
            <DiagramArrow from="top" to="bottom" label="owns" />
            <div className={`${BOX_BORDER} ${BOX_BG} p-2 rounded-lg flex items-center justify-center gap-2 text-emerald-300 text-[9px] font-mono`}>
              "hello" stored here
            </div>
          </div>
          <p className="text-[9px] text-neutral-500 text-center">
            Growable, dynamically allocated
          </p>
        </div>
      </div>
    </DiagramWrapper>
  );
};

/* ============================================================================
   OWNERSHIP MOVE DIAGRAM
   Shows what happens when a value is moved to another variable
   ============================================================================ */

interface OwnershipMoveProps {}

export const OwnershipMoveDiagram: React.FC<OwnershipMoveProps> = () => {
  return (
    <DiagramWrapper title="Ownership Move — `let s2 = s1;`">
      <div className="flex flex-col gap-4">
        {/* Before */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] text-neutral-500">Before move</span>
          <div className="flex items-center gap-2">
            <DiagramCell label="s1" value="String" highlight="accent" className="w-20" />
            <DiagramArrow from="right" to="left" label="owns" />
            <div className={`${BOX_BORDER} ${BOX_BG} p-2 rounded flex items-center gap-2 text-emerald-300 text-[9px] font-mono`}>
              "hello" on heap
            </div>
          </div>
        </div>

        {/* Arrow */}
        <DiagramArrow from="bottom" to="top" label="move" />

        {/* After */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] text-neutral-500">After move</span>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1 opacity-50">
              <DiagramCell label="s1" value="moved" highlight="warn" className="w-20" />
              <p className="text-[9px] text-rose-400">invalid — can't use</p>
            </div>
            <div className="flex items-center gap-2">
              <DiagramCell label="s2" value="String" highlight="ok" className="w-20" />
              <DiagramArrow from="right" to="left" label="owns" />
              <div className={`${BOX_BORDER} ${BOX_BG} p-2 rounded flex items-center gap-2 text-emerald-300 text-[9px] font-mono`}>
                "hello" on heap
              </div>
            </div>
          </div>
        </div>
      </div>
    </DiagramWrapper>
  );
};
