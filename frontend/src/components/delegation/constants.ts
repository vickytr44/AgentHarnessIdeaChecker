import type { SubAgentRole, SubAgentMeta } from "@/types/delegation";

export const SUB_AGENTS: Record<SubAgentRole, SubAgentMeta> = {
  persona_generator: {
    role: "persona_generator",
    label: "Persona Synthesizer",
    shortLabel: "Personas",
    emoji: "👥",
    color: {
      bg: "#f0fdf4",
      border: "#86efac",
      text: "#15803d",
      activeBg: "#dcfce7",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
    },
    description: "Synthesizes audience archetypes, pain points & market weightages",
  },
  focus_group_orchestrator: {
    role: "focus_group_orchestrator",
    label: "Focus Group Orchestrator",
    shortLabel: "Deliberation",
    emoji: "🎙️",
    color: {
      bg: "#eff6ff",
      border: "#93c5fd",
      text: "#1d4ed8",
      activeBg: "#dbeafe",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
    },
    description: "Spawns dynamic in-character agents for 2-3 round debate",
  },
  viability_evaluator: {
    role: "viability_evaluator",
    label: "Viability Evaluator",
    shortLabel: "Scorecard",
    emoji: "📊",
    color: {
      bg: "#faf5ff",
      border: "#d8b4fe",
      text: "#7e22ce",
      activeBg: "#f3e8ff",
      badgeBg: "#faf5ff",
      badgeBorder: "#e9d5ff",
    },
    description: "Computes weighted viability index & strategic pivots",
  },
};

export const PIPELINE_ROLES: SubAgentRole[] = [
  "persona_generator",
  "focus_group_orchestrator",
  "viability_evaluator",
];
