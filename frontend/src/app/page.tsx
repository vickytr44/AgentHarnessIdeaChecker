"use client";

import React from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { InteractiveChoiceCard } from "@/components/InteractiveChoiceCard";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";

export default function Home() {
  // 1. Tool: Interactive Choice Card (for clarifying questions with selectable options)
  useCopilotAction({
    name: "ask_user_choice",
    description:
      "Prompts the user with interactive, clickable options when asking clarifying questions, selecting target markets, or making decisions.",
    parameters: [
      {
        name: "question",
        type: "string",
        description: "The question or decision to ask the user",
        required: true,
      },
      {
        name: "description",
        type: "string",
        description: "Additional context or guidance for the decision",
        required: false,
      },
      {
        name: "category",
        type: "string",
        description: "Category badge (e.g. 'Target Market', 'User Segment', 'Design Choice')",
        required: false,
      },
      {
        name: "options",
        type: "object[]",
        description: "List of candidate options",
        required: true,
        attributes: [
          { name: "id", type: "string", description: "Option ID" },
          { name: "label", type: "string", description: "Option label" },
          { name: "description", type: "string", description: "Optional details" },
        ],
      },
      {
        name: "allowMultiple",
        type: "boolean",
        description: "Whether multiple selections are allowed",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, status, respond }) => {
      return (
        <InteractiveChoiceCard
          question={args.question || "Please select an option:"}
          description={args.description}
          category={args.category}
          options={args.options || []}
          allowMultiple={args.allowMultiple}
          status={status}
          onSubmit={(result) => {
            respond?.({
              selectedIds: result.selectedIds,
              selectedLabels: result.selectedLabels,
              message: `User selected: ${result.selectedLabels.join(", ")}`,
            });
          }}
        />
      );
    },
  });

  // 2. Tool: Plan Approval Card (for one-click approval to proceed to execute mode)
  useCopilotAction({
    name: "request_plan_approval",
    description:
      "Presents the evaluation plan to the user with an interactive 'Approve & Execute' button.",
    parameters: [
      {
        name: "planTitle",
        type: "string",
        description: "Title of the proposed plan",
        required: false,
      },
      {
        name: "planSummary",
        type: "string",
        description: "Brief overview of what will be evaluated",
        required: false,
      },
      {
        name: "steps",
        type: "string[]",
        description: "List of planned todo steps",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, status, respond }) => {
      return (
        <PlanApprovalCard
          planTitle={args.planTitle}
          planSummary={args.planSummary}
          steps={args.steps}
          status={status}
          onApprove={() => {
            respond?.({
              approved: true,
              action: "execute",
              message:
                "Plan approved. Please switch to execute mode and proceed with the focus group deliberation.",
            });
          }}
          onReject={(feedback) => {
            respond?.({
              approved: false,
              action: "revise",
              message: feedback || "Plan adjustments requested by user.",
            });
          }}
        />
      );
    },
  });

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <header
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
              Idea Checker • Agent Harness
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#059669",
                background: "#d1fae5",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              Interactive Focus Group
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Connected to Microsoft Agent Framework (.NET) on <code>http://localhost:5053/ag-ui</code>
          </p>
        </div>
      </header>

      <div style={{ flex: 1, height: "calc(100vh - 75px)", position: "relative" }}>
        <CopilotChat
          labels={{
            title: "Idea Checker Coordinator",
            initial:
              "Welcome! Share any product, startup, or feature idea. I will generate targeted audience personas, moderate a multi-round focus group debate, and compute an objective viability scorecard.",
          }}
          className="h-full"
        />
      </div>
    </main>
  );
}
