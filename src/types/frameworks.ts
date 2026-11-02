import { DifficultyLevel, ExerciseProblem } from './curriculum';
import { WorkspaceFile } from './rust';

export type FrameworkCategory =
  | 'Web & APIs'
  | 'Async & Networking'
  | 'Game Engines & Simulation'
  | 'CLI & Terminal'
  | 'Desktop & GUI'
  | 'Cloud & Enterprise';

export interface FrameworkGuide {
  id: string;
  name: string;
  category: FrameworkCategory;
  badge: string;
  crates: string[];
  tagline: string;
  summary: string;
  howItWorksUnderTheHood: {
    diagram: string;
    mentalModel: string;
    coreConcepts: {
      concept: string;
      plainEnglish: string;
      underTheHood: string;
    }[];
    executionSteps: string[];
  };
  projectDesignGuide: {
    recommendedLayout: string;
    architecturalPhilosophy: string;
    patterns: {
      name: string;
      whyUseIt: string;
      codeExample: string;
    }[];
    stateManagement: string;
    errorHandlingAdvice: string;
    testingAdvice: string;
  };
  productionSnippets: {
    title: string;
    purpose: string;
    code: string;
  }[];
  challenge: ExerciseProblem;
}

export interface CapstoneProject {
  id: string;
  title: string;
  category: string;
  difficulty: DifficultyLevel;
  estimatedHours: string;
  description: string;
  realWorldImpact: string;
  crates: string[];
  architectureDiagram: string;
  moduleBreakdown: {
    path: string;
    role: string;
    keyTypes: string;
  }[];
  milestones: {
    step: number;
    title: string;
    objective: string;
    keyTasks: string[];
    proTip: string;
  }[];
  pitfallsToAvoid: {
    trap: string;
    explanation: string;
    solution: string;
  }[];
  starterWorkspace: WorkspaceFile[];
}
