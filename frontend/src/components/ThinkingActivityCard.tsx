"use client";

import React, { useState, useEffect } from "react";

export interface CompletedStep {
  title: string;
  subtitle?: string;
  timestamp?: string;
}

export interface ThinkingActivityCardProps {
  isRunning?: boolean;
  activeSubagent?: "persona_generator" | "focus_group_orchestrator" | "viability_evaluator" | string | null;
  activeTask?: string | null;
  currentTodoTitle?: string | null;
  completedSteps?: CompletedStep[];
}

export function ThinkingActivityCard({
  isRunning = true,
  activeSubagent,
  activeTask,
  currentTodoTitle,
  completedSteps = [],
}: ThinkingActivityCardProps) {
  const [elapsed, setElapsed] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    setElapsed(1);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Determine subagent badge metadata
  let badgeLabel = "Thinking & Planning";
  let badgeIcon = "🧠";
  let badgeColor = "#6366f1";
  let badgeBg = "#eef2ff";
  let badgeBorder = "#c7d2fe";

  if (activeSubagent === "persona_generator") {
    badgeLabel = "Persona Synthesizer Active";
    badgeIcon = "👥";
    badgeColor = "#7c3aed";
    badgeBg = "#f5f3ff";
    badgeBorder = "#ddd6fe";
  } else if (activeSubagent === "focus_group_orchestrator") {
    badgeLabel = "Focus Group Orchestrator Active";
    badgeIcon = "🎙️";
    badgeColor = "#0284c7";
    badgeBg = "#f0f9ff";
    badgeBorder = "#bae6fd";
  } else if (activeSubagent === "viability_evaluator") {
    badgeLabel = "Viability Evaluator Active";
    badgeIcon = "📊";
    badgeColor = "#059669";
    badgeBg = "#ecfdf5";
    badgeBorder = "#a7f3d0";
  }

  const primaryTask =
    activeTask ||
    currentTodoTitle ||
    "Reasoning about idea context & coordinating evaluation steps...";

  return (
    <div
      style={{
        margin: "8px 0 12px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
        overflow: "hidden",
        fontSize: "13px",
        color: "#1e293b",
        fontFamily: "inherit",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.15); }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f1f5f9",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          >
            {badgeIcon}
          </div>

          <span style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
            Thinking
          </span>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#64748b",
              background: "#f1f5f9",
              padding: "2px 7px",
              borderRadius: "10px",
            }}
          >
            {elapsed}s
          </span>
        </div>

        {/* Live Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 9px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: 600,
            color: badgeColor,
            background: badgeBg,
            border: `1px solid ${badgeBorder}`,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: badgeColor,
              display: "inline-block",
              animation: "pulseGlow 1.4s infinite ease-in-out",
            }}
          />
          {badgeLabel}
        </div>
      </div>

      {/* Current Active Activity */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: badgeColor,
              marginTop: "6px",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                lineHeight: "1.45",
                color: "#0f172a",
                fontWeight: 500,
              }}
            >
              {primaryTask}
            </div>

            {currentTodoTitle && activeTask && currentTodoTitle !== activeTask && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>Milestone:</span>
                <span style={{ fontWeight: 500, color: "#475569" }}>
                  {currentTodoTitle}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Animated Shimmer Bar */}
        <div
          style={{
            marginTop: "10px",
            height: "2px",
            borderRadius: "2px",
            background: "#e2e8f0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40%",
              background: `linear-gradient(90deg, transparent 0%, ${badgeColor} 50%, transparent 100%)`,
              animation: "shimmerLine 1.6s infinite ease-in-out",
            }}
          />
        </div>

        {/* Completed Steps History Dropdown (if any steps were completed) */}
        {completedSteps.length > 0 && (
          <div style={{ marginTop: "10px", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: "none",
                border: "none",
                padding: "2px 0",
                fontSize: "11px",
                fontWeight: 500,
                color: "#64748b",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{showHistory ? "▼" : "▶"}</span>
              <span>
                {completedSteps.length} previous step
                {completedSteps.length > 1 ? "s" : ""} completed
              </span>
            </button>

            {showHistory && (
              <div
                style={{
                  marginTop: "6px",
                  padding: "6px 8px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {completedSteps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "#475569",
                    }}
                  >
                    <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                    <span style={{ flex: 1 }}>{step.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
