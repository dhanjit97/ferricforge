export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Systems & Engines';

export type LearningStage = 1 | 2 | 3 | 4 | 5;

export const LEARNING_STAGES: Record<LearningStage, { title: string; description: string }> = {
  1: {
    title: 'Programming from Zero',
    description: 'Learn what programming is, how computers execute instructions, and write your first Rust programs.',
  },
  2: {
    title: 'Understanding Rust',
    description: 'Master Rust fundamentals: ownership, borrowing, structs, enums, Option/Result, and error handling.',
  },
  3: {
    title: 'Intermediate Rust',
    description: 'Go deeper with generics, traits, lifetimes, closures, iterators, smart pointers, modules, and concurrency.',
  },
  4: {
    title: 'Advanced Rust',
    description: 'Explore async Rust, Tokio, macros, unsafe Rust, and performance optimization.',
  },
  5: {
    title: 'Real-World Development',
    description: 'Build production applications with Axum, Tokio, Bevy, Ratatui, Tauri, and CLI tools.',
  },
};

export interface ExerciseHint {
  level: number;
  title: string;
  content: string;
}

export interface ExerciseProblem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  starterCode: string;
  solutionCode: string;
  hints: ExerciseHint[];
  verificationCriteria: string;
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CurriculumLesson {
  id: string;
  trackId: string;
  trackTitle: string;
  stage: LearningStage;
  title: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  xpReward: number;
  overview: string;
  guideContent: string;
  walkthroughCode: string;
  walkthroughExplanations: {
    lineRange: string;
    headline: string;
    explanation: string;
  }[];
  exercise: ExerciseProblem;
  knowledgeCheck?: KnowledgeCheckQuestion[];
}

export interface UserProgress {
  totalXp: number;
  level: number;
  levelTitle: string;
  completedLessonIds: string[];
  viewedLessonIds: string[];
  knowledgeCheckResults: Record<string, boolean[]>; // lessonId -> [q1Passed, q2Passed, ...]
  conceptMastery: Record<string, boolean>; // conceptId -> mastered
  unlockedHintIndices: Record<string, number[]>; // lessonId -> unlocked hint levels
  achievements: {
    id: string;
    title: string;
    description: string;
    unlockedAt?: string;
  }[];
}
