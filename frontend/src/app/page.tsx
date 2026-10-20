"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { InteractiveChoiceCard } from "@/components/InteractiveChoiceCard";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";
import { DelegationLog, SubagentDelegation } from "@/components/DelegationLog";

export default function Home() {
  // 1. Reactive Sub-Agent State Subscription via AG-UI
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });

  // 2. Direct real-time polling synchronization from backend delegations endpoint
  const [polledDelegations, setPolledDelegations] = useState<SubagentDelegation[]>([]);

  const fetchDelegations = useCallback(async () => {
    try {
      const res = await fetch("/api/delegations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.delegations)) {
          setPolledDelegations(data.delegations);
        }
      }
    } catch {
      // Ignore network polling exceptions
    }
  }, []);

  useEffect(() => {
    fetchDelegations();
    const interval = setInterval(fetchDelegations, 1000);
    return () => clearInterval(interval);
  }, [fetchDelegations]);

  const handleClearDelegations = useCallback(async () => {
    try {
      await fetch("/api/delegations", { method: "DELETE" });
      setPolledDelegations([]);
    } catch {
      // Ignore
    }
  }, []);

  const agentDelegations = ((agent?.state as any)?.delegations as SubagentDelegation[]) || [];
  
  // Prefer whichever source has delegations or has more records
  const delegations = polledDelegations.length >= agentDelegations.length
    ? polledDelegations
    : agentDelegations;

  const isRunning =
    (agent as any)?.isRunning ||
    delegations.some((d) => d.status === "running") ||
    false;

  // 2. Tool: Interactive Choice Card (for clarifying questions with selectable options)
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

  // 3. Tool: Plan Approval Card (for one-click approval to proceed to execute mode)
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
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f1f5f9",
        overflow: "hidden",
      }}
    >
      {/* Global Header */}
      <header
        style={{
          padding: "14px 28px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
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
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            Connected to Microsoft Agent Framework (.NET) on <code>http://localhost:5053/ag-ui</code>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#64748b",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "4px 10px",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            AG-UI Live State Stream
          </span>
        </div>
      </header>

      {/* Split-Screen Main Container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          gap: "16px",
          padding: "16px",
          overflow: "hidden",
        }}
      >
        {/* Left Panel: Sub-Agent Delegation Log */}
        <section
          style={{
            flex: "1 1 56%",
            minWidth: "360px",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <DelegationLog
            delegations={delegations}
            isRunning={isRunning}
            onClear={handleClearDelegations}
          />
        </section>

        {/* Right Panel: CopilotChat */}
        <section
          style={{
            flex: "1 1 44%",
            minWidth: "340px",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <CopilotChat
            labels={{
              title: "Idea Checker Coordinator",
              initial:
                "Welcome! Share any product, startup, or feature idea. I will generate targeted audience personas, moderate a multi-round focus group debate, and compute an objective viability scorecard.",
            }}
            className="h-full"
          />
        </section>
      </div>
    </main>
  );
}
