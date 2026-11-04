import React, { useState, useEffect, useRef } from 'react';
import { CURRICULUM_LESSONS, calculateLevelFromXp } from '../utils/curriculumData';
import { FRAMEWORK_GUIDES } from '../utils/frameworksData';
import { CAPSTONE_PROJECTS } from '../utils/capstoneProjectsData';
import { CurriculumLesson, UserProgress } from '../types/curriculum';
import { FrameworkGuide, CapstoneProject } from '../types/frameworks';
import { WorkspaceFile } from '../types/rust';
import { DSA_TOPICS } from '../utils/dsaData';
import { TypeMemoryExplorer } from './TypeMemoryExplorer';
import {
  DiagramWrapper,
  VariableDiagram,
  MutableVsImmutableDiagram,
  MemoryLayoutDiagram,
  OwnershipMoveDiagram,
} from './AcademyDiagrams';
import {
  GraduationCap,
  BookOpen,
  Code2,
  CheckCircle2,
  HelpCircle,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  X,
  ChevronRight,
  Eye,
  Check,
  Box,
  Layers,
  Rocket,
  Cpu,
  Globe,
  Terminal,
  FolderTree,
  AlertTriangle,
  Lightbulb,
  Copy,
  Binary,
  Flame,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: AcademySection;
  progress: UserProgress;
  onUnlockHint: (lessonId: string, hintIndex: number) => void;
  onLoadExerciseToEditor: (code: string) => void;
  onVerifyExercise: (lesson: CurriculumLesson) => void;
  isVerifying: boolean;
  onLoadProjectWorkspace: (files: WorkspaceFile[]) => void;
  onKnowledgeCheckSubmit?: (lessonId: string, answers: number[]) => void;
}

type AcademySection = 'curriculum' | 'frameworks' | 'capstones' | 'memory-explorer' | 'dsa';

export const AcademyModal: React.FC<AcademyModalProps> = ({
  isOpen,
  onClose,
  initialSection,
  progress,
  onUnlockHint,
  onLoadExerciseToEditor,
  onVerifyExercise,
  isVerifying,
  onLoadProjectWorkspace,
  onKnowledgeCheckSubmit,
}) => {
  const [section, setSection] = useState<AcademySection>(initialSection || 'curriculum');
  const modalRef = useRef<HTMLDivElement>(null);

  // Curriculum state
  const [selectedLessonId, setSelectedLessonId] = useState<string>(CURRICULUM_LESSONS[0].id);
  const [curriculumTab, setCurriculumTab] = useState<'guide' | 'walkthrough' | 'exercise' | 'knowledge-check'>('guide');
  const [showSolution, setShowSolution] = useState(false);

  // Knowledge check state
  const [knowledgeCheckAnswers, setKnowledgeCheckAnswers] = useState<Record<string, number>>({});
  const [knowledgeCheckSubmitted, setKnowledgeCheckSubmitted] = useState<boolean>(false);
  const [knowledgeCheckScore, setKnowledgeCheckScore] = useState<{ correct: number; total: number } | null>(null);

  // Frameworks state
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(FRAMEWORK_GUIDES[0].id);
  const [frameworkSubTab, setFrameworkSubTab] = useState<'architecture' | 'design-guide' | 'snippets' | 'challenge'>('architecture');
  const [showFrameworkSolution, setShowFrameworkSolution] = useState(false);

  // Capstone state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(CAPSTONE_PROJECTS[0].id);
  const [copiedCodeTitle, setCopiedCodeTitle] = useState<string | null>(null);

  // DSA State
  const [selectedDsaId, setSelectedDsaId] = useState<string>(DSA_TOPICS[0].id);

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

  const currentLesson =
    CURRICULUM_LESSONS.find((l) => l.id === selectedLessonId) || CURRICULUM_LESSONS[0];
  const currentFramework =
    FRAMEWORK_GUIDES.find((f) => f.id === selectedFrameworkId) || FRAMEWORK_GUIDES[0];
  const currentProject =
    CAPSTONE_PROJECTS.find((p) => p.id === selectedProjectId) || CAPSTONE_PROJECTS[0];
  const currentDsa =
    DSA_TOPICS.find((d) => d.id === selectedDsaId) || DSA_TOPICS[0];

  const isCompleted = progress.completedLessonIds.includes(currentLesson.id);
  const unlockedHints = progress.unlockedHintIndices[currentLesson.id] || [];
  const levelInfo = calculateLevelFromXp(progress.totalXp);

  // Lesson gating: a lesson is unlocked if it's the first one or the previous lesson is completed
  const lessonIndex = CURRICULUM_LESSONS.findIndex((l) => l.id === currentLesson.id);
  const isLessonUnlocked = lessonIndex === 0 || progress.completedLessonIds.includes(CURRICULUM_LESSONS[lessonIndex - 1].id);

  const getLessonUnlockStatus = (lesson: CurriculumLesson): { unlocked: boolean; reason?: string } => {
    const idx = CURRICULUM_LESSONS.findIndex((l) => l.id === lesson.id);
    if (idx === 0) return { unlocked: true };
    const prevLesson = CURRICULUM_LESSONS[idx - 1];
    const prevCompleted = progress.completedLessonIds.includes(prevLesson.id);
    return prevCompleted
      ? { unlocked: true }
      : { unlocked: false, reason: `Complete "${prevLesson.title}" first` };
  };

  // Knowledge check handlers
  const handleKnowledgeCheckAnswer = (questionId: string, optionIndex: number) => {
    setKnowledgeCheckAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleKnowledgeCheckSubmit = () => {
    const questions = currentLesson.knowledgeCheck || [];
    let correct = 0;
    const answers: number[] = [];

    questions.forEach((q, qIdx) => {
      const selected = knowledgeCheckAnswers[q.id];
      answers.push(selected ?? -1);
      if (selected === q.correctAnswerIndex) correct += 1;
    });

    setKnowledgeCheckScore({ correct, total: questions.length });
    setKnowledgeCheckSubmitted(true);

    if (onKnowledgeCheckSubmit) {
      onKnowledgeCheckSubmit(currentLesson.id, answers);
    }
  };

  const resetKnowledgeCheck = () => {
    setKnowledgeCheckAnswers({});
    setKnowledgeCheckSubmitted(false);
    setKnowledgeCheckScore(null);
  };

  const handleCopyCode = async (title: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeTitle(title);
      setTimeout(() => setCopiedCodeTitle(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden select-none theme-panel" ref={modalRef}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#DE3804] to-amber-500 text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-100">FerrisForge Academy & Framework Masterclass</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#DE3804]/20 text-[#DE3804] border border-[#DE3804]/30">
                  From Scratch to Production Systems
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Foundations from scratch, framework internals (Axum, Tokio, Bevy, Ratatui), project blueprints & capstones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Level Strip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-neutral-200">
                  Lvl {levelInfo.level}: <span className="text-amber-400">{levelInfo.title}</span>
                </div>
                <div className="w-24 bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${levelInfo.progressRatio * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                {progress.totalXp} XP
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close Academy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Navigation Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-neutral-800 bg-[#121214] overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSection('curriculum')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                section === 'curriculum'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Curriculum Tracks & Challenges</span>
            </button>

            <button
              onClick={() => setSection('frameworks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                section === 'frameworks'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>2. How Frameworks Work (Under The Hood)</span>
            </button>

            <button
              onClick={() => setSection('capstones')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                section === 'capstones'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-[#DE3804]" />
              <span>3. Full Project Capstones (1-Click Workspaces)</span>
            </button>

            <button
              onClick={() => setSection('memory-explorer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                section === 'memory-explorer'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Box Sizes & Types</span>
            </button>

            <button
              onClick={() => setSection('dsa')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                section === 'dsa'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Binary className="w-3.5 h-3.5 text-amber-500" />
              <span>5. DSA in Rust (Memory Models)</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 shrink-0">
            {progress.completedLessonIds.length} / {CURRICULUM_LESSONS.length} Lessons Mastered
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: CURRICULUM TRACKS & CHALLENGES                */}
        {/* ======================================================== */}
        {section === 'curriculum' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Track & Lesson Browser */}
            <div className="w-72 shrink-0 border-r border-neutral-800 bg-[#0e0e11] overflow-y-auto divide-y divide-neutral-900">
              <div className="p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                  Learning Progression
                </h3>

                <div className="space-y-1">
                  {CURRICULUM_LESSONS.map((lesson) => {
                    const isSelected = lesson.id === currentLesson.id;
                    const completed = progress.completedLessonIds.includes(lesson.id);
                    const unlockStatus = getLessonUnlockStatus(lesson);
                    const isUnlocked = unlockStatus.unlocked;

                    return (
                      <div
                        key={lesson.id}
                        onClick={isUnlocked ? () => { setSelectedLessonId(lesson.id); setShowSolution(false); } : undefined}
                        className={`p-2.5 rounded-lg text-left transition-all flex items-start gap-2.5 ${
                          !isUnlocked
                            ? 'bg-neutral-900/50 border border-transparent text-neutral-600 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#1e1e24] border border-neutral-700 text-white cursor-pointer'
                            : 'hover:bg-neutral-900/60 text-neutral-400 border border-transparent cursor-pointer'
                        }`}
                        title={!isUnlocked ? unlockStatus.reason : undefined}
                      >
                        {!isUnlocked && (
                          <Lock className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                        )}
                        <div className="pt-0.5 shrink-0 flex-1">
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isUnlocked ? (
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'border-amber-400 text-amber-400'
                                  : 'border-neutral-700 text-neutral-500'
                              }`}
                            >
                              •
                            </div>
                          ) : (
                            <Lock className="w-4 h-4 text-neutral-600 shrink-0" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span
                              className={`text-xs font-medium truncate ${
                                isSelected ? 'text-neutral-100 font-semibold' : 'text-neutral-300'
                              }`}
                            >
                              {lesson.title}
                            </span>
                            {!isUnlocked && (
                              <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                                Locked
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                            <span className="capitalize">{lesson.difficulty}</span>
                            <span>•</span>
                            <span>{lesson.estimatedMinutes}m</span>
                            <span>•</span>
                            <span className="text-amber-400">+{lesson.xpReward} XP</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Active Lesson View */}
            <div className="flex-1 flex flex-col bg-[#121214] overflow-hidden">
              {/* Lesson Sub-Tabs */}
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-neutral-800 bg-[#141417]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurriculumTab('guide')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      curriculumTab === 'guide'
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Concepts From Scratch</span>
                  </button>

                  <button
                    onClick={() => setCurriculumTab('walkthrough')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      curriculumTab === 'walkthrough'
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Annotated Code Walkthrough</span>
                  </button>

                  <button
                    onClick={() => setCurriculumTab('exercise')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      curriculumTab === 'exercise'
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Practice Challenge</span>
                    {isCompleted && (
                      <span className="ml-1 px-1 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 rounded">
                        Done
                      </span>
                    )}
                  </button>

                  {currentLesson.knowledgeCheck && currentLesson.knowledgeCheck.length > 0 && (
                    <button
                      onClick={() => {
                        resetKnowledgeCheck();
                        setCurriculumTab('knowledge-check');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        curriculumTab === 'knowledge-check'
                          ? 'bg-neutral-800 text-white border border-neutral-700'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                      <span>Knowledge Check</span>
                      {knowledgeCheckScore && (
                        <span className="ml-1 px-1 py-0.2 text-[9px] bg-sky-500/20 text-sky-400 rounded">
                          {knowledgeCheckScore.correct}/{knowledgeCheckScore.total}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">{currentLesson.trackTitle}</span>
                </div>
              </div>

              {/* Sub-Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {curriculumTab === 'guide' && (
                  <div className="max-w-3xl space-y-4 text-neutral-300 leading-relaxed text-sm">
                    <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800">
                      <div className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-1">
                        Lesson Overview
                      </div>
                      <p className="text-neutral-200">{currentLesson.overview}</p>
                    </div>

                    <div className="space-y-3">
                      {currentLesson.guideContent.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h3 key={pIdx} className="text-base font-bold text-white pt-2 border-b border-neutral-800 pb-1">
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('#### ')) {
                          return (
                            <h4 key={pIdx} className="text-sm font-semibold text-amber-300 pt-1">
                              {paragraph.replace('#### ', '')}
                            </h4>
                          );
                        }
                        if (paragraph.startsWith('```rust')) {
                          const code = paragraph.replace('```rust\n', '').replace('\n```', '');
                          return (
                            <div key={pIdx} className="my-2">
                              <pre className="p-3 bg-neutral-950 rounded-md font-mono text-xs text-neutral-200 border border-neutral-800 overflow-x-auto">
                                {code}
                              </pre>
                            </div>
                          );
                        }
                        if (paragraph.startsWith('|')) {
                          return (
                            <div key={pIdx} className="overflow-x-auto my-2">
                              <pre className="font-mono text-xs bg-neutral-950 p-2 rounded border border-neutral-800 text-neutral-300">
                                {paragraph}
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <div key={pIdx} className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/60 text-neutral-300 leading-relaxed">
                            {paragraph}
                          </div>
                        );
                      })}
                    </div>

                    {/* Visual Diagrams for key concepts */}
                    {currentLesson.id === 'syntax-variables' && (
                      <div className="space-y-4">
                        <VariableDiagram
                          variableName="score"
                          variableValue={100}
                          address="0x1001"
                          isMutable={false}
                        />
                        <MutableVsImmutableDiagram />
                        <MemoryLayoutDiagram />
                      </div>
                    )}
                    {currentLesson.id === 'borrow-checker-mastery' && (
                      <div className="space-y-4">
                        <OwnershipMoveDiagram />
                        <MemoryLayoutDiagram />
                      </div>
                    )}

                    <div className="pt-4 flex items-center justify-between border-t border-neutral-800">
                      <span className="text-xs text-neutral-400">Ready to try it in action?</span>
                      <button
                        onClick={() => setCurriculumTab('exercise')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        <span>Start Practice Challenge</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {curriculumTab === 'walkthrough' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                      <span>Inspect line annotations explaining exactly what the compiler is checking:</span>
                      <button
                        onClick={() => {
                          onLoadExerciseToEditor(currentLesson.walkthroughCode);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Run Walkthrough in Playground</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2">
                        <pre className="p-4 bg-neutral-950 rounded-lg font-mono text-xs text-neutral-200 border border-neutral-800 overflow-x-auto leading-relaxed">
                          {currentLesson.walkthroughCode}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          Step-by-Step Annotations
                        </h4>
                        {currentLesson.walkthroughExplanations.map((exp, eIdx) => (
                          <div
                            key={eIdx}
                            className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-400">{exp.headline}</span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                {exp.lineRange}
                              </span>
                            </div>
                            <p className="text-neutral-300 text-xs leading-relaxed">
                              {exp.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {curriculumTab === 'exercise' && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-neutral-100">
                          {currentLesson.exercise.title}
                        </h3>
                        <span className="text-xs font-medium text-amber-400">
                          Reward: +{currentLesson.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {currentLesson.exercise.description}
                      </p>

                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                          Requirements:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-neutral-300">
                          {currentLesson.exercise.requirements.map((req, rIdx) => (
                            <li key={rIdx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          onLoadExerciseToEditor(currentLesson.exercise.starterCode);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded font-medium text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Load Exercise into Playground</span>
                      </button>

                      <button
                        onClick={() => onVerifyExercise(currentLesson)}
                        disabled={isVerifying}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isVerifying ? 'Running cargo test...' : 'Verify Solution & Claim XP'}</span>
                      </button>

                      <button
                        onClick={() => setShowSolution(!showSolution)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showSolution ? 'Hide Solution' : 'View Reference Solution'}</span>
                      </button>
                    </div>

                    {/* Hints Section */}
                    <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                        <HelpCircle className="w-4 h-4 text-sky-400" />
                        <span>Progressive Guidance Hints:</span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {currentLesson.exercise.hints.map((hint, hIdx) => {
                          const isUnlocked = unlockedHints.includes(hint.level);
                          return (
                            <div
                              key={hIdx}
                              className="p-3 rounded bg-neutral-950/70 border border-neutral-800 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-neutral-300">
                                  Hint #{hIdx + 1}: {hint.title}
                                </span>
                                {!isUnlocked && (
                                  <button
                                    onClick={() => onUnlockHint(currentLesson.id, hint.level)}
                                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-sky-400 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                  >
                                    Reveal Hint
                                  </button>
                                )}
                              </div>
                              {isUnlocked ? (
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                  {hint.content}
                                </p>
                              ) : (
                                <p className="text-neutral-600 text-xs italic">
                                  Hint locked. Click "Reveal Hint" to inspect guidance.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {showSolution && (
                      <div className="p-4 rounded-lg bg-black/80 border border-neutral-800 space-y-2">
                        <div className="text-xs font-semibold text-amber-400">
                          Reference Solution Implementation:
                        </div>
                        <pre className="p-3 bg-neutral-950 rounded font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
                          {currentLesson.exercise.solutionCode}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {curriculumTab === 'knowledge-check' && (
                  <div className="max-w-2xl space-y-4">
                    <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-sky-400" />
                        <h3 className="text-sm font-bold text-neutral-100">Knowledge Check</h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Test your understanding of <span className="text-neutral-200">{currentLesson.title}</span>
                      </p>
                    </div>

                    {knowledgeCheckScore ? (
                      // Results view
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              Knowledge Check Results
                            </div>
                            <span className="text-xs font-mono text-emerald-400">
                              {knowledgeCheckScore.correct} / {knowledgeCheckScore.total}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 transition-all"
                              style={{ width: `${(knowledgeCheckScore.correct / knowledgeCheckScore.total) * 100}%` }}
                            />
                          </div>
                        </div>

                        {currentLesson.knowledgeCheck?.map((q, qIdx) => {
                          const selected = knowledgeCheckAnswers[q.id];
                          const isCorrect = selected === q.correctAnswerIndex;
                          const isSelectedWrong = selected !== undefined && selected !== q.correctAnswerIndex;
                          return (
                            <div
                              key={q.id}
                              className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2"
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-bold shrink-0 mt-0.5">
                                  {isCorrect ? '✓' : isSelectedWrong ? '✗' : '?'}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-200">
                                    {qIdx + 1}. {q.question}
                                  </p>
                                  {q.options.map((opt, oIdx) => {
                                    const isSelectedOption = selected === oIdx;
                                    const isCorrectOption = oIdx === q.correctAnswerIndex;
                                    return (
                                      <div
                                        key={oIdx}
                                        className="flex items-center gap-2 pl-4 text-xs"
                                      >
                                        {isSelectedOption && !isCorrectOption && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                        )}
                                        {isCorrectOption && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                        )}
                                        <span
                                          className={`text-xs leading-relaxed ${
                                            isCorrectOption
                                              ? 'text-emerald-400'
                                              : isSelectedOption && !isCorrectOption
                                              ? 'text-red-400 line-through'
                                              : 'text-neutral-400'
                                          }`}
                                        >
                                          {opt}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  <p className="mt-1 text-xs text-amber-300/90 italic">
                                    {q.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div className="pt-2">
                          {knowledgeCheckScore.correct === knowledgeCheckScore.total ? (
                            <button
                              onClick={() => {
                                resetKnowledgeCheck();
                                setCurriculumTab('exercise');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Perfect Score — Go to Practice Challenge</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                resetKnowledgeCheck();
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium text-xs transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retake Knowledge Check</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Questions view
                      <form onSubmit={(e) => { e.preventDefault(); handleKnowledgeCheckSubmit(); }}>
                        {currentLesson.knowledgeCheck?.map((q) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-3"
                          >
                            <p className="text-sm text-neutral-200 leading-relaxed">
                              {q.question}
                            </p>
                            <div className="space-y-1.5">
                              {q.options.map((opt, oIdx) => (
                                <label
                                  key={oIdx}
                                  className="flex items-center gap-3 p-3 rounded hover:bg-neutral-800 cursor-pointer transition-colors border border-transparent"
                                >
                                  <input
                                    type="radio"
                                    name={`kc-${q.id}`}
                                    checked={knowledgeCheckAnswers[q.id] === oIdx}
                                    onChange={() => handleKnowledgeCheckAnswer(q.id, oIdx)}
                                    className="accent-amber-400 text-amber-400 shrink-0"
                                  />
                                  <span className="text-neutral-300 text-xs leading-relaxed">
                                    {opt}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            {Object.keys(knowledgeCheckAnswers).length} of {currentLesson.knowledgeCheck!.length} answered
                          </span>
                          <button
                            type="submit"
                            disabled={Object.keys(knowledgeCheckAnswers).length < (currentLesson.knowledgeCheck?.length || 0)}
                            className="px-4 py-2 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit Knowledge Check
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: HOW FRAMEWORKS WORK (UNDER THE HOOD)         */}
        {/* ======================================================== */}
        {section === 'frameworks' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Frameworks Selector */}
            <div className="w-64 shrink-0 border-r border-neutral-800 bg-[#0e0e11] overflow-y-auto p-3 space-y-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                Framework Ecosystems
              </h3>
              {FRAMEWORK_GUIDES.map((fw) => {
                const isSelected = fw.id === currentFramework.id;
                return (
                  <button
                    key={fw.id}
                    onClick={() => {
                      setSelectedFrameworkId(fw.id);
                      setShowFrameworkSolution(false);
                    }}
                    className={`w-full p-2.5 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#1e1e24] border border-neutral-700 text-white'
                        : 'hover:bg-neutral-900/60 text-neutral-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">{fw.name}</span>
                    </div>
                    <span className="text-[10px] text-sky-400">{fw.category}</span>
                    <span className="text-[10px] text-neutral-500 line-clamp-1">{fw.tagline}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Framework Deep Dive */}
            <div className="flex-1 flex flex-col bg-[#121214] overflow-hidden">
              {/* Framework Header & Sub-Tabs */}
              <div className="px-6 py-3 border-b border-neutral-800 bg-[#16161a] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{currentFramework.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium">
                      {currentFramework.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{currentFramework.tagline}</p>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                  <button
                    onClick={() => setFrameworkSubTab('architecture')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      frameworkSubTab === 'architecture'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Under The Hood
                  </button>
                  <button
                    onClick={() => setFrameworkSubTab('design-guide')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      frameworkSubTab === 'design-guide'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Project Design Guide
                  </button>
                  <button
                    onClick={() => setFrameworkSubTab('snippets')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      frameworkSubTab === 'snippets'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Production Code
                  </button>
                  <button
                    onClick={() => setFrameworkSubTab('challenge')}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      frameworkSubTab === 'challenge'
                        ? 'bg-neutral-800 text-emerald-400'
                        : 'text-neutral-400 hover:text-emerald-300'
                    }`}
                  >
                    Framework Challenge
                  </button>
                </div>
              </div>

              {/* Sub-tab body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {frameworkSubTab === 'architecture' && (
                  <div className="space-y-6 max-w-4xl">
                    {/* Mental Model */}
                    <div className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4" />
                        <span>The Intuitive Mental Model</span>
                      </div>
                      <p className="text-sm text-neutral-200 leading-relaxed">
                        {currentFramework.howItWorksUnderTheHood.mentalModel}
                      </p>
                    </div>

                    {/* Architecture Diagram */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Architectural Data Flow
                      </div>
                      <pre className="p-4 bg-neutral-950 rounded-lg font-mono text-xs text-sky-300 border border-neutral-800 overflow-x-auto leading-relaxed">
                        {currentFramework.howItWorksUnderTheHood.diagram}
                      </pre>
                    </div>

                    {/* Core Concepts */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Internals Explained (Plain English vs Under The Hood)
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {currentFramework.howItWorksUnderTheHood.coreConcepts.map((c, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-1.5"
                          >
                            <h4 className="text-sm font-semibold text-white">{c.concept}</h4>
                            <div className="text-xs text-amber-300/90">
                              <span className="font-semibold text-neutral-400">In plain English: </span>
                              {c.plainEnglish}
                            </div>
                            <div className="text-xs text-neutral-300">
                              <span className="font-semibold text-neutral-400">Under the hood: </span>
                              {c.underTheHood}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Execution Lifecycle */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Execution Lifecycle (Step-by-Step)
                      </div>
                      <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs text-neutral-300 font-mono">
                        {currentFramework.howItWorksUnderTheHood.executionSteps.map((step, sIdx) => (
                          <div key={sIdx} className="leading-relaxed">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {frameworkSubTab === 'design-guide' && (
                  <div className="space-y-6 max-w-4xl">
                    {/* Recommended Folder Layout */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                        <FolderTree className="w-4 h-4 text-amber-400" />
                        <span>Production Project Directory & Module Layout</span>
                      </div>
                      <pre className="p-4 bg-neutral-950 rounded-lg font-mono text-xs text-emerald-400 border border-neutral-800 overflow-x-auto leading-relaxed">
                        {currentFramework.projectDesignGuide.recommendedLayout}
                      </pre>
                    </div>

                    {/* Architectural Philosophy */}
                    <div className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        Architectural Design Rule of Thumb
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                        {currentFramework.projectDesignGuide.architecturalPhilosophy}
                      </p>
                    </div>

                    {/* Patterns & Idioms */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Core Design Patterns in this Framework
                      </div>
                      {currentFramework.projectDesignGuide.patterns.map((pat, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-amber-400">{pat.name}</h4>
                          </div>
                          <p className="text-xs text-neutral-300">{pat.whyUseIt}</p>
                          <pre className="p-3 bg-neutral-950 rounded font-mono text-xs text-neutral-200 border border-neutral-800 overflow-x-auto">
                            {pat.codeExample}
                          </pre>
                        </div>
                      ))}
                    </div>

                    {/* Advice Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs">
                        <div className="font-semibold text-neutral-200">State Management</div>
                        <p className="text-neutral-400 leading-relaxed">
                          {currentFramework.projectDesignGuide.stateManagement}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs">
                        <div className="font-semibold text-neutral-200">Error Handling</div>
                        <p className="text-neutral-400 leading-relaxed">
                          {currentFramework.projectDesignGuide.errorHandlingAdvice}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1 text-xs">
                        <div className="font-semibold text-neutral-200">Testing Strategy</div>
                        <p className="text-neutral-400 leading-relaxed">
                          {currentFramework.projectDesignGuide.testingAdvice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {frameworkSubTab === 'snippets' && (
                  <div className="space-y-4 max-w-4xl">
                    <p className="text-xs text-neutral-400">
                      Production idioms ready to run or copy into your projects:
                    </p>
                    {currentFramework.productionSnippets.map((snippet, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden"
                      >
                        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white">{snippet.title}</span>
                            <p className="text-[11px] text-neutral-400">{snippet.purpose}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCode(snippet.title, snippet.code)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors cursor-pointer"
                            >
                              {copiedCodeTitle === snippet.title ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                onLoadExerciseToEditor(snippet.code);
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded text-xs transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>Load in Editor</span>
                            </button>
                          </div>
                        </div>
                        <pre className="p-4 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                          {snippet.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {frameworkSubTab === 'challenge' && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-neutral-100">
                          {currentFramework.challenge.title}
                        </h3>
                        <span className="text-xs font-semibold text-emerald-400">
                          Hands-On Framework Implementation
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {currentFramework.challenge.description}
                      </p>

                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                          Requirements:
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-neutral-300">
                          {currentFramework.challenge.requirements.map((req, rIdx) => (
                            <li key={rIdx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          onLoadExerciseToEditor(currentFramework.challenge.starterCode);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Load Challenge into Playground</span>
                      </button>

                      <button
                        onClick={() => setShowFrameworkSolution(!showFrameworkSolution)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showFrameworkSolution ? 'Hide Solution' : 'View Reference Solution'}</span>
                      </button>
                    </div>

                    {showFrameworkSolution && (
                      <div className="p-4 rounded-lg bg-black/80 border border-neutral-800 space-y-2">
                        <div className="text-xs font-semibold text-amber-400">
                          Reference Solution Implementation:
                        </div>
                        <pre className="p-3 bg-neutral-950 rounded font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
                          {currentFramework.challenge.solutionCode}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: FULL PROJECT CAPSTONES & INCUBATOR            */}
        {/* ======================================================== */}
        {section === 'capstones' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Capstone Selector */}
            <div className="w-72 shrink-0 border-r border-neutral-800 bg-[#0e0e11] overflow-y-auto p-3 space-y-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
                Production Capstone Projects
              </h3>
              {CAPSTONE_PROJECTS.map((proj) => {
                const isSelected = proj.id === currentProject.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full p-2.5 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#1e1e24] border border-neutral-700 text-white'
                        : 'hover:bg-neutral-900/60 text-neutral-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">{proj.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-amber-400">{proj.difficulty}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400">{proj.estimatedHours}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 line-clamp-1">{proj.description}</span>
                  </button>
                );
              })}

              <div className="pt-4 px-1">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Additional Project Ideas
                </h4>
                <div className="space-y-2 text-xs text-neutral-400">
                  <div className="p-2 rounded bg-neutral-900/40 border border-neutral-800/80">
                    <span className="font-semibold text-neutral-300">Distributed Task Queue</span>
                    <p className="text-[11px] text-neutral-500">Persistent job broker with worker retries and dead-letter queues.</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-900/40 border border-neutral-800/80">
                    <span className="font-semibold text-neutral-300">Git Clone (minigit)</span>
                    <p className="text-[11px] text-neutral-500">Blob storage, tree hashing, commit graphs, and packfile compression.</p>
                  </div>
                  <div className="p-2 rounded bg-neutral-900/40 border border-neutral-800/80">
                    <span className="font-semibold text-neutral-300">Unix Shell (ferris-sh)</span>
                    <p className="text-[11px] text-neutral-500">Process forking, pipe redirection (|), and signal handling.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Project Blueprint & 1-Click Loader */}
            <div className="flex-1 flex flex-col bg-[#121214] overflow-hidden">
              {/* Project Header */}
              <div className="px-6 py-4 border-b border-neutral-800 bg-[#16161a] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{currentProject.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      {currentProject.difficulty}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                      Est: {currentProject.estimatedHours}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1 max-w-2xl">{currentProject.description}</p>
                </div>

                {/* 1-CLICK LOAD INTO WORKSPACE */}
                <button
                  onClick={() => onLoadProjectWorkspace(currentProject.starterWorkspace)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#DE3804] to-amber-600 hover:from-[#DE3804]/90 hover:to-amber-500 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-lg hover:shadow-orange-950/50 transform hover:-translate-y-0.5"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Load Full Multi-File Project into Workspace</span>
                </button>
              </div>

              {/* Project Blueprint Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
                {/* Real World Impact */}
                <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Real World Production Use
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                    {currentProject.realWorldImpact}
                  </p>
                </div>

                {/* Architecture Diagram */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    System Architecture & Component Data Flow
                  </div>
                  <pre className="p-4 bg-neutral-950 rounded-lg font-mono text-xs text-sky-300 border border-neutral-800 overflow-x-auto leading-relaxed">
                    {currentProject.architectureDiagram}
                  </pre>
                </div>

                {/* Multi-File Module Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Multi-File Workspace Layout ({currentProject.starterWorkspace.length} Files)
                  </div>
                  <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-neutral-900 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                        <tr>
                          <th className="p-2.5">File Path</th>
                          <th className="p-2.5">Architectural Role</th>
                          <th className="p-2.5">Key Types & Functions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900 text-neutral-300">
                        {currentProject.moduleBreakdown.map((mod, mIdx) => (
                          <tr key={mIdx}>
                            <td className="p-2.5 font-mono text-emerald-400 font-medium">{mod.path}</td>
                            <td className="p-2.5 text-neutral-300">{mod.role}</td>
                            <td className="p-2.5 font-mono text-neutral-400 text-[11px]">{mod.keyTypes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Milestones Roadmap */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Implementation Roadmap (Step-by-Step Milestones)
                  </div>
                  <div className="space-y-3">
                    {currentProject.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                            {m.step}
                          </span>
                          <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                        </div>
                        <p className="text-xs text-neutral-300">{m.objective}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-neutral-400 pl-1">
                          {m.keyTasks.map((task, tIdx) => (
                            <li key={tIdx}>{task}</li>
                          ))}
                        </ul>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>ProTip: {m.proTip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traps & Pitfalls */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Gotchas & Rust Traps to Avoid</span>
                  </div>
                  <div className="space-y-2">
                    {currentProject.pitfallsToAvoid.map((pitfall, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs space-y-1"
                      >
                        <div className="font-semibold text-rose-300">{pitfall.trap}</div>
                        <p className="text-neutral-400">{pitfall.explanation}</p>
                        <div className="text-emerald-400">
                          <span className="font-medium text-neutral-300">Solution: </span>
                          {pitfall.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 4: BOX SIZES & MEMORY SIMULATOR                  */}
        {/* ======================================================== */}
        {section === 'memory-explorer' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[#121214]">
            <TypeMemoryExplorer />
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 5: DSA IN RUST (MEMORY MODELS & ALGORITHMS)      */}
        {/* ======================================================== */}
        {section === 'dsa' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left DSA Topics Sidebar */}
            <div className="w-80 shrink-0 border-r border-neutral-800 bg-[#0e0e11] overflow-y-auto p-3 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2 flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-amber-500" />
                <span>DSA Architecture Topics</span>
              </div>

              {DSA_TOPICS.map((topic) => {
                const isSelected = topic.id === currentDsa.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedDsaId(topic.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1f26] border-orange-500/50 shadow-sm'
                        : 'bg-neutral-900/40 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-neutral-100 line-clamp-1 mb-1">
                      {topic.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-neutral-800 text-neutral-300">
                        {topic.difficulty}
                      </span>
                      <span className="text-[10px] text-orange-400/90 font-mono truncate">
                        {topic.rustParadigm.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right DSA Topic Detail */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#121214]">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    {currentDsa.rustParadigm}
                  </div>
                  <h3 className="text-lg font-bold text-white">{currentDsa.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(currentDsa.title, currentDsa.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedCodeTitle === currentDsa.title ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCodeTitle === currentDsa.title ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onLoadExerciseToEditor(currentDsa.code);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load into Playground</span>
                  </button>
                </div>
              </div>

              {/* Complexity cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Access / Search</div>
                  <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                    {currentDsa.timeComplexity.search || currentDsa.timeComplexity.access || 'O(n)'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Insertion</div>
                  <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                    {currentDsa.timeComplexity.insertion || 'O(1)'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Deletion</div>
                  <div className="text-sm font-mono font-bold text-neutral-100 mt-0.5">
                    {currentDsa.timeComplexity.deletion || 'O(1)'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Space</div>
                  <div className="text-sm font-mono font-bold text-orange-400 mt-0.5">
                    {currentDsa.spaceComplexity}
                  </div>
                </div>
              </div>

              {/* The Borrow Checker Dilemma */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-neutral-300">
                <div className="flex items-center gap-2 mb-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>The Borrow Checker Dilemma in Rust</span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-300">
                  {currentDsa.whyTrickyInRust}
                </p>
              </div>

              {/* Memory diagram */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Memory Architecture Diagram</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Stack ↔ Heap Allocation</span>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 border border-neutral-800/80 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                  {currentDsa.memoryDiagram.trim()}
                </pre>
              </div>

              {/* Principles */}
              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Idiomatic Rust Architecture
                </h4>
                <ul className="space-y-1.5 text-xs text-neutral-300">
                  {currentDsa.conceptExplanation.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Runnable code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>Tested Production Implementation</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Tested with `#[test]` assertions</span>
                </div>
                <pre className="p-4 rounded-xl border border-neutral-800 bg-[#0d1117] text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed max-h-80">
                  {currentDsa.code}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
