"use client";

import React, { useState, useMemo } from "react";
import type { ParsedFocusGroupAnalysis } from "@/types/delegation";
import { FormattedContent, renderFormattedText } from "./FormattedContent";

/**
 * Rich tabular & debate UI for Focus Group Orchestrator results.
 * Displays a deliberation pulse summary, verdict matrix table,
 * and an interactive round-by-round debate feed accordion.
 */
export function FocusGroupTableView({
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
                              &quot;{item.verdict}&quot;
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
