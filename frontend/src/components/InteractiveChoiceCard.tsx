"use client";

import React, { useState } from "react";

export interface OptionItem {
  id: string;
  label: string;
  description?: string;
}

export interface InteractiveChoiceCardProps {
  question: string;
  description?: string;
  category?: string;
  options: OptionItem[];
  allowMultiple?: boolean;
  status?: string;
  onSubmit?: (result: { selectedIds: string[]; selectedLabels: string[] }) => void;
}

export function InteractiveChoiceCard({
  question,
  description,
  category = "Decision Needed",
  options = [],
  allowMultiple = false,
  status,
  onSubmit,
}: InteractiveChoiceCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isReadOnly = isSubmitted || status === "complete";

  const handleToggle = (id: string) => {
    if (isReadOnly) return;

    if (allowMultiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIds.length === 0 || isReadOnly) return;

    setIsSubmitted(true);
    const selectedLabels = options
      .filter((opt) => selectedIds.includes(opt.id))
      .map((opt) => opt.label);

    onSubmit?.({
      selectedIds,
      selectedLabels,
    });
  };

  // If already submitted or complete, show clean receipt view
  if (isSubmitted || status === "complete") {
    const chosenOptions = options.filter((opt) => selectedIds.includes(opt.id));
    return (
      <div
        style={{
          margin: "12px 0",
          padding: "16px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "16px" }}>✓</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Selection Confirmed
          </span>
        </div>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 600, color: "#14532d" }}>
          {question}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {chosenOptions.map((opt) => (
            <span
              key={opt.id}
              style={{
                display: "inline-block",
                padding: "4px 10px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#166534",
              }}
            >
              {opt.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "14px 0",
        padding: "18px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
        fontFamily: "inherit",
      }}
    >
      {/* Category Tag & Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "#3b82f6",
            background: "#eff6ff",
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {category}
        </span>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          {allowMultiple ? "Select all that apply" : "Choose one option"}
        </span>
      </div>

      <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>
        {question}
      </h3>

      {description && (
        <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "#64748b", lineHeight: "1.4" }}>
          {description}
        </p>
      )}

      {/* Selectable Options Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggle(opt.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px",
                textAlign: "left",
                background: isSelected ? "#eff6ff" : "#f8fafc",
                border: isSelected ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
              }}
            >
              {/* Radio / Checkbox Indicator */}
              <div
                style={{
                  marginTop: "2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: allowMultiple ? "4px" : "50%",
                  border: isSelected ? "5px solid #3b82f6" : "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: isSelected ? "#1d4ed8" : "#1e293b" }}>
                  {opt.label}
                </div>
                {opt.description && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", lineHeight: "1.3" }}>
                    {opt.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit Action */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={selectedIds.length === 0}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#ffffff",
            background: selectedIds.length > 0 ? "#2563eb" : "#94a3b8",
            border: "none",
            borderRadius: "8px",
            cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
            boxShadow: selectedIds.length > 0 ? "0 2px 6px rgba(37, 99, 235, 0.3)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          Confirm Choice →
        </button>
      </div>
    </div>
  );
}
