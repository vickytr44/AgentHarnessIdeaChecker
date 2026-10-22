"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { SubAgentRole, DelegationLogProps, SubagentDelegation } from "@/types/delegation";
import { SUB_AGENTS, PIPELINE_ROLES } from "./constants";
import { FormattedContent } from "./FormattedContent";
import { PersonaTableView } from "./PersonaTableView";
import { FocusGroupTableView } from "./FocusGroupTableView";
import { ViabilityScorecardView } from "./ViabilityScorecardView";
import { parsePersonaData } from "@/lib/parsePersonaData";
import { parseFocusGroupData } from "@/lib/parseFocusGroupData";

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
