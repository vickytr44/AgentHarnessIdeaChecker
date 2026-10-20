"use client";

import React, { useState } from "react";

export interface PlanApprovalCardProps {
  planTitle?: string;
  planSummary?: string;
  steps?: string[];
  status?: string;
  onApprove?: () => void;
  onReject?: (feedback?: string) => void;
}

export function PlanApprovalCard({
  planTitle = "Evaluation & Focus Group Plan",
  planSummary,
  steps = [],
  status,
  onApprove,
  onReject,
}: PlanApprovalCardProps) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const isReadOnly = decision !== null || status === "complete";

  const handleApprove = () => {
    if (isReadOnly) return;
    setDecision("approved");
    onApprove?.();
  };

  const handleReject = () => {
    if (isReadOnly) return;
    setDecision("rejected");
    onReject?.("The user requested adjustments to the plan.");
  };

  if (decision === "approved" || status === "complete") {
    return (
      <div
        style={{
          margin: "12px 0",
          padding: "16px",
          background: "#ecfdf5",
          border: "1px solid #6ee7b7",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#065f46" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Plan Approved & Executing
          </span>
        </div>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#047857" }}>
          The agent has switched to execute mode and is running the focus group deliberation.
        </p>
      </div>
    );
  }

  if (decision === "rejected") {
    return (
      <div
        style={{
          margin: "12px 0",
          padding: "16px",
          background: "#fff1f2",
          border: "1px solid #fecdd3",
          borderRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9f1239" }}>
          <span style={{ fontSize: "16px" }}>✕</span>
          <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>
            Plan Revisions Requested
          </span>
        </div>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#be123c" }}>
          Please specify what changes you would like in the plan.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "14px 0",
        padding: "18px",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: "14px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "#059669",
            background: "#d1fae5",
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          Plan Ready for Review
        </span>
      </div>

      <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
        {planTitle}
      </h3>

      {planSummary && (
        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
          {planSummary}
        </p>
      )}

      {steps.length > 0 && (
        <div
          style={{
            margin: "12px 0 16px 0",
            padding: "12px",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
            Planned Steps:
          </div>
          <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155" }}>
            {steps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: "4px", lineHeight: "1.4" }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
        <button
          type="button"
          onClick={handleReject}
          style={{
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#64748b",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Modify Plan
        </button>

        <button
          type="button"
          onClick={handleApprove}
          style={{
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#ffffff",
            background: "#059669",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.35)",
            transition: "all 0.15s ease",
          }}
        >
          Approve & Execute →
        </button>
      </div>
    </div>
  );
}
