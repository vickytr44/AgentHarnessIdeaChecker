export type SubAgentRole =
  | "persona_generator"
  | "focus_group_orchestrator"
  | "viability_evaluator";

export interface SubagentDelegation {
  id: string;
  sub_agent: string;
  task: string;
  status: "running" | "completed" | "failed";
  result?: string;
  timestamp?: string;
}

export interface DelegationLogProps {
  delegations: SubagentDelegation[];
  isRunning?: boolean;
  onClear?: () => void;
}

export interface SubAgentMeta {
  role: SubAgentRole;
  label: string;
  shortLabel: string;
  emoji: string;
  color: {
    bg: string;
    border: string;
    text: string;
    activeBg: string;
    badgeBg: string;
    badgeBorder: string;
  };
  description: string;
}

export interface ParsedPersona {
  id: string;
  name: string;
  role: string;
  demographics: string;
  goals: string;
  painPoints: string;
  keyNeeds: string;
  weightage: number;
  weightageRationale?: string;
}

export interface ParsedPersonaAnalysis {
  idea?: string;
  summary?: string;
  personas: ParsedPersona[];
  totalWeightage?: number;
  recommendation?: string;
}

export interface ParsedFocusGroupEvaluation {
  personaName: string;
  role: string;
  weightage?: number;
  score: number;
  weightedContribution?: string;
  verdict: string;
}

export interface ParsedTranscriptItem {
  speaker: string;
  role: string;
  roundTitle: string;
  content: string;
}

export interface ParsedFocusGroupAnalysis {
  overallScore?: number;
  viabilityStatus?: string;
  executiveSummary?: string;
  consensusPoints: string[];
  polarizingPoints: string[];
  recommendedPivots: string[];
  evaluations: ParsedFocusGroupEvaluation[];
  transcript: ParsedTranscriptItem[];
}
