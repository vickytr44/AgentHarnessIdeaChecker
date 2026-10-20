"use client";

import React, { useState } from "react";

export interface TodoItem {
  id: string;
  title: string;
  subtitle?: string;
  status: "pending" | "in_progress" | "completed";
}

export interface TodoProgressBarProps {
  todos: TodoItem[];
  isRunning?: boolean;
}

export function TodoProgressBar({ todos, isRunning = false }: TodoProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!todos || todos.length === 0) {
    return null;
  }

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const inProgressIndex = todos.findIndex((t) => t.status === "in_progress");
  const totalCount = todos.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  // Active step description
  const activeStep = inProgressIndex >= 0 ? todos[inProgressIndex] : null;
  const isAllCompleted = completedCount === totalCount;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "74px",
        left: "14px",
        right: "14px",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        pointerEvents: "auto",
      }}
    >
      {/* Expanded Checklist Popover */}
      {isExpanded && (
        <div
          style={{
            marginBottom: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "14px",
            padding: "14px 16px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            animation: "fadeInUp 0.18s ease-out",
          }}
        >
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px" }}>📋</span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                Evaluation Plan Execution
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 650,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: isAllCompleted ? "#dcfce7" : "#f1f5f9",
                  color: isAllCompleted ? "#15803d" : "#475569",
                  border: `1px solid ${isAllCompleted ? "#86efac" : "#e2e8f0"}`,
                }}
              >
                {completedCount} of {totalCount} completed ({percent}%)
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                title="Minimize checklist"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: "12px",
                  padding: "2px 4px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress Track */}
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#e2e8f0",
              borderRadius: "3px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: isAllCompleted
                  ? "#10b981"
                  : "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Checklist items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {todos.map((item, idx) => {
              const isDone = item.status === "completed";
              const isInProg = item.status === "in_progress";

              return (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: isInProg ? "#f0f7ff" : isDone ? "#fafbfc" : "#ffffff",
                    border: `1px solid ${
                      isInProg ? "#bfdbfe" : isDone ? "#f1f5f9" : "#e2e8f0"
                    }`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Status Icon */}
                  {isDone ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        color: "#15803d",
                        border: "1px solid #86efac",
                        fontSize: "11px",
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  ) : isInProg ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        fontSize: "11px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          boxShadow: "0 0 6px #60a5fa",
                        }}
                      />
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#f8fafc",
                        color: "#94a3b8",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}

                  {/* Title & Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: isInProg ? 700 : isDone ? 500 : 500,
                        color: isDone ? "#64748b" : isInProg ? "#1d4ed8" : "#1e293b",
                        textDecoration: isDone ? "line-through" : "none",
                        lineHeight: "1.4",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: isInProg ? "#3b82f6" : "#94a3b8",
                          lineHeight: "1.3",
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: isDone
                        ? "#15803d"
                        : isInProg
                        ? "#2563eb"
                        : "#94a3b8",
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? "Done" : isInProg ? "Active" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            onClick={() => setIsExpanded(false)}
            style={{
              marginTop: "10px",
              textAlign: "center",
              fontSize: "11px",
              color: "#64748b",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            ▲ Click to minimize bar
          </div>
        </div>
      )}

      {/* Docked Floating Task Bar (1-Line Compact View) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          padding: "7px 12px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1px solid ${
            isAllCompleted ? "#86efac" : isRunning ? "#93c5fd" : "#cbd5e1"
          }`,
          borderRadius: "10px",
          boxShadow: "0 3px 10px rgba(0, 0, 0, 0.06)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          userSelect: "none",
        }}
      >
        {/* Left: Icon & Step Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <span style={{ fontSize: "14px", flexShrink: 0 }}>
            {isAllCompleted ? "✅" : "📋"}
          </span>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: isAllCompleted ? "#15803d" : "#0f172a",
              flexShrink: 0,
            }}
          >
            {isAllCompleted
              ? "Plan Completed"
              : `Step ${
                  inProgressIndex >= 0 ? inProgressIndex + 1 : completedCount
                } of ${totalCount}`}
          </span>

          <span
            style={{
              fontSize: "12px",
              color: "#475569",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {isAllCompleted
              ? "• All 4 stages finished"
              : activeStep
              ? `• ${activeStep.title}`
              : `• ${percent}% complete`}
          </span>
        </div>

        {/* Right: Mini Progress Bar & Toggle Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Progress Bar */}
          <div
            style={{
              width: "55px",
              height: "5px",
              background: "#e2e8f0",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: isAllCompleted
                  ? "#10b981"
                  : "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
            {percent}%
          </span>

          <span
            style={{
              fontSize: "10px",
              color: "#64748b",
              background: "#f1f5f9",
              padding: "1px 5px",
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
            }}
          >
            {isExpanded ? "▼ Close" : "▲ View"}
          </span>
        </div>
      </div>
    </div>
  );
}
