"use client";

import React from "react";
import { CopilotChat } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f9fafb" }}>
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#111827" }}>
            MS Agent Harness (.NET) + CopilotKit
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Connected to Microsoft Agent Framework on <code>http://localhost:5053/ag-ui</code>
          </p>
        </div>
      </header>
      <div style={{ flex: 1, height: "calc(100vh - 73px)" }}>
        <CopilotChat
          labels={{
            title: "Agent Assistant",
            initial: "Hi! I am connected to your MS Agent Harness (.NET) agent. How can I help you today?",
          }}
          className="h-full"
        />
      </div>
    </main>
  );
}
