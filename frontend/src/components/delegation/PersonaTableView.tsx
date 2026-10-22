"use client";

import React, { useState } from "react";
import type { ParsedPersonaAnalysis } from "@/types/delegation";
import { FormattedContent, renderFormattedText } from "./FormattedContent";

/**
 * Rich tabular UI for Persona Synthesizer results.
 * Displays an executive summary card, audience personas matrix table,
 * with a toggle to switch between tabular and raw report views.
 */
export function PersonaTableView({
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
