"use client";

import React from "react";
import { cleanContent } from "@/lib/cleanContent";

/**
 * Inline bold (**text**) and code (`text`) renderer.
 * Returns an array of React nodes with appropriate styling.
 */
export function renderFormattedText(str: string): React.ReactNode {
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

/**
 * Markdown-like content renderer. Handles headings (H1–H3),
 * bullet/numbered lists, and regular paragraphs with inline formatting.
 */
export function FormattedContent({ text }: { text: string }) {
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
