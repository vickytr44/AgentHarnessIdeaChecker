"use client";

import React, { useState } from "react";

export type SubAgentRole = "persona_generator" | "focus_group_orchestrator" | "viability_evaluator";

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
  emoji: string;
  color: {
    bg: string;
    border: string;
    text: string;
    activeBg: string;
  };
  description: string;
}

const SUB_AGENTS: Record<string, SubAgentMeta> = {
  persona_generator: {
    role: "persona_generator",
    label: "Persona Synthesizer",
    emoji: "👥",
    color: {
      bg: "#f0fdf4",
      border: "#86efac",
      text: "#15803d",
      activeBg: "#dcfce7",
    },
    description: "Synthesizes audience archetypes, pain points & weightages",
  },
  focus_group_orchestrator: {
    role: "focus_group_orchestrator",
    label: "Focus Group Orchestrator",
    emoji: "🎙️",
    color: {
      bg: "#eff6ff",
      border: "#93c5fd",
      text: "#1d4ed8",
      activeBg: "#dbeafe",
    },
    description: "Spawns dynamic in-character agents for 2-3 round debate",
  },
  viability_evaluator: {
    role: "viability_evaluator",
    label: "Viability Evaluator",
    emoji: "📊",
    color: {
      bg: "#faf5ff",
      border: "#d8b4fe",
      text: "#7e22ce",
      activeBg: "#f3e8ff",
    },
    description: "Computes weighted viability index & strategic pivots",
  },
};

const INDICATOR_ROLES: SubAgentRole[] = [
  "persona_generator",
  "focus_group_orchestrator",
  "viability_evaluator",
];

export function DelegationLog({
  delegations = [],
  isRunning = false,
  onClear,
}: DelegationLogProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const calledRoles = new Set<string>(delegations.map((d) => d.sub_agent));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
          padding: "16px 20px",
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
              onClick={onClear}
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

      {/* Sub-Agent Indicator Chips Bar */}
      <div
        data-testid="subagent-indicators"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          borderBottom: "1px solid #f1f5f9",
          background: "#ffffff",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
          Pipeline:
        </span>
        {INDICATOR_ROLES.map((role) => {
          const meta = SUB_AGENTS[role];
          const hasFired = calledRoles.has(role);
          const isCurrentlyRunning = delegations.some(
            (d) => d.sub_agent === role && d.status === "running"
          );

          return (
            <div
              key={role}
              data-testid={`subagent-indicator-${role}`}
              data-role={role}
              data-fired={hasFired ? "true" : "false"}
              title={meta.description}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                border: `1px solid ${hasFired ? meta.color.border : "#e2e8f0"}`,
                background: isCurrentlyRunning
                  ? meta.color.activeBg
                  : hasFired
                  ? meta.color.bg
                  : "#f8fafc",
                color: hasFired ? meta.color.text : "#94a3b8",
                opacity: hasFired || isCurrentlyRunning ? 1 : 0.65,
                transition: "all 0.2s ease",
              }}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span>{meta.label}</span>
              {isCurrentlyRunning && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: meta.color.text,
                    display: "inline-block",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Delegation Cards Stream */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          background: "#f8fafc",
        }}
      >
        {delegations.length === 0 ? (
          <div
            style={{
              padding: "36px 20px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px dashed #cbd5e1",
              margin: "auto 0",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎯</div>
            <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 600, color: "#334155" }}>
              Live Delegation Board Ready
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", maxWidth: "380px", marginInline: "auto", lineHeight: "1.5" }}>
              Submit any product or feature idea in the chat. As the coordinator invokes sub-agents, their live progress, intermediate deliberation rounds, and final viability scorecards will stream right here.
            </p>
          </div>
        ) : (
          delegations.map((d, idx) => {
            const meta = SUB_AGENTS[d.sub_agent] || {
              label: d.sub_agent,
              emoji: "🤖",
              color: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", activeBg: "#e2e8f0" },
            };

            const isExpanded = expandedIds[d.id] ?? true;

            return (
              <div
                key={d.id}
                data-testid="delegation-entry"
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  overflow: "hidden",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {/* Entry Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 8px",
                        borderRadius: "14px",
                        fontSize: "11px",
                        fontWeight: 600,
                        border: `1px solid ${meta.color.border}`,
                        background: meta.color.bg,
                        color: meta.color.text,
                      }}
                    >
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Status Badge */}
                    {d.status === "running" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#d97706",
                          background: "#fef3c7",
                          padding: "2px 8px",
                          borderRadius: "10px",
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
                    ) : d.status === "completed" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#16a34a",
                          background: "#dcfce7",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        ✓ Completed
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#dc2626",
                          background: "#fee2e2",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          border: "1px solid #fecaca",
                        }}
                      >
                        Failed
                      </span>
                    )}

                    {d.result && (
                      <button
                        onClick={() => toggleExpand(d.id)}
                        type="button"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: 500,
                          padding: "2px 4px",
                          borderRadius: "4px",
                        }}
                      >
                        {isExpanded ? "Collapse" : "Expand"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Task Details */}
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: d.result ? "10px" : "0" }}>
                    <strong style={{ color: "#0f172a" }}>Task: </strong>
                    {d.task}
                  </div>

                  {/* Result Box */}
                  {d.result && isExpanded && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#1e293b",
                        lineHeight: "1.6",
                        background: "#fafbfc",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        border: "1px solid #f1f5f9",
                        whiteSpace: "pre-wrap",
                        maxHeight: "340px",
                        overflowY: "auto",
                        fontFamily:
                          d.result.startsWith("{") || d.result.startsWith("[")
                            ? "monospace"
                            : "inherit",
                      }}
                    >
                      {d.result}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
