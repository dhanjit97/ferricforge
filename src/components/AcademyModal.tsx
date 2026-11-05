/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Code2,
  FileCode,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Check,
  Layers,
  Cpu,
  Terminal,
} from 'lucide-react';
import {
  CURRICULUM_LESSONS,
  LEARNING_STAGES,
  CurriculumLesson,
  LearningStage,
  KnowledgeCheckQuestion,
} from '../utils/curriculumData';

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLessonId: string;
  onSelectLesson: (id: string) => void;
  completedLessonIds: Set<string>;
  onCompleteLesson: (id: string, xp: number) => void;
  onLoadCode: (code: string) => void;
  inline?: boolean;
}

export const AcademyModal: React.FC<AcademyModalProps> = ({
  isOpen,
  onClose,
  activeLessonId,
  onSelectLesson,
  completedLessonIds,
  onCompleteLesson,
  onLoadCode,
  inline = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<'walkthrough' | 'knowledgeCheck' | 'challenge'>('walkthrough');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const lesson = useMemo(
    () => CURRICULUM_LESSONS.find((l: CurriculumLesson) => l.id === activeLessonId) || CURRICULUM_LESSONS[0],
    [activeLessonId]
  );

  const currentIdx = CURRICULUM_LESSONS.findIndex((l: CurriculumLesson) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? CURRICULUM_LESSONS[currentIdx - 1] : null;
  const nextLesson = currentIdx < CURRICULUM_LESSONS.length - 1 ? CURRICULUM_LESSONS[currentIdx + 1] : null;

  const isCompleted = completedLessonIds.has(lesson.id);

  // Group lessons by stage for the left sidebar
  const lessonsByStage = useMemo(() => {
    const grouped: Record<number, CurriculumLesson[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    CURRICULUM_LESSONS.forEach((l) => {
      grouped[l.stage].push(l);
    });
    return grouped;
  }, []);

  const completedCount = completedLessonIds.size;
  const totalCount = CURRICULUM_LESSONS.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const stageTitle = LEARNING_STAGES[lesson.stage as LearningStage]?.title;

  if (!isOpen) return null;

  const handleOptionSelect = (qId: string, optIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setQuizSubmitted((prev) => ({ ...prev, [qId]: true }));
  };

  const handleMarkComplete = () => {
    onCompleteLesson(lesson.id, lesson.xpReward);
  };

  // Inline workspace layout (center + right columns only; left sidebar is provided by App)
  if (inline) {
    return (
      <div className="flex h-full w-full min-w-0 overflow-hidden">
        {/* Center: Lesson Content */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[#101520]">
          {/* Lesson Header */}
          <div className="px-6 py-4 border-b border-white/8 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase text-[#94a3b8] tracking-wider">
                Chapter {lesson.stage} / {stageTitle}
              </span>
              <span className="font-mono text-[10px] text-[#ffb868]">
                Lesson {currentIdx + 1} of {totalCount}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#e1e2ec] leading-tight mb-1">{lesson.title}</h1>
            <p className="text-sm text-[#94a3b8] leading-relaxed">{lesson.overview}</p>
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                ~ {lesson.estimatedMinutes} MIN
              </span>
              <span className="font-mono text-[10px] text-[#94a3b8]">Rust 2024 / 2021</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-b border-white/8 shrink-0 font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('walkthrough')}
                className={`px-3 py-2.5 font-semibold transition-all border-b-2 ${
                  selectedTab === 'walkthrough'
                    ? 'text-[#ff5400] border-[#ff5400]'
                    : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                }`}
              >
                Concept &amp; Walkthrough
              </button>
              <button
                onClick={() => setSelectedTab('knowledgeCheck')}
                className={`px-3 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                  selectedTab === 'knowledgeCheck'
                    ? 'text-[#00f0ff] border-[#00f0ff]'
                    : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                }`}
              >
                <HelpCircle size={13} />
                <span>Knowledge Check</span>
                {lesson.knowledgeCheck && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/8">
                    {lesson.knowledgeCheck.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedTab('challenge')}
                className={`px-3 py-2.5 font-semibold transition-all border-b-2 ${
                  selectedTab === 'challenge'
                    ? 'text-[#10b981] border-[#10b981]'
                    : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                }`}
              >
                Code Challenge
              </button>
            </div>

            <button
              onClick={() => {
                onLoadCode(lesson.walkthroughCode);
                onClose();
              }}
              className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#00f0ff] hover:text-white px-2.5 py-1 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 transition-all ml-auto"
            >
              <FileCode size={13} />
              <span>Load in Editor</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {selectedTab === 'walkthrough' && (
              <div className="space-y-6">
                {/* Overview Callout */}
                <div className="p-4 rounded-lg bg-[#161d2d] border border-white/8">
                  <h4 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">
                    Core Architectural Invariant
                  </h4>
                  <p className="text-sm text-[#e1e2ec] leading-relaxed">
                    {lesson.overview}
                  </p>
                </div>

                {/* Guide Narrative */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#ffb868] font-mono uppercase tracking-wider">
                    Deep Technical Breakdown
                  </h3>
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line font-sans">
                    {lesson.guideContent}
                  </div>
                </div>

                {/* Walkthrough Code Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#e1e2ec]">
                      Demonstration Code
                    </span>
                    <span className="font-mono text-[10px] text-[#94a3b8]">Rust 2024 / 2021</span>
                  </div>

                  <div className="p-4 rounded bg-[#0a0d14] border border-white/8 font-mono text-xs text-[#e1e2ec] overflow-x-auto whitespace-pre leading-relaxed">
                    {lesson.walkthroughCode}
                  </div>
                </div>

                {/* Line-by-Line Technical Annotations */}
                {lesson.walkthroughExplanations && lesson.walkthroughExplanations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
                      Line Annotations &amp; Memory Mechanics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lesson.walkthroughExplanations.map((exp: { lineRange: string; headline: string; explanation: string }, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded bg-[#161d2d] border border-white/6 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-[#ff5400]">
                              Lines {exp.lineRange}
                            </span>
                            <span className="text-[11px] font-bold text-[#e1e2ec]">
                              {exp.headline}
                            </span>
                          </div>
                          <p className="text-xs text-[#94a3b8] leading-relaxed">
                            {exp.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'knowledgeCheck' && (
              <div className="space-y-6">
                <div className="p-4 rounded bg-[#161d2d] border border-white/8">
                  <h3 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">
                    Systems Knowledge Verification
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Verify your comprehension of ownership, borrowing semantics, and rustc invariants.
                  </p>
                </div>

                {lesson.knowledgeCheck && lesson.knowledgeCheck.length > 0 ? (
                  <div className="space-y-5">
                    {lesson.knowledgeCheck.map((q: KnowledgeCheckQuestion, qIdx: number) => {
                      const selectedOpt = quizAnswers[q.id];
                      const isAnswered = quizSubmitted[q.id];
                      const isCorrect = selectedOpt === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded bg-[#161d2d] border border-white/8 space-y-3"
                        >
                          <h4 className="text-xs sm:text-sm font-semibold text-[#e1e2ec] flex items-center gap-2">
                            <span className="font-mono text-xs text-[#ff5400]">Q{qIdx + 1}.</span>
                            <span>{q.question}</span>
                          </h4>

                          <div className="space-y-2">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isThisSelected = selectedOpt === optIdx;
                              let btnStyle = 'border-white/8 bg-[#101520] text-[#94a3b8] hover:text-[#e1e2ec] hover:border-white/20';

                              if (isAnswered) {
                                if (optIdx === q.correctAnswerIndex) {
                                  btnStyle = 'border-[#10b981] bg-[#10b981]/15 text-[#10b981] font-semibold';
                                } else if (isThisSelected) {
                                  btnStyle = 'border-[#f43f5e] bg-[#f43f5e]/15 text-[#f43f5e]';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleOptionSelect(q.id, optIdx)}
                                  className={`w-full text-left p-3 rounded text-xs border transition-all flex items-center justify-between ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && optIdx === q.correctAnswerIndex && (
                                    <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div className={`p-3 rounded border text-xs leading-relaxed ${
                              isCorrect ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'
                            }`}>
                              <span className="font-bold block mb-1">
                                {isCorrect ? '✓ Correct invariant!' : '✗ Compiler rejects this premise:'}
                              </span>
                              <span className="text-[#e1e2ec]">{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-[#94a3b8]">
                    No quiz questions attached to this lesson. Proceed to the Code Challenge!
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'challenge' && (
              <div className="space-y-5">
                <div className="p-4 rounded bg-[#161d2d] border border-white/8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-mono text-xs font-bold text-[#10b981] uppercase tracking-wider mb-1">
                        Hands-On Challenge Requirements
                      </h3>
                      <p className="text-xs text-[#94a3b8]">
                        Complete the coding prompt in your workbench to satisfy the compiler and earn XP.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#ffb59c] px-2.5 py-1 rounded bg-[#ff5400]/15 border border-[#ff5400]/30">
                      +{lesson.xpReward} XP
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded bg-[#0a0d14] border border-white/8 space-y-3">
                  <h4 className="text-xs font-bold text-[#e1e2ec] uppercase font-mono tracking-wider">
                    Challenge Objectives
                  </h4>
                  <div className="text-xs sm:text-sm text-[#e1e2ec] leading-relaxed whitespace-pre-line">
                    {lesson.overview}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      onLoadCode(lesson.walkthroughCode);
                      onClose();
                    }}
                    className="px-4 py-2 rounded bg-[#ff5400] text-white font-semibold text-xs hover:bg-[#ff6d00] shadow-[0_0_16px_rgba(255,84,0,0.35)] transition-all flex items-center gap-2"
                  >
                    <Code2 size={14} />
                    <span>Open Challenge in Workbench</span>
                  </button>

                  <button
                    onClick={handleMarkComplete}
                    className={`px-4 py-2 rounded text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                      isCompleted
                        ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                        : 'bg-[#161d2d] border-white/10 text-[#94a3b8] hover:text-[#10b981] hover:border-[#10b981]/40'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{isCompleted ? 'Completed' : 'Mark as Completed (+XP)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t border-white/8 bg-[#161d2d] shrink-0 font-mono text-xs">
            {prevLesson ? (
              <button
                onClick={() => onSelectLesson(prevLesson.id)}
                className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#e1e2ec] transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Prev: {prevLesson.title.slice(0, 24)}...</span>
              </button>
            ) : (
              <div />
            )}

            {nextLesson && (
              <button
                onClick={() => onSelectLesson(nextLesson.id)}
                className="flex items-center gap-1.5 text-[#ff5400] hover:text-[#ff6d00] font-semibold transition-colors"
              >
                <span>Next: {nextLesson.title.slice(0, 24)}...</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Memory Inspector */}
        <aside className="w-80 shrink-0 border-l border-white/8 bg-[#101520] flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-white/8 shrink-0 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#e1e2ec]">Memory Inspector</span>
            <span className="text-[#00f0ff] text-[10px] font-bold">LIVE</span>
          </div>

          <div className="p-3 overflow-y-auto flex-1">
            {/* Snapshot */}
            <div className="mb-4 border-b border-white/4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-[#94a3b8] uppercase">Snapshot</span>
                <span className="font-mono text-[10px] text-[#00f0ff]">main.rs : 6</span>
              </div>
            </div>

            {/* Memory Map */}
            <div className="mb-4">
              <span className="font-mono text-[10px] font-bold text-[#94a3b8] uppercase mb-1 block">Memory Map</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#161d2d] border border-white/6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffb868]" />
                    <span className="font-mono text-xs text-[#e1e2ec]">Stack</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#ffb868]">main()</span>
                </div>

                <div className="ml-2 pl-2 border-l border-white/4 space-y-1">
                  <div className="flex items-center justify-between p-2 rounded bg-[#272a32]/50 border border-white/4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] text-[#00f0ff]">message</span>
                      <span className="font-mono text-[9px] text-[#94a3b8]">ptr → 0x7f72a len 12 cap 12</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#ff5400]">OWNER</span>
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-[#00f0ff]">first</span>
                        <span className="font-mono text-[9px] text-[#94a3b8]">&String</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[9px] text-[#00f0ff]">second</span>
                        <span className="font-mono text-[9px] text-[#94a3b8]">&String</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-[#94a3b8] text-center">shared access · no move</div>
                  </div>
                </div>

                <div className="mt-3 p-2 rounded bg-[#161d2d] border border-white/6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] font-bold text-[#00f0ff]">Heap</span>
                    <span className="font-mono text-[9px] text-[#94a3b8]">0x7f72a</span>
                  </div>
                  <div className="p-3 rounded bg-[#0a0d14] border border-white/6 text-[#e1e2ec] font-mono text-sm">
                    "Hello, Rust!"
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/4">
                    <span className="font-mono text-[9px] text-[#94a3b8]">12 bytes</span>
                    <span className="font-mono text-[9px] text-[#94a3b8]">0 copies · 1 allocation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrow Checker */}
            <div className="border-t border-white/8 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-[#94a3b8] uppercase">Borrow Checker</span>
                <span className="text-[#10b981] text-[10px] font-bold">✓ Verified</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                  <span className="text-[#00f0ff] font-mono text-2xl font-bold">02</span>
                  <span className="font-mono text-[9px] text-[#94a3b8] block mt-1">Immutable borrows</span>
                </div>
                <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                  <span className="text-[#ffb868] font-mono text-2xl font-bold">00</span>
                  <span className="font-mono text-[9px] text-[#94a3b8] block mt-1">Mutable borrows</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-1.5 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                  <Check size={12} className="text-[#10b981] shrink-0" />
                  <span className="font-mono text-[10px] text-[#e1e2ec]">Owner remains in scope</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                  <Check size={12} className="text-[#10b981] shrink-0" />
                  <span className="font-mono text-[10px] text-[#e1e2ec]">References are read-only</span>
                </div>
              </div>

              <div className="mt-3 p-2 rounded bg-[#ff5400]/10 border border-[#ff5400]/20">
                <span className="font-mono text-[9px] font-bold text-[#ffb59c] uppercase tracking-wider mb-1 block">Keep in Mind</span>
                <p className="font-mono text-[10px] text-[#94a3b8] leading-relaxed">
                  Borrowing gives access, not ownership. The original value is never moved or duplicated.
                </p>
              </div>

              <div className="mt-3 p-2 rounded bg-[#10b981]/15 border border-[#10b981]/30">
                <Check size={14} className="text-[#10b981] shrink-0 mr-2" />
                <span className="font-mono text-[10px] text-[#10b981]">Both references share one value</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  // Modal overlay layout (kept for backward compatibility)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-350 h-[90vh] bg-[#101520] border border-white/12 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#161d2d] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-[#e1e2ec] text-sm">FerricForge</span>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs text-[#ffb868]">Academy</span>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs text-[#e1e2ec]">{stageTitle}</span>
          </div>
          <div className="flex items-center gap-1 text-[#94a3b8] text-xs font-mono">
            <span>WORKSPACE</span>
            <span className="text-white/20">/</span>
            <span>01</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#ff5400]/15 text-[#ff5400] border border-[#ff5400]/30 px-2 py-0.5 rounded text-[10px] font-bold">
              7 DAY STREAK
            </span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#161d2d] border border-white/8">
              <span className="text-xs font-mono text-[#e1e2ec]">Alex Morgan</span>
              <ChevronDown size={14} className="text-[#94a3b8]" />
            </div>
          </div>
        </div>

        {/* Body: 3 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Lesson Navigation */}
          <aside className="w-72 shrink-0 border-r border-white/8 flex flex-col bg-[#0a0d14]">
            <div className="p-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded bg-[#ff5400]/15 border border-[#ff5400]/40 flex items-center justify-center text-[#ff5400]">
                  <BookOpen size={14} />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#ffb868] tracking-wider block">
                    Rust Foundations
                  </span>
                  <span className="text-xs text-[#94a3b8]">Build with confidence.</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#94a3b8]">Your Progress</span>
                  <span className="font-mono text-[10px] font-bold text-[#e1e2ec]">{completedCount} / {totalCount}</span>
                </div>
                <div className="w-full bg-[#161d2d] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-linear-to-r from-[#ff5400] to-[#ffb868] h-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] mt-1">
                  <span>Progress</span>
                  <span>{progressPct}%</span>
                </div>
              </div>

              {/* Lesson List */}
              <div className="space-y-0.5 overflow-y-auto">
                {([1, 2, 3, 4, 5] as LearningStage[]).map((stageNum) => {
                  const stageMeta = LEARNING_STAGES[stageNum];
                  const stageLessons = lessonsByStage[stageNum];
                  const stageCompleted = stageLessons.filter((l) => completedLessonIds.has(l.id)).length;

                  return (
                    <div key={stageNum} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#ffb868] uppercase tracking-wider px-3 py-1.5">
                        <span className="w-4 h-4 rounded bg-[#ffb868]/20 flex items-center justify-center text-[10px]">
                          {stageNum}
                        </span>
                        <span className="truncate">{stageMeta.title}</span>
                        <span className="ml-auto font-mono text-[10px] text-[#94a3b8]/60">
                          {stageCompleted} / {stageLessons.length}
                        </span>
                      </div>

                      <div className="space-y-0.5 pl-1.5">
                        {stageLessons.map((l: CurriculumLesson) => {
                          const isLessonCompleted = completedLessonIds.has(l.id);
                          const isCurrent = activeLessonId === l.id;

                          return (
                            <div
                              key={l.id}
                              onClick={() => onSelectLesson(l.id)}
                              className={`p-2 rounded text-xs cursor-pointer border transition-all flex items-center gap-2 ${
                                isCurrent
                                  ? 'bg-[#ff5400]/15 border-[#ff5400] text-[#e1e2ec]'
                                  : isLessonCompleted
                                  ? 'bg-[#101520] border-[#10b981]/30 text-[#94a3b8] hover:text-[#e1e2ec]'
                                  : 'bg-[#101520] border-white/4 text-[#94a3b8] hover:text-[#e1e2ec] hover:border-white/10'
                              }`}
                            >
                              {isLessonCompleted ? (
                                <CheckCircle2 size={12} className="text-[#10b981] shrink-0" />
                              ) : (
                                <span className="font-mono text-[9px] text-[#ff5400] shrink-0">+{l.xpReward}xp</span>
                              )}
                              <span className="font-medium truncate text-[11px]">{l.title}</span>
                              <span className="ml-auto font-mono text-[9px] text-[#94a3b8]/50">{l.estimatedMinutes}m</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded bg-[#161d2d] border border-white/8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#94a3b8] text-[10px] font-mono">Need help?</span>
                </div>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Read the ownership field guide.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 text-[11px] font-mono text-[#ff5400] hover:text-[#ff6d00] underline underline-offset-2"
                >
                  Open field guide →
                </button>
              </div>
            </div>
          </aside>

          {/* Center: Main Lesson Content */}
          <div className="flex-1 overflow-y-auto bg-[#101520] min-w-0">
            {/* Lesson Header */}
            <div className="px-6 py-4 border-b border-white/8 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-[#94a3b8] tracking-wider">
                  Chapter {lesson.stage} / {stageTitle}
                </span>
                <span className="font-mono text-[10px] text-[#ffb868]">
                  Lesson {currentIdx + 1} of {totalCount}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#e1e2ec] leading-tight mb-1">{lesson.title}</h1>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{lesson.overview}</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded text-[10px] font-bold">
                  ~ {lesson.estimatedMinutes} MIN
                </span>
                <span className="font-mono text-[10px] text-[#94a3b8]">Rust 2024 / 2021</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 border-b border-white/8 shrink-0 font-mono text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTab('walkthrough')}
                  className={`px-3 py-2.5 font-semibold transition-all border-b-2 ${
                    selectedTab === 'walkthrough'
                      ? 'text-[#ff5400] border-[#ff5400]'
                      : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                  }`}
                >
                  Concept &amp; Walkthrough
                </button>
                <button
                  onClick={() => setSelectedTab('knowledgeCheck')}
                  className={`px-3 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
                    selectedTab === 'knowledgeCheck'
                      ? 'text-[#00f0ff] border-[#00f0ff]'
                      : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                  }`}
                >
                  <HelpCircle size={13} />
                  <span>Knowledge Check</span>
                  {lesson.knowledgeCheck && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/8">
                      {lesson.knowledgeCheck.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTab('challenge')}
                  className={`px-3 py-2.5 font-semibold transition-all border-b-2 ${
                    selectedTab === 'challenge'
                      ? 'text-[#10b981] border-[#10b981]'
                      : 'text-[#94a3b8] border-transparent hover:text-[#e1e2ec]'
                  }`}
                >
                  Code Challenge
                </button>
              </div>

              <button
                onClick={() => {
                  onLoadCode(lesson.walkthroughCode);
                  onClose();
                }}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#00f0ff] hover:text-white px-2.5 py-1 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 transition-all ml-auto"
              >
                <FileCode size={13} />
                <span>Load in Editor</span>
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedTab === 'walkthrough' && (
                <div className="space-y-6">
                  {/* Overview Callout */}
                  <div className="p-4 rounded-lg bg-[#161d2d] border border-white/8">
                    <h4 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">
                      Core Architectural Invariant
                    </h4>
                    <p className="text-sm text-[#e1e2ec] leading-relaxed">
                      {lesson.overview}
                    </p>
                  </div>

                  {/* Guide Narrative */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#ffb868] font-mono uppercase tracking-wider">
                      Deep Technical Breakdown
                    </h3>
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line font-sans">
                      {lesson.guideContent}
                    </div>
                  </div>

                  {/* Walkthrough Code Snippet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#e1e2ec]">
                        Demonstration Code
                      </span>
                      <span className="font-mono text-[10px] text-[#94a3b8]">Rust 2024 / 2021</span>
                    </div>

                    <div className="p-4 rounded bg-[#0a0d14] border border-white/8 font-mono text-xs text-[#e1e2ec] overflow-x-auto whitespace-pre leading-relaxed">
                      {lesson.walkthroughCode}
                    </div>
                  </div>

                  {/* Line-by-Line Technical Annotations */}
                  {lesson.walkthroughExplanations && lesson.walkthroughExplanations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
                        Line Annotations &amp; Memory Mechanics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lesson.walkthroughExplanations.map((exp: { lineRange: string; headline: string; explanation: string }, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded bg-[#161d2d] border border-white/6 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold text-[#ff5400]">
                                Lines {exp.lineRange}
                              </span>
                              <span className="text-[11px] font-bold text-[#e1e2ec]">
                                {exp.headline}
                              </span>
                            </div>
                            <p className="text-xs text-[#94a3b8] leading-relaxed">
                              {exp.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'knowledgeCheck' && (
                <div className="space-y-6">
                  <div className="p-4 rounded bg-[#161d2d] border border-white/8">
                    <h3 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">
                      Systems Knowledge Verification
                    </h3>
                    <p className="text-xs text-[#94a3b8]">
                      Verify your comprehension of ownership, borrowing semantics, and rustc invariants.
                    </p>
                  </div>

                  {lesson.knowledgeCheck && lesson.knowledgeCheck.length > 0 ? (
                    <div className="space-y-5">
                      {lesson.knowledgeCheck.map((q: KnowledgeCheckQuestion, qIdx: number) => {
                        const selectedOpt = quizAnswers[q.id];
                        const isAnswered = quizSubmitted[q.id];
                        const isCorrect = selectedOpt === q.correctAnswerIndex;

                        return (
                          <div
                            key={q.id}
                            className="p-4 rounded bg-[#161d2d] border border-white/8 space-y-3"
                          >
                            <h4 className="text-xs sm:text-sm font-semibold text-[#e1e2ec] flex items-center gap-2">
                              <span className="font-mono text-xs text-[#ff5400]">Q{qIdx + 1}.</span>
                              <span>{q.question}</span>
                            </h4>

                            <div className="space-y-2">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isThisSelected = selectedOpt === optIdx;
                                let btnStyle = 'border-white/8 bg-[#101520] text-[#94a3b8] hover:text-[#e1e2ec] hover:border-white/20';

                                if (isAnswered) {
                                  if (optIdx === q.correctAnswerIndex) {
                                    btnStyle = 'border-[#10b981] bg-[#10b981]/15 text-[#10b981] font-semibold';
                                  } else if (isThisSelected) {
                                    btnStyle = 'border-[#f43f5e] bg-[#f43f5e]/15 text-[#f43f5e]';
                                  }
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleOptionSelect(q.id, optIdx)}
                                    className={`w-full text-left p-3 rounded text-xs border transition-all flex items-center justify-between ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {isAnswered && optIdx === q.correctAnswerIndex && (
                                      <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <div className={`p-3 rounded border text-xs leading-relaxed ${
                                isCorrect ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30 text-[#f43f5e]'
                              }`}>
                                <span className="font-bold block mb-1">
                                  {isCorrect ? '✓ Correct invariant!' : '✗ Compiler rejects this premise:'}
                                </span>
                                <span className="text-[#e1e2ec]">{q.explanation}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[#94a3b8]">
                      No quiz questions attached to this lesson. Proceed to the Code Challenge!
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'challenge' && (
                <div className="space-y-5">
                  <div className="p-4 rounded bg-[#161d2d] border border-white/8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-mono text-xs font-bold text-[#10b981] uppercase tracking-wider mb-1">
                          Hands-On Challenge Requirements
                        </h3>
                        <p className="text-xs text-[#94a3b8]">
                          Complete the coding prompt in your workbench to satisfy the compiler and earn XP.
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#ffb59c] px-2.5 py-1 rounded bg-[#ff5400]/15 border border-[#ff5400]/30">
                        +{lesson.xpReward} XP
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded bg-[#0a0d14] border border-white/8 space-y-3">
                    <h4 className="text-xs font-bold text-[#e1e2ec] uppercase font-mono tracking-wider">
                      Challenge Objectives
                    </h4>
                    <div className="text-xs sm:text-sm text-[#e1e2ec] leading-relaxed whitespace-pre-line">
                      {lesson.overview}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        onLoadCode(lesson.walkthroughCode);
                        onClose();
                      }}
                      className="px-4 py-2 rounded bg-[#ff5400] text-white font-semibold text-xs hover:bg-[#ff6d00] shadow-[0_0_16px_rgba(255,84,0,0.35)] transition-all flex items-center gap-2"
                    >
                      <Code2 size={14} />
                      <span>Open Challenge in Workbench</span>
                    </button>

                    <button
                      onClick={handleMarkComplete}
                      className={`px-4 py-2 rounded text-xs font-mono font-semibold transition-all border flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                          : 'bg-[#161d2d] border-white/10 text-[#94a3b8] hover:text-[#10b981] hover:border-[#10b981]/40'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isCompleted ? 'Completed' : 'Mark as Completed (+XP)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="px-6 py-4 border-t border-white/8 bg-[#161d2d] shrink-0 font-mono text-xs">
              {prevLesson ? (
                <button
                  onClick={() => onSelectLesson(prevLesson.id)}
                  className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#e1e2ec] transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Prev: {prevLesson.title.slice(0, 24)}...</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson && (
                <button
                  onClick={() => onSelectLesson(nextLesson.id)}
                  className="flex items-center gap-1.5 text-[#ff5400] hover:text-[#ff6d00] font-semibold transition-colors"
                >
                  <span>Next: {nextLesson.title.slice(0, 24)}...</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar: Memory Inspector */}
          <aside className="w-80 shrink-0 border-l border-white/8 bg-[#101520] flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-white/8 shrink-0 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#e1e2ec]">Memory Inspector</span>
              <span className="text-[#00f0ff] text-[10px] font-bold">LIVE</span>
            </div>

            <div className="p-3 overflow-y-auto flex-1">
              {/* Snapshot */}
              <div className="mb-4 border-b border-white/4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-[#94a3b8] uppercase">Snapshot</span>
                  <span className="font-mono text-[10px] text-[#00f0ff]">main.rs : 6</span>
                </div>
              </div>

              {/* Memory Map */}
              <div className="mb-4">
                <span className="font-mono text-[10px] font-bold text-[#94a3b8] uppercase mb-1 block">Memory Map</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-[#161d2d] border border-white/6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ffb868]" />
                      <span className="font-mono text-xs text-[#e1e2ec]">Stack</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#ffb868]">main()</span>
                  </div>

                  <div className="ml-2 pl-2 border-l border-white/4 space-y-1">
                    <div className="flex items-center justify-between p-2 rounded bg-[#272a32]/50 border border-white/4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[9px] text-[#00f0ff]">message</span>
                        <span className="font-mono text-[9px] text-[#94a3b8]">ptr → 0x7f72a len 12 cap 12</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#ff5400]">OWNER</span>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                      <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] text-[#00f0ff]">first</span>
                          <span className="font-mono text-[9px] text-[#94a3b8]">&String</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] text-[#00f0ff]">second</span>
                          <span className="font-mono text-[9px] text-[#94a3b8]">&String</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-[#94a3b8] text-center">shared access · no move</div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded bg-[#161d2d] border border-white/6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] font-bold text-[#00f0ff]">Heap</span>
                      <span className="font-mono text-[9px] text-[#94a3b8]">0x7f72a</span>
                    </div>
                    <div className="p-3 rounded bg-[#0a0d14] border border-white/6 text-[#e1e2ec] font-mono text-sm">
                      "Hello, Rust!"
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/4">
                      <span className="font-mono text-[9px] text-[#94a3b8]">12 bytes</span>
                      <span className="font-mono text-[9px] text-[#94a3b8]">0 copies · 1 allocation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Borrow Checker */}
              <div className="border-t border-white/8 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-[#94a3b8] uppercase">Borrow Checker</span>
                  <span className="text-[#10b981] text-[10px] font-bold">✓ Verified</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                    <span className="text-[#00f0ff] font-mono text-2xl font-bold">02</span>
                    <span className="font-mono text-[9px] text-[#94a3b8] block mt-1">Immutable borrows</span>
                  </div>
                  <div className="p-2 rounded bg-[#161d2d] border border-white/6">
                    <span className="text-[#ffb868] font-mono text-2xl font-bold">00</span>
                    <span className="font-mono text-[9px] text-[#94a3b8] block mt-1">Mutable borrows</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                    <Check size={12} className="text-[#10b981] shrink-0" />
                    <span className="font-mono text-[10px] text-[#e1e2ec]">Owner remains in scope</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                    <Check size={12} className="text-[#10b981] shrink-0" />
                    <span className="font-mono text-[10px] text-[#e1e2ec]">References are read-only</span>
                  </div>
                </div>

                <div className="mt-3 p-2 rounded bg-[#ff5400]/10 border border-[#ff5400]/20">
                  <span className="font-mono text-[9px] font-bold text-[#ffb59c] uppercase tracking-wider mb-1 block">Keep in Mind</span>
                  <p className="font-mono text-[10px] text-[#94a3b8] leading-relaxed">
                    Borrowing gives access, not ownership. The original value is never moved or duplicated.
                  </p>
                </div>

                <div className="mt-3 p-2 rounded bg-[#10b981]/15 border border-[#10b981]/30">
                  <Check size={14} className="text-[#10b981] shrink-0 mr-2" />
                  <span className="font-mono text-[10px] text-[#10b981]">Both references share one value</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
