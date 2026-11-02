import React from 'react';
import { Sparkles, Check, Wand2, X, Award, Lightbulb } from 'lucide-react';
import { OptimizationResult, OptimizationItem } from '../types/rust';

interface OptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  optimizationData: OptimizationResult | null;
  onApplyRecommendedCode: (code: string) => void;
}

export const OptimizerModal: React.FC<OptimizerModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  optimizationData,
  onApplyRecommendedCode,
}) => {
  const [applied, setApplied] = React.useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    if (optimizationData?.recommendedCode) {
      onApplyRecommendedCode(optimizationData.recommendedCode);
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Rust Idioms & Zero-Cost Optimizer</h3>
              <p className="text-xs text-neutral-400">Analysis for heap allocations, .clone() overhead, and pattern idioms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs select-text">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-semibold text-neutral-200">Analyzing AST, lifetimes, and allocation patterns...</p>
              <p className="text-xs text-neutral-500">Checking for zero-cost abstractions and idiomatic Rust standards</p>
            </div>
          ) : optimizationData ? (
            <>
              {/* Score & Summary */}
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Idiomatic Review</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {optimizationData.summary}
                  </p>
                </div>

                {optimizationData.score && (
                  <div className="shrink-0 text-center px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 uppercase font-semibold block">Rust Grade</span>
                    <span className="text-2xl font-bold font-mono text-amber-300">{optimizationData.score}</span>
                  </div>
                )}
              </div>

              {/* Specific Optimizations */}
              {optimizationData.optimizations && optimizationData.optimizations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Recommended Improvements ({optimizationData.optimizations.length})
                  </h4>
                  {optimizationData.optimizations.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                      <div className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{item.explanation}</p>
                      {item.diffSnippet && (
                        <pre className="p-2 bg-black/60 border border-neutral-800 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
                          {item.diffSnippet}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Code preview */}
              {optimizationData.recommendedCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Refactored Code Preview
                    </h4>
                    <button
                      onClick={handleApply}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium text-xs transition-colors cursor-pointer"
                    >
                      {applied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Editor!</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply All Improvements</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-black/80 border border-neutral-800 rounded font-mono text-xs text-neutral-300 max-h-48 overflow-y-auto whitespace-pre">
                    {optimizationData.recommendedCode}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-neutral-500">No optimization data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
