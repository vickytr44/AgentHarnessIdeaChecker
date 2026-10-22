"use client";

import React, { useState } from "react";
import type { ParsedFocusGroupAnalysis } from "@/types/delegation";
import { FormattedContent, renderFormattedText } from "./FormattedContent";

/**
 * Rich scorecard & strategic pivots UI for Viability Evaluator results.
 * Displays an executive viability hero card with gauge, mathematical
 * breakdown table, actionable pivots, and consensus/polarization grid.
 */
export function ViabilityScorecardView({
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
                              &quot;{item.verdict}&quot;
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
