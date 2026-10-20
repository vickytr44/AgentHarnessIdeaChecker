"use client";

import React, { useState, useEffect, useMemo } from "react";

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

interface SubAgentMeta {
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

const SUB_AGENTS: Record<SubAgentRole, SubAgentMeta> = {
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

const PIPELINE_ROLES: SubAgentRole[] = [
  "persona_generator",
  "focus_group_orchestrator",
  "viability_evaluator",
];

// Helper to clean escaped strings and render Markdown
function cleanContent(raw?: string): string {
  if (!raw) return "";
  let str = raw.trim();
  if (str.startsWith('"') && str.endsWith('"') && str.includes("\\n")) {
    try {
      str = JSON.parse(str);
    } catch {
      str = str.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  } else {
    str = str.replace(/\\n/g, "\n");
  }
  return str;
}

// Markdown Formatter Component
function FormattedContent({ text }: { text: string }) {
  const cleaned = cleanContent(text);
  const lines = cleaned.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", lineHeight: "1.65", color: "#1e293b" }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: "6px" }} />;
        }

        // H1
        if (trimmed.startsWith("# ")) {
          return (
            <h2
              key={idx}
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "14px 0 6px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "6px",
              }}
            >
              {trimmed.slice(2)}
            </h2>
          );
        }

        // H2
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={idx}
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#1e293b",
                margin: "12px 0 4px",
              }}
            >
              {trimmed.slice(3)}
            </h3>
          );
        }

        // H3
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={idx}
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#334155",
                margin: "8px 0 2px",
              }}
            >
              {trimmed.slice(4)}
            </h4>
          );
        }

        // Bullet points
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.slice(2);
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                paddingLeft: "6px",
              }}
            >
              <span style={{ color: "#3b82f6", fontWeight: "bold" }}>•</span>
              <div>{renderFormattedText(content)}</div>
            </div>
          );
        }

        // Numbered list (e.g. "1. ")
        const matchNumber = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (matchNumber) {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                paddingLeft: "4px",
                marginTop: "2px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {matchNumber[1]}
              </span>
              <div>{renderFormattedText(matchNumber[2])}</div>
            </div>
          );
        }

        // Regular paragraph
        return <div key={idx}>{renderFormattedText(trimmed)}</div>;
      })}
    </div>
  );
}

// Inline bold and code renderer
function renderFormattedText(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = str;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`(.*?)`/);

    let firstMatchIndex = -1;
    let matchType: "bold" | "code" | null = null;
    let matchText = "";
    let matchContent = "";

    if (boldMatch && boldMatch.index !== undefined) {
      firstMatchIndex = boldMatch.index;
      matchType = "bold";
      matchText = boldMatch[0];
      matchContent = boldMatch[1];
    }

    if (codeMatch && codeMatch.index !== undefined) {
      if (firstMatchIndex === -1 || codeMatch.index < firstMatchIndex) {
        firstMatchIndex = codeMatch.index;
        matchType = "code";
        matchText = codeMatch[0];
        matchContent = codeMatch[1];
      }
    }

    if (firstMatchIndex === -1) {
      parts.push(remaining);
      break;
    }

    if (firstMatchIndex > 0) {
      parts.push(remaining.substring(0, firstMatchIndex));
    }

    if (matchType === "bold") {
      parts.push(
        <strong key={keyIdx++} style={{ fontWeight: 650, color: "#0f172a" }}>
          {matchContent}
        </strong>
      );
    } else if (matchType === "code") {
      parts.push(
        <code
          key={keyIdx++}
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            background: "#f1f5f9",
            color: "#0f172a",
            padding: "2px 5px",
            borderRadius: "4px",
            border: "1px solid #e2e8f0",
          }}
        >
          {matchContent}
        </code>
      );
    }

    remaining = remaining.substring(firstMatchIndex + matchText.length);
  }

  return parts;
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

// Parses structured persona JSON and market analysis out of persona generator results
function parsePersonaData(raw?: string): ParsedPersonaAnalysis | null {
  if (!raw) return null;
  const cleaned = cleanContent(raw);

  let jsonString: string | null = null;
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1];
  } else {
    const braceMatch = cleaned.match(/\{[\s\S]*?"personas"[\s\S]*?\}/i);
    if (braceMatch) {
      jsonString = braceMatch[0];
    } else if (cleaned.trim().startsWith("{") && cleaned.trim().endsWith("}")) {
      jsonString = cleaned.trim();
    }
  }

  if (!jsonString) return null;

  try {
    const data = JSON.parse(jsonString);
    const rawPersonas = data.personas || data.Personas || data.PERSONAS;
    if (!Array.isArray(rawPersonas) || rawPersonas.length === 0) {
      return null;
    }

    const personas: ParsedPersona[] = rawPersonas.map((p: any, idx: number) => {
      let weight = p.weightage ?? p.Weightage ?? p.weight ?? p.Weight ?? 0;
      if (typeof weight === "string") {
        weight = parseFloat(weight.replace("%", "").trim()) || 0;
      }
      return {
        id: p.id || p.Id || `persona-${idx + 1}`,
        name: p.name || p.Name || `Persona ${idx + 1}`,
        role: p.role || p.Role || "Target Stakeholder",
        demographics: p.demographics || p.Demographics || "",
        goals: p.goals || p.Goals || "",
        painPoints: p.painPoints || p.PainPoints || p.pain_points || "",
        keyNeeds: p.keyNeeds || p.KeyNeeds || p.key_needs || "",
        weightage: weight,
        weightageRationale: p.weightageRationale || p.WeightageRationale || p.weightage_rationale || "",
      };
    });

    let summary = data.summary || data.Summary || "";
    if (!summary && codeBlockMatch && codeBlockMatch.index) {
      const preceding = cleaned.substring(0, codeBlockMatch.index).trim();
      summary = preceding.replace(/^#+\s*(Executive Summary|Target Market Analysis)\s*/i, "").trim();
    }

    return {
      idea: data.idea || data.Idea || "",
      summary,
      personas,
      totalWeightage:
        data.totalWeightage ||
        data.TotalWeightage ||
        personas.reduce((acc, p) => acc + (p.weightage || 0), 0),
      recommendation: data.recommendation || data.Recommendation || "",
    };
  } catch {
    return null;
  }
}

// Rich Tabular UI for Persona Synthesizer
function PersonaTableView({
  analysis,
  rawText,
}: {
  analysis: ParsedPersonaAnalysis;
  rawText: string;
}) {
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Top Controls Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
            }}
          >
            👥 {analysis.personas.length} Target Personas
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
            }}
          >
            📊 {analysis.totalWeightage || 100}% Market Coverage
          </span>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "2px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setViewMode("table")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "table" ? 700 : 500,
              background: viewMode === "table" ? "#ffffff" : "transparent",
              color: viewMode === "table" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📊</span> Tabular Matrix
          </button>
          <button
            onClick={() => setViewMode("raw")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "raw" ? 700 : 500,
              background: viewMode === "raw" ? "#ffffff" : "transparent",
              color: viewMode === "raw" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "raw" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📄</span> Full Report
          </button>
        </div>
      </div>

      {viewMode === "raw" ? (
        <FormattedContent text={rawText} />
      ) : (
        <>
          {/* Executive Summary Card */}
          {analysis.summary && (
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                border: "1px solid #bbf7d0",
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                    }}
                  >
                    🎯
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#166534",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Target Market Analysis
                    </h4>
                    <span style={{ fontSize: "11px", color: "#15803d" }}>
                      Executive Landscape & Adoption Dynamics
                    </span>
                  </div>
                </div>

                {analysis.idea && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#15803d",
                      background: "#dcfce7",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      maxWidth: "280px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={analysis.idea}
                  >
                    Idea: {analysis.idea}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.65",
                  color: "#1e293b",
                  whiteSpace: "pre-line",
                }}
              >
                {analysis.summary}
              </div>

              {analysis.recommendation && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#ffffff",
                    border: "1px solid #86efac",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>💡</span>
                  <div style={{ fontSize: "12px", color: "#166534", lineHeight: "1.5" }}>
                    <strong style={{ color: "#14532d" }}>Strategic Recommendation: </strong>
                    {analysis.recommendation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Personas Tabular Matrix */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Audience Personas Matrix
              </h4>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Weights sum to 100%
              </span>
            </div>

            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "750px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                        width: "22%",
                      }}
                    >
                      Persona & Role
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                        width: "18%",
                      }}
                    >
                      Market Weightage
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                        width: "18%",
                      }}
                    >
                      Demographics
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                        width: "22%",
                      }}
                    >
                      Goals & Needs
                    </th>
                    <th
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                        width: "20%",
                      }}
                    >
                      Critical Pain Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.personas.map((persona, idx) => (
                    <tr
                      key={persona.id || idx}
                      style={{
                        borderBottom:
                          idx === analysis.personas.length - 1
                            ? "none"
                            : "1px solid #f1f5f9",
                        verticalAlign: "top",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Column 1: Persona & Role */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#dcfce7",
                              border: "1px solid #bbf7d0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            👤
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                              {persona.name}
                            </div>
                            <div
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                padding: "2px 8px",
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 500,
                                color: "#334155",
                              }}
                            >
                              {persona.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Weightage & Rationale */}
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#047857",
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            {persona.weightage}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "140px",
                            height: "6px",
                            background: "#e2e8f0",
                            borderRadius: "3px",
                            overflow: "hidden",
                            margin: "8px 0 6px",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(persona.weightage, 100)}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                        {persona.weightageRationale && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#64748b",
                              lineHeight: "1.4",
                              fontStyle: "italic",
                            }}
                          >
                            {persona.weightageRationale}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Demographics */}
                      <td style={{ padding: "14px", color: "#334155", lineHeight: "1.5" }}>
                        {persona.demographics ? (
                          <div
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              background: "#fafbfc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              fontSize: "11px",
                              color: "#475569",
                              lineHeight: "1.4",
                            }}
                          >
                            {persona.demographics}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>—</span>
                        )}
                      </td>

                      {/* Column 4: Goals & Needs */}
                      <td style={{ padding: "14px", lineHeight: "1.5" }}>
                        {persona.goals && (
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ fontWeight: 650, color: "#166534" }}>🎯 Goal: </span>
                            <span style={{ color: "#1e293b" }}>{persona.goals}</span>
                          </div>
                        )}
                        {persona.keyNeeds && (
                          <div>
                            <span style={{ fontWeight: 650, color: "#0369a1" }}>✨ Need: </span>
                            <span style={{ color: "#1e293b" }}>{persona.keyNeeds}</span>
                          </div>
                        )}
                        {!persona.goals && !persona.keyNeeds && (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>—</span>
                        )}
                      </td>

                      {/* Column 5: Pain Points */}
                      <td style={{ padding: "14px" }}>
                        {persona.painPoints ? (
                          <div
                            style={{
                              padding: "6px 10px",
                              background: "#fff7ed",
                              border: "1px solid #fed7aa",
                              borderRadius: "8px",
                              fontSize: "11px",
                              color: "#9a3412",
                              lineHeight: "1.45",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>⚠️ Pain Points: </span>
                            {persona.painPoints}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
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

function parseFocusGroupData(raw?: string): ParsedFocusGroupAnalysis | null {
  if (!raw) return null;
  const cleaned = cleanContent(raw);

  const evaluations: ParsedFocusGroupEvaluation[] = [];
  const transcript: ParsedTranscriptItem[] = [];
  const consensusPoints: string[] = [];
  const polarizingPoints: string[] = [];
  const recommendedPivots: string[] = [];
  let executiveSummary = "";
  let overallScore: number | undefined = undefined;
  let viabilityStatus: string | undefined = undefined;

  // 1. Overall Viability Index & Status
  const overallMatch = cleaned.match(
    /Overall Viability Index:\s*\*\*(\d+(?:\.\d+)?)\s*\/\s*100\*\*\s*(?:—|-)\s*\*?([^*\n]+)\*?/i
  );
  if (overallMatch) {
    overallScore = parseFloat(overallMatch[1]);
    viabilityStatus = overallMatch[2].trim();
  }

  // 2. Parse Markdown Table for Persona Score Breakdown
  const lines = cleaned.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const parts = trimmed
        .split("|")
        .map((p) => p.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (parts.length >= 4) {
        const first = parts[0].toLowerCase();
        if (
          first.includes("persona") ||
          first.includes("---") ||
          first.startsWith(":")
        ) {
          continue;
        }

        const name = parts[0].replace(/\*\*/g, "").trim();
        const role = parts[1] || "";
        const weightStr = parts[2] ? parts[2].replace("%", "").trim() : "";
        const weight = parseFloat(weightStr) || undefined;

        const scoreMatch = parts[3].match(/(\d+(?:\.\d+)?)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;

        const weightedContribution =
          parts.length >= 5 ? parts[4].replace(/\*\*/g, "").trim() : undefined;
        const verdict =
          parts.length >= 6
            ? parts[5].replace(/^["“']|["”']$/g, "").trim()
            : "";

        if (name && scoreMatch) {
          evaluations.push({
            personaName: name,
            role,
            weightage: weight,
            score,
            weightedContribution,
            verdict,
          });
        }
      }
    }
  }

  // Fallback: Check for bullet items (e.g. • Alex: Score 8.0/10 - "Verdict")
  if (evaluations.length === 0) {
    const bulletRegex =
      /•\s*([^:]+?)(?:\s*\(([^)]+)\))?:\s*Score\s*(\d+(?:\.\d+)?)\/10\s*-\s*["“']?([^"\n]+)["”']?/gi;
    let bMatch;
    while ((bMatch = bulletRegex.exec(cleaned)) !== null) {
      const name = bMatch[1].trim();
      const role = bMatch[2] ? bMatch[2].trim() : "Participant";
      const score = parseFloat(bMatch[3]) || 5.0;
      const verdict = bMatch[4] ? bMatch[4].trim() : "";
      evaluations.push({
        personaName: name,
        role,
        score,
        verdict,
      });
    }
  }

  // 3. Extract Strategic Synthesis Sections
  const synthesisMatch = cleaned.match(
    /## Strategic Synthesis[^\n]*\n([\s\S]*?)(?=(?:---)|(?:### Focus Group Discussion Transcript)|$)/i
  );
  const synthText = synthesisMatch ? synthesisMatch[1] : cleaned;

  // Executive Assessment
  const execMatch = synthText.match(
    /(?:Executive Market Assessment|Executive Assessment|Executive Summary)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\*|\n\n##|\n\n###|Consensus|Polarizing|$))/i
  );
  if (execMatch) {
    executiveSummary = execMatch[1].trim().replace(/^[-*•]\s*/, "");
  }

  // Consensus Points
  const consensusMatch = synthText.match(
    /(?:Consensus Points?|Points of Agreement)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\n\n##|\n\n###|Polarizing|Core Conflicts|Pivots|$))/i
  );
  if (consensusMatch) {
    const cLines = consensusMatch[1].split("\n");
    for (const cl of cLines) {
      const cTrim = cl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (cTrim && cTrim.length > 5) {
        consensusPoints.push(cTrim);
      }
    }
  }

  // Polarizing Points
  const polarMatch = synthText.match(
    /(?:Polarizing Points?|Core Conflicts?|Key Disagreements?)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\n\n##|\n\n###|Product Pivots|Pivots|Recommendations|$))/i
  );
  if (polarMatch) {
    const pLines = polarMatch[1].split("\n");
    for (const pl of pLines) {
      const pTrim = pl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (pTrim && pTrim.length > 5) {
        polarizingPoints.push(pTrim);
      }
    }
  }

  // Recommended Pivots
  const pivotMatch = synthText.match(
    /(?:Actionable Product Pivots?|Recommended Pivots?|Key Pivots?)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\n\n##|\n\n###|---|$))/i
  );
  if (pivotMatch) {
    const pvLines = pivotMatch[1].split("\n");
    for (const pvl of pvLines) {
      const pvTrim = pvl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (pvTrim && pvTrim.length > 5) {
        recommendedPivots.push(pvTrim);
      }
    }
  }

  // 4. Extract Transcript Quotes
  const transcriptRegex =
    />\s*\*\*([^(>]+?)(?:\s*\(([^)]+)\))?\*\*\s*(?:—|-)\s*\*?([^*\n]+)\*?\s*\n([\s\S]*?)(?=(?:>\s*\*\*)|(?:---)|(?:$))/g;
  let tMatch;
  while ((tMatch = transcriptRegex.exec(cleaned)) !== null) {
    const speaker = tMatch[1].trim();
    const role = tMatch[2] ? tMatch[2].trim() : "Participant";
    const roundTitle = tMatch[3] ? tMatch[3].trim() : "Deliberation";
    const quoteContent = tMatch[4]
      .split("\n")
      .map((l) => l.replace(/^>\s?/, "").trim())
      .filter(Boolean)
      .join(" ");

    if (speaker && quoteContent) {
      transcript.push({
        speaker,
        role,
        roundTitle,
        content: quoteContent,
      });
    }
  }

  if (evaluations.length === 0 && transcript.length === 0) {
    return null;
  }

  return {
    overallScore,
    viabilityStatus,
    executiveSummary,
    consensusPoints: consensusPoints.slice(0, 4),
    polarizingPoints: polarizingPoints.slice(0, 4),
    recommendedPivots: recommendedPivots.slice(0, 4),
    evaluations,
    transcript,
  };
}

// Rich Tabular & Debate UI for Focus Group Orchestrator
function FocusGroupTableView({
  analysis,
  rawText,
}: {
  analysis: ParsedFocusGroupAnalysis;
  rawText: string;
}) {
  const [viewMode, setViewMode] = useState<"table" | "raw">("table");
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [isDebateExpanded, setIsDebateExpanded] = useState<boolean>(true);

  // Compute average score across participants
  const avgScore = useMemo(() => {
    if (analysis.evaluations.length === 0) return 0;
    const sum = analysis.evaluations.reduce((acc, e) => acc + e.score, 0);
    return sum / analysis.evaluations.length;
  }, [analysis.evaluations]);

  // Extract unique rounds from transcript
  const availableRounds = useMemo(() => {
    const set = new Set<string>();
    for (const t of analysis.transcript) {
      if (t.roundTitle) set.add(t.roundTitle);
    }
    return Array.from(set);
  }, [analysis.transcript]);

  // Filter transcript quotes
  const filteredTranscript = useMemo(() => {
    if (selectedRound === "all") return analysis.transcript;
    return analysis.transcript.filter((t) => t.roundTitle === selectedRound);
  }, [analysis.transcript, selectedRound]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            🎙️ {analysis.evaluations.length} Panel Participants
          </span>

          {avgScore > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: 700,
                background:
                  avgScore >= 7.5
                    ? "#f0fdf4"
                    : avgScore >= 5.0
                      ? "#fefce8"
                      : "#fef2f2",
                border: `1px solid ${avgScore >= 7.5
                    ? "#bbf7d0"
                    : avgScore >= 5.0
                      ? "#fef08a"
                      : "#fecaca"
                  }`,
                color:
                  avgScore >= 7.5
                    ? "#15803d"
                    : avgScore >= 5.0
                      ? "#a16207"
                      : "#b91c1c",
              }}
            >
              ⭐ {avgScore.toFixed(1)} / 10 Avg Score
            </span>
          )}

          {analysis.overallScore !== undefined && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: 700,
                background: "#faf5ff",
                border: "1px solid #e9d5ff",
                color: "#7e22ce",
              }}
            >
              🏆 Index: {analysis.overallScore} / 100
              {analysis.viabilityStatus ? ` (${analysis.viabilityStatus})` : ""}
            </span>
          )}

          {analysis.transcript.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: 650,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
              }}
            >
              💬 {analysis.transcript.length} Quotes
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "2px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setViewMode("table")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "table" ? 700 : 500,
              background: viewMode === "table" ? "#ffffff" : "transparent",
              color: viewMode === "table" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📊</span> Deliberation Matrix
          </button>
          <button
            onClick={() => setViewMode("raw")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "raw" ? 700 : 500,
              background: viewMode === "raw" ? "#ffffff" : "transparent",
              color: viewMode === "raw" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "raw" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📄</span> Full Report
          </button>
        </div>
      </div>

      {viewMode === "raw" ? (
        <FormattedContent text={rawText} />
      ) : (
        <>
          {/* Deliberation Pulse Summary Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
              border: "1px solid #bfdbfe",
              borderRadius: "14px",
              padding: "16px 20px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                  }}
                >
                  🎙️
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#1e40af",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Focus Group Deliberation Pulse
                  </h4>
                  <span style={{ fontSize: "11px", color: "#3b82f6" }}>
                    Multi-Persona Debate Dynamics & Panel Alignment
                  </span>
                </div>
              </div>
            </div>

            {analysis.executiveSummary && (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "13px",
                  lineHeight: "1.65",
                  color: "#1e293b",
                }}
              >
                {analysis.executiveSummary}
              </p>
            )}

            {/* Consensus & Polarization Side-by-Side Cards */}
            {(analysis.consensusPoints.length > 0 ||
              analysis.polarizingPoints.length > 0) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      analysis.consensusPoints.length > 0 &&
                        analysis.polarizingPoints.length > 0
                        ? "repeat(auto-fit, minmax(260px, 1fr))"
                        : "1fr",
                    gap: "12px",
                    marginTop: "12px",
                  }}
                >
                  {/* Consensus Card */}
                  {analysis.consensusPoints.length > 0 && (
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#15803d",
                        }}
                      >
                        <span>🤝</span> Points of Panel Consensus
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "16px",
                          fontSize: "12px",
                          color: "#166534",
                          lineHeight: "1.55",
                        }}
                      >
                        {analysis.consensusPoints.map((pt, idx) => (
                          <li key={idx} style={{ marginBottom: "4px" }}>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Polarizing Points Card */}
                  {analysis.polarizingPoints.length > 0 && (
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#9a3412",
                        }}
                      >
                        <span>⚡</span> Core Conflicts & Tension
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "16px",
                          fontSize: "12px",
                          color: "#c2410c",
                          lineHeight: "1.55",
                        }}
                      >
                        {analysis.polarizingPoints.map((pt, idx) => (
                          <li key={idx} style={{ marginBottom: "4px" }}>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            {/* Recommended Pivots */}
            {analysis.recommendedPivots.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 14px",
                  background: "#ffffff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "#4338ca",
                  }}
                >
                  <span>💡</span> Recommended Product Pivots
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "16px",
                    fontSize: "12px",
                    color: "#3730a3",
                    lineHeight: "1.55",
                  }}
                >
                  {analysis.recommendedPivots.map((piv, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      {piv}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Deliberation Verdict Matrix (Table) */}
          {analysis.evaluations.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Deliberation Verdict Matrix
                </h4>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Final Stances & Scores
                </span>
              </div>

              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#ffffff",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "750px",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "24%",
                        }}
                      >
                        Participant & Role
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "16%",
                        }}
                      >
                        Deliberation Score
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "18%",
                        }}
                      >
                        Influence & Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "42%",
                        }}
                      >
                        Final Stance & Verdict
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.evaluations.map((item, idx) => {
                      const isHigh = item.score >= 7.5;
                      const isMid = item.score >= 5.0 && item.score < 7.5;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom:
                              idx === analysis.evaluations.length - 1
                                ? "none"
                                : "1px solid #f1f5f9",
                            verticalAlign: "top",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Participant & Role */}
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "14px",
                                  flexShrink: 0,
                                }}
                              >
                                👤
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                                  {item.personaName}
                                </div>
                                <div
                                  style={{
                                    display: "inline-block",
                                    marginTop: "4px",
                                    padding: "2px 8px",
                                    background: "#f1f5f9",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    color: "#334155",
                                  }}
                                >
                                  {item.role}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Deliberation Score */}
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  width: "fit-content",
                                  background: isHigh
                                    ? "#dcfce7"
                                    : isMid
                                      ? "#fef3c7"
                                      : "#fee2e2",
                                  border: `1px solid ${isHigh
                                      ? "#bbf7d0"
                                      : isMid
                                        ? "#fde68a"
                                        : "#fecaca"
                                    }`,
                                  color: isHigh
                                    ? "#15803d"
                                    : isMid
                                      ? "#b45309"
                                      : "#b91c1c",
                                }}
                              >
                                {item.score.toFixed(1)} / 10
                              </span>
                              <span style={{ fontSize: "10px", color: "#64748b" }}>
                                {isHigh
                                  ? "🟢 High Support"
                                  : isMid
                                    ? "🟡 Conditional"
                                    : "🔴 Skeptical"}
                              </span>
                            </div>
                          </td>

                          {/* Influence & Weight */}
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {item.weightage !== undefined && (
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>
                                  {item.weightage}% weight
                                </div>
                              )}
                              {item.weightedContribution && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#0369a1",
                                    background: "#f0f9ff",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    width: "fit-content",
                                    border: "1px solid #bae6fd",
                                  }}
                                >
                                  {item.weightedContribution}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Final Stance & Verdict */}
                          <td style={{ padding: "14px", lineHeight: "1.5" }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontStyle: "italic",
                                color: "#0f172a",
                                background: "#fafbfc",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #f1f5f9",
                              }}
                            >
                              "{item.verdict}"
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive Round-by-Round Debate Feed */}
          {analysis.transcript.length > 0 && (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                background: "#ffffff",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
              }}
            >
              {/* Accordion Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  background: "#f8fafc",
                  borderBottom: isDebateExpanded ? "1px solid #e2e8f0" : "none",
                  cursor: "pointer",
                }}
                onClick={() => setIsDebateExpanded(!isDebateExpanded)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>💬</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    Round-by-Round Deliberation Debate
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#e2e8f0",
                      color: "#475569",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {filteredTranscript.length} contributions
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {isDebateExpanded ? "▲ Collapse" : "▼ Expand"}
                  </span>
                </div>
              </div>

              {/* Debate Body */}
              {isDebateExpanded && (
                <div style={{ padding: "16px 18px" }}>
                  {/* Round Filter Tabs */}
                  {availableRounds.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => setSelectedRound("all")}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "14px",
                          fontSize: "11px",
                          fontWeight: selectedRound === "all" ? 700 : 500,
                          background: selectedRound === "all" ? "#1e293b" : "#f1f5f9",
                          color: selectedRound === "all" ? "#ffffff" : "#475569",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        All Rounds ({analysis.transcript.length})
                      </button>
                      {availableRounds.map((rnd, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedRound(rnd)}
                          style={{
                            padding: "3px 10px",
                            borderRadius: "14px",
                            fontSize: "11px",
                            fontWeight: selectedRound === rnd ? 700 : 500,
                            background: selectedRound === rnd ? "#2563eb" : "#f1f5f9",
                            color: selectedRound === rnd ? "#ffffff" : "#475569",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {rnd}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Discussion Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filteredTranscript.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "13px",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          👤
                        </div>
                        <div
                          style={{
                            flex: 1,
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "10px 14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                                {item.speaker}
                              </strong>
                              {item.role && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    background: "#e2e8f0",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {item.role}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#2563eb",
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {item.roundTitle}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              lineHeight: "1.55",
                              color: "#334155",
                            }}
                          >
                            {renderFormattedText(item.content)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Rich Scorecard & Strategic Pivots UI for Viability Evaluator
function ViabilityScorecardView({
  analysis,
  rawText,
}: {
  analysis: ParsedFocusGroupAnalysis;
  rawText: string;
}) {
  const [viewMode, setViewMode] = useState<"scorecard" | "raw">("scorecard");

  const score =
    analysis.overallScore ??
    (analysis.evaluations.length > 0
      ? analysis.evaluations.reduce(
        (acc, e) =>
          acc + (e.score * 10 * ((e.weightage || 33.3) / 100)),
        0
      )
      : 70);

  const isHigh = score >= 75;
  const isMid = score >= 50 && score < 75;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#faf5ff",
              border: "1px solid #d8b4fe",
              color: "#7e22ce",
            }}
          >
            🏆 Viability Index: {score.toFixed(1)} / 100
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: 700,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#334155",
            }}
          >
            📊 {analysis.evaluations.length} Segments Weighted
          </span>
          {analysis.recommendedPivots.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: 650,
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                color: "#6d28d9",
              }}
            >
              🚀 {analysis.recommendedPivots.length} Strategic Pivots
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "2px",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setViewMode("scorecard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "scorecard" ? 700 : 500,
              background: viewMode === "scorecard" ? "#ffffff" : "transparent",
              color: viewMode === "scorecard" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "scorecard" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📊</span> Viability Scorecard
          </button>
          <button
            onClick={() => setViewMode("raw")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: viewMode === "raw" ? 700 : 500,
              background: viewMode === "raw" ? "#ffffff" : "transparent",
              color: viewMode === "raw" ? "#0f172a" : "#64748b",
              borderRadius: "6px",
              border: "none",
              boxShadow: viewMode === "raw" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>📄</span> Full Report
          </button>
        </div>
      </div>

      {viewMode === "raw" ? (
        <FormattedContent text={rawText} />
      ) : (
        <>
          {/* Executive Viability Hero Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)",
              border: "1px solid #d8b4fe",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(126, 34, 206, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: "#f3e8ff",
                    color: "#7e22ce",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "6px",
                  }}
                >
                  Final Strategic Evaluation
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "2.4rem",
                      fontWeight: 800,
                      color: isHigh ? "#15803d" : isMid ? "#b45309" : "#b91c1c",
                      letterSpacing: "-0.02em",
                      lineHeight: "1",
                    }}
                  >
                    {score.toFixed(1)}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#94a3b8" }}>
                    / 100
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: isHigh ? "#dcfce7" : isMid ? "#fef3c7" : "#fee2e2",
                    border: `1px solid ${isHigh ? "#86efac" : isMid ? "#fde68a" : "#fca5a5"}`,
                    color: isHigh ? "#15803d" : isMid ? "#b45309" : "#b91c1c",
                  }}
                >
                  {isHigh
                    ? "🟢 High Commercial Viability"
                    : isMid
                      ? "🟡 Conditional Viability (Pivots Required)"
                      : "🔴 High Risk / Unviable"}
                </span>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", textAlign: "right" }}>
                  {analysis.viabilityStatus ||
                    (isHigh ? "Strong Market Fit" : isMid ? "Pivots Required" : "High Friction")}
                </div>
              </div>
            </div>

            {/* Gauge Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#e2e8f0",
                borderRadius: "4px",
                overflow: "hidden",
                margin: "10px 0 14px",
              }}
            >
              <div
                style={{
                  width: `${Math.min(score, 100)}%`,
                  height: "100%",
                  background: isHigh
                    ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                    : isMid
                      ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                      : "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                  borderRadius: "4px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Executive Market Assessment Thesis */}
            {analysis.executiveSummary && (
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                  fontSize: "13px",
                  lineHeight: "1.65",
                  color: "#1e293b",
                }}
              >
                <strong style={{ color: "#0f172a" }}>Executive Market Assessment: </strong>
                {analysis.executiveSummary}
              </div>
            )}
          </div>

          {/* Mathematical Viability Scorecard Table */}
          {analysis.evaluations.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Mathematical Viability Breakdown
                </h4>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Segment Score × Market Weight = Weighted Contribution
                </span>
              </div>

              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#ffffff",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "750px",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "25%",
                        }}
                      >
                        Target Persona & Segment
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "15%",
                        }}
                      >
                        Market Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "16%",
                        }}
                      >
                        Raw Score (0–10)
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "20%",
                        }}
                      >
                        Weighted Points
                      </th>
                      <th
                        style={{
                          padding: "12px 14px",
                          fontWeight: 700,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontSize: "11px",
                          width: "24%",
                        }}
                      >
                        Key Stance & Blocker
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.evaluations.map((item, idx) => {
                      const itemHigh = item.score >= 7.5;
                      const itemMid = item.score >= 5.0 && item.score < 7.5;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            verticalAlign: "top",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Target Persona & Segment */}
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  background: "#f3e8ff",
                                  border: "1px solid #d8b4fe",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "14px",
                                  flexShrink: 0,
                                }}
                              >
                                👤
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                                  {item.personaName}
                                </div>
                                <div
                                  style={{
                                    display: "inline-block",
                                    marginTop: "4px",
                                    padding: "2px 8px",
                                    background: "#f1f5f9",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    color: "#334155",
                                  }}
                                >
                                  {item.role}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Market Weight */}
                          <td style={{ padding: "14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "8px",
                                background: "#faf5ff",
                                border: "1px solid #e9d5ff",
                                color: "#7e22ce",
                                fontWeight: 700,
                                fontSize: "12px",
                              }}
                            >
                              {item.weightage !== undefined ? `${item.weightage}%` : "—"}
                            </span>
                          </td>

                          {/* Raw Score */}
                          <td style={{ padding: "14px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 800,
                                background: itemHigh
                                  ? "#dcfce7"
                                  : itemMid
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                border: `1px solid ${itemHigh
                                    ? "#bbf7d0"
                                    : itemMid
                                      ? "#fde68a"
                                      : "#fecaca"
                                  }`,
                                color: itemHigh
                                  ? "#15803d"
                                  : itemMid
                                    ? "#b45309"
                                    : "#b91c1c",
                              }}
                            >
                              {item.score.toFixed(1)} / 10
                            </span>
                          </td>

                          {/* Weighted Points */}
                          <td style={{ padding: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {item.weightedContribution ||
                                  `+${((item.score * 10 * ((item.weightage || 33.3) / 100))).toFixed(1)} pts`}
                              </span>
                              {item.weightage !== undefined && (
                                <div
                                  style={{
                                    width: "100%",
                                    maxWidth: "120px",
                                    height: "5px",
                                    background: "#e2e8f0",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(item.score * 10, 100)}%`,
                                      height: "100%",
                                      background: "#7e22ce",
                                      borderRadius: "3px",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Key Stance & Blocker */}
                          <td style={{ padding: "14px", lineHeight: "1.5" }}>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#334155",
                                fontStyle: "italic",
                                background: "#fafbfc",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #f1f5f9",
                              }}
                            >
                              "{item.verdict}"
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot>
                    <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                      <td style={{ padding: "12px 14px", color: "#0f172a" }}>
                        Aggregate Total
                      </td>
                      <td style={{ padding: "12px 14px", color: "#7e22ce" }}>
                        100% Market Scope
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b" }}>
                        —
                      </td>
                      <td style={{ padding: "12px 14px", color: "#15803d", fontSize: "13px" }}>
                        {score.toFixed(1)} / 100 pts
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "11px" }}>
                        {analysis.viabilityStatus || "Completed Assessment"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Actionable Strategic Product Pivots */}
          {analysis.recommendedPivots.length > 0 && (
            <div
              style={{
                background: "#faf5ff",
                border: "1px solid #d8b4fe",
                borderRadius: "14px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>🚀</span>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#6b21a8",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Actionable Strategic Product Pivots
                  </h4>
                  <span style={{ fontSize: "11px", color: "#7e22ce" }}>
                    Recommended adjustments to turn skeptical personas into paying customers
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {analysis.recommendedPivots.map((piv, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "#ffffff",
                      border: "1px solid #e9d5ff",
                      borderRadius: "10px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#7e22ce",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        marginTop: "1px",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ fontSize: "12px", color: "#1e293b", lineHeight: "1.5" }}>
                      {renderFormattedText(piv)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consensus vs Polarization Dual Grid */}
          {(analysis.consensusPoints.length > 0 || analysis.polarizingPoints.length > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  analysis.consensusPoints.length > 0 && analysis.polarizingPoints.length > 0
                    ? "repeat(auto-fit, minmax(260px, 1fr))"
                    : "1fr",
                gap: "12px",
              }}
            >
              {analysis.consensusPoints.length > 0 && (
                <div
                  style={{
                    padding: "14px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#15803d",
                    }}
                  >
                    <span>🤝</span> Confirmed Market Drivers
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "16px",
                      fontSize: "12px",
                      color: "#166534",
                      lineHeight: "1.55",
                    }}
                  >
                    {analysis.consensusPoints.map((pt, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.polarizingPoints.length > 0 && (
                <div
                  style={{
                    padding: "14px",
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#9a3412",
                    }}
                  >
                    <span>⚡</span> Critical Dealbreakers & Friction
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "16px",
                      fontSize: "12px",
                      color: "#c2410c",
                      lineHeight: "1.55",
                    }}
                  >
                    {analysis.polarizingPoints.map((pt, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function DelegationLog({
  delegations = [],
  isRunning = false,
  onClear,
}: DelegationLogProps) {
  // Map roles to their active delegation record
  const roleDelegationMap = useMemo(() => {
    const map = new Map<SubAgentRole, SubagentDelegation>();
    for (const d of delegations) {
      if (PIPELINE_ROLES.includes(d.sub_agent as SubAgentRole)) {
        map.set(d.sub_agent as SubAgentRole, d);
      }
    }
    return map;
  }, [delegations]);

  // Determine which tabs are enabled
  const enabledRoles = useMemo(() => {
    return PIPELINE_ROLES.filter((role) => roleDelegationMap.has(role));
  }, [roleDelegationMap]);

  // Tab State: default to first enabled or null
  const [selectedRole, setSelectedRole] = useState<SubAgentRole | null>(null);

  // Auto-switch to the most recently active or completed tab
  useEffect(() => {
    if (enabledRoles.length > 0) {
      // Find currently running role first, otherwise the last role in pipeline that has finished
      const runningRole = enabledRoles.find(
        (r) => roleDelegationMap.get(r)?.status === "running"
      );
      if (runningRole) {
        setSelectedRole(runningRole);
      } else if (!selectedRole || !enabledRoles.includes(selectedRole)) {
        setSelectedRole(enabledRoles[enabledRoles.length - 1]);
      }
    } else {
      setSelectedRole(null);
    }
  }, [enabledRoles, roleDelegationMap]);

  const activeDelegation = selectedRole ? roleDelegationMap.get(selectedRole) : null;
  const activeMeta = selectedRole ? SUB_AGENTS[selectedRole] : null;

  // Parse structured persona data for persona_generator
  const parsedPersonaData = useMemo(() => {
    if (selectedRole === "persona_generator" && activeDelegation?.result) {
      return parsePersonaData(activeDelegation.result);
    }
    return null;
  }, [selectedRole, activeDelegation?.result]);

  // Parse structured focus group data for focus_group_orchestrator
  const parsedFocusGroupData = useMemo(() => {
    if (selectedRole === "focus_group_orchestrator" && activeDelegation?.result) {
      return parseFocusGroupData(activeDelegation.result);
    }
    return null;
  }, [selectedRole, activeDelegation?.result]);

  // Parse structured viability data for viability_evaluator
  const parsedViabilityData = useMemo(() => {
    if (selectedRole === "viability_evaluator" && activeDelegation?.result) {
      return parseFocusGroupData(activeDelegation.result);
    }
    return null;
  }, [selectedRole, activeDelegation?.result]);

  return (
    <div
      data-testid="delegation-log"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fafbfc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            Sub-Agent Delegations
          </span>
          {isRunning && (
            <span
              data-testid="supervisor-running"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "20px",
                border: "1px solid #c7d2fe",
                background: "#eef2ff",
                color: "#4338ca",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#4f46e5",
                  boxShadow: "0 0 6px #6366f1",
                  display: "inline-block",
                }}
              />
              Supervisor Active
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onClear && delegations.length > 0 && !isRunning && (
            <button
              onClick={() => {
                onClear();
                setSelectedRole(null);
              }}
              title="Clear delegation log"
              style={{
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "3px 10px",
                fontSize: "12px",
                fontWeight: 500,
                color: "#64748b",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#334155";
                e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Clear
            </button>
          )}
          <span
            data-testid="delegation-count"
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#64748b",
              background: "#f1f5f9",
              padding: "3px 10px",
              borderRadius: "12px",
              fontWeight: 600,
            }}
          >
            {delegations.length} {delegations.length === 1 ? "call" : "calls"}
          </span>
        </div>
      </div>

      {/* Pipeline Navigation Tabs Bar */}
      <div
        data-testid="subagent-tabs"
        style={{
          display: "flex",
          alignItems: "stretch",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "4px 8px 0",
          gap: "4px",
          overflowX: "auto",
        }}
      >
        {PIPELINE_ROLES.map((role) => {
          const meta = SUB_AGENTS[role];
          const delegation = roleDelegationMap.get(role);
          const isEnabled = !!delegation;
          const isSelected = selectedRole === role;
          const status = delegation?.status;

          return (
            <button
              key={role}
              data-testid={`subagent-tab-${role}`}
              onClick={() => {
                if (isEnabled) {
                  setSelectedRole(role);
                }
              }}
              disabled={!isEnabled}
              title={
                isEnabled
                  ? `View ${meta.label} (${status})`
                  : `${meta.label} - Waiting for pipeline trigger`
              }
              style={{
                flex: "1 1 auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "10px 14px",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
                borderTop: isSelected ? `2px solid ${meta.color.text}` : "2px solid transparent",
                borderLeft: isSelected ? "1px solid #e2e8f0" : "1px solid transparent",
                borderRight: isSelected ? "1px solid #e2e8f0" : "1px solid transparent",
                borderBottom: isSelected ? "1px solid #ffffff" : "1px solid transparent",
                background: isSelected ? "#ffffff" : isEnabled ? "#f1f5f9" : "transparent",
                color: isSelected ? meta.color.text : isEnabled ? "#475569" : "#94a3b8",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "12px",
                cursor: isEnabled ? "pointer" : "not-allowed",
                opacity: isEnabled ? 1 : 0.45,
                transition: "all 0.15s ease",
                marginBottom: isSelected ? "-1px" : "0",
                zIndex: isSelected ? 2 : 1,
                whiteSpace: "nowrap",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: "14px" }}>
                {meta.emoji}
              </span>
              <span>{meta.label}</span>

              {/* Status Badge inside Tab Header */}
              {status === "running" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "#fef3c7",
                    color: "#b45309",
                    border: "1px solid #fde68a",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#d97706",
                      display: "inline-block",
                    }}
                  />
                  Live
                </span>
              ) : status === "completed" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  ✓ Done
                </span>
              ) : isEnabled && status === "failed" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                >
                  ✗ Failed
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#94a3b8",
                  }}
                >
                  🔒 Idle
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Area (100% Height & Scrollable) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {!activeDelegation ? (
          // Hero Waiting State
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 24px",
              textAlign: "center",
              background: "#fafbfc",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
              }}
            >
              🎯
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
              Live Sub-Agent Delegation Board Ready
            </h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "0.88rem",
                color: "#64748b",
                maxWidth: "420px",
                lineHeight: "1.55",
              }}
            >
              Share any product or startup idea in the chat. As the coordinator invokes sub-agents, their live progress, intermediate deliberation rounds, and final viability scorecards will stream right into these tabs.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              <span>1. 👥 Personas</span>
              <span style={{ color: "#cbd5e1" }}>→</span>
              <span>2. 🎙️ Focus Group</span>
              <span style={{ color: "#cbd5e1" }}>→</span>
              <span>3. 📊 Viability</span>
            </div>
          </div>
        ) : (
          // Active Tab Panel (Full Height & Scrollable)
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Stage Info Header Banner */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: activeMeta?.color.bg || "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.4rem" }}>{activeMeta?.emoji}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: activeMeta?.color.text || "#0f172a" }}>
                    {activeMeta?.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {activeMeta?.description}
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              {activeDelegation.status === "running" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "#fef3c7",
                    color: "#b45309",
                    border: "1px solid #fde68a",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#d97706",
                      display: "inline-block",
                    }}
                  />
                  Running
                </span>
              ) : activeDelegation.status === "completed" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  ✓ Completed
                </span>
              ) : (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                >
                  ✗ Failed
                </span>
              )}
            </div>

            {/* Task Description */}
            <div
              style={{
                padding: "10px 20px",
                background: "#fafbfc",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              <strong style={{ color: "#0f172a" }}>Task: </strong>
              {activeDelegation.task}
            </div>

            {/* Scrollable Stage Content Body */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "20px",
                background: "#ffffff",
              }}
            >
              {activeDelegation.status === "running" && !activeDelegation.result ? (
                // In-Progress Live Animation
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "220px",
                    gap: "14px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      border: "3px solid #e2e8f0",
                      borderTopColor: activeMeta?.color.text || "#3b82f6",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                    {activeMeta?.label} is in progress...
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "340px" }}>
                    Executing specialist deliberation across personas. Real-time findings will render here immediately upon completion.
                  </div>
                </div>
              ) : activeDelegation.result ? (
                // Formatted Output, Tabular Persona Matrix, Tabular Focus Group Matrix, or Viability Scorecard
                selectedRole === "persona_generator" && parsedPersonaData ? (
                  <PersonaTableView
                    analysis={parsedPersonaData}
                    rawText={activeDelegation.result}
                  />
                ) : selectedRole === "focus_group_orchestrator" && parsedFocusGroupData ? (
                  <FocusGroupTableView
                    analysis={parsedFocusGroupData}
                    rawText={activeDelegation.result}
                  />
                ) : selectedRole === "viability_evaluator" && parsedViabilityData ? (
                  <ViabilityScorecardView
                    analysis={parsedViabilityData}
                    rawText={activeDelegation.result}
                  />
                ) : (
                  <FormattedContent text={activeDelegation.result} />
                )
              ) : (
                <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "13px" }}>
                  No output recorded for this stage yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
