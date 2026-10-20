"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { InteractiveChoiceCard } from "@/components/InteractiveChoiceCard";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";
import { DelegationLog, SubagentDelegation } from "@/components/DelegationLog";

export default function Home() {
  // 1. Reactive Agent Subscription via AG-UI protocol
  const { agent } = useAgent({
    updates: [
      UseAgentUpdate.OnMessagesChanged,
      UseAgentUpdate.OnStateChanged,
      UseAgentUpdate.OnRunStatusChanged,
    ],
  });

  const [liveDelegations, setLiveDelegations] = useState<SubagentDelegation[]>([]);

  // 2. Real-time streaming tool-call listener via AG-UI SSE stream (Zero polling/endpoints)
  useEffect(() => {
    if (!agent) return;

    const sub = agent.subscribe({
      onToolCallStartEvent: ({ event }) => {
        const name = event.toolCallName;
        let role: SubagentDelegation["sub_agent"] | null = null;
        let task = "Executing specialist sub-agent...";

        if (name === "create_idea_personas") {
          role = "persona_generator";
          task = "Synthesizing target audience personas and priority weights...";
        } else if (name === "run_persona_focus_group") {
          role = "focus_group_orchestrator";
          task = "Moderating multi-round persona focus group deliberation...";
        }

        if (role) {
          setLiveDelegations((prev) => {
            if (prev.some((d) => d.id === event.toolCallId)) return prev;
            return [
              ...prev,
              {
                id: event.toolCallId,
                sub_agent: role,
                task,
                status: "running",
                result: "",
                timestamp: new Date().toISOString(),
              },
            ];
          });
        }
      },
      onToolCallArgsEvent: ({ event, toolCallName, partialToolCallArgs }) => {
        const idea = (partialToolCallArgs as any)?.idea || (partialToolCallArgs as any)?.task;
        if (idea && (toolCallName === "create_idea_personas" || toolCallName === "run_persona_focus_group")) {
          setLiveDelegations((prev) =>
            prev.map((d) =>
              d.id === event.toolCallId
                ? {
                    ...d,
                    task:
                      toolCallName === "create_idea_personas"
                        ? `Synthesizing personas for: "${idea}"`
                        : `Moderating focus group debate on: "${idea}"`,
                  }
                : d
            )
          );
        }
      },
      onToolCallResultEvent: ({ event }) => {
        const contentStr =
          typeof event.content === "string"
            ? event.content
            : JSON.stringify(event.content, null, 2);
        const hasScorecard = contentStr && contentStr.includes("Viability Scorecard");

        setLiveDelegations((prev) => {
          const updated = prev.map((d) => {
            if (d.id === event.toolCallId) {
              return {
                ...d,
                status: "completed" as const,
                result: contentStr,
              };
            }
            return d;
          });

          // Surface the viability evaluator card when the focus group deliberation finishes with the scorecard
          if (hasScorecard && !updated.some((d) => d.id === `${event.toolCallId}-eval`)) {
            const parent = updated.find((d) => d.id === event.toolCallId);
            updated.push({
              id: `${event.toolCallId}-eval`,
              sub_agent: "viability_evaluator",
              task: parent?.task
                ? parent.task.replace("Moderating focus group debate on", "Computing viability scorecard for")
                : "Computing mathematically weighted viability scorecard & strategic pivots",
              status: "completed",
              result: contentStr,
              timestamp: new Date().toISOString(),
            });
          }

          return updated;
        });
      },
    });

    return () => sub.unsubscribe();
  }, [agent]);

  // 3. Hydrate previous tool calls from conversation message history
  useEffect(() => {
    if (!agent?.messages || agent.messages.length === 0) return;

    const resultMap = new Map<string, string>();
    for (const msg of agent.messages) {
      if (msg.role === "tool" && (msg as any).toolCallId) {
        resultMap.set(
          (msg as any).toolCallId,
          typeof (msg as any).content === "string"
            ? (msg as any).content
            : JSON.stringify((msg as any).content)
        );
      }
    }

    const historyItems: SubagentDelegation[] = [];
    for (const msg of agent.messages) {
      if (msg.role === "assistant" && Array.isArray((msg as any).toolCalls)) {
        for (const tc of (msg as any).toolCalls) {
          const name = tc.function?.name;
          const result = resultMap.get(tc.id);
          let args: any = {};
          try {
            args =
              typeof tc.function?.arguments === "string"
                ? JSON.parse(tc.function.arguments)
                : tc.function?.arguments || {};
          } catch {
            // ignore JSON parse errors
          }

          if (name === "create_idea_personas") {
            historyItems.push({
              id: tc.id,
              sub_agent: "persona_generator",
              task: args.idea
                ? `Synthesizing personas for: "${args.idea}"`
                : "Synthesizing target audience personas",
              status: result ? "completed" : "running",
              result: result || "",
              timestamp: new Date().toISOString(),
            });
          } else if (name === "run_persona_focus_group") {
            const hasScorecard = result && result.includes("Viability Scorecard");
            historyItems.push({
              id: tc.id,
              sub_agent: "focus_group_orchestrator",
              task: args.idea
                ? `Moderating focus group debate on: "${args.idea}"`
                : "Moderating focus group deliberation",
              status: result ? "completed" : "running",
              result: result || "",
              timestamp: new Date().toISOString(),
            });

            if (hasScorecard) {
              historyItems.push({
                id: `${tc.id}-eval`,
                sub_agent: "viability_evaluator",
                task: args.idea
                  ? `Computing viability scorecard for: "${args.idea}"`
                  : "Computing weighted viability scorecard & strategic pivots",
                status: "completed",
                result: result,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    if (historyItems.length > 0) {
      setLiveDelegations((prev) => {
        const merged = [...prev];
        for (const item of historyItems) {
          const idx = merged.findIndex((m) => m.id === item.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...item };
          } else {
            merged.push(item);
          }
        }
        return merged;
      });
    }
  }, [agent?.messages]);

  const delegations = liveDelegations;
  const isRunning =
    (agent as any)?.isRunning ||
    delegations.some((d) => d.status === "running") ||
    false;

  const handleClearDelegations = useCallback(() => {
    setLiveDelegations([]);
  }, []);

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
