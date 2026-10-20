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
                // Formatted Output
                <FormattedContent text={activeDelegation.result} />
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
