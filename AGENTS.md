# Agent Guidelines & Engineering Standards

This document establishes the overarching architectural standards and development rules for the entire project. All AI agents and developers operating in this repository must strictly adhere to these principles across both frontend and backend codebases.

---

## 1. Universal Principles

### A. Fail Fast: Zero Fallbacks (Universal Rule)
- **No Silent Fallbacks**: If any configuration, environment variable, dependency, network call, API response, tool argument, or model output is missing, invalid, or broken—**fail immediately**.
- **No Mock or Dummy Fallbacks**: Never fall back to fake mock data, hardcoded placeholder personas, simulated success responses, or dummy defaults to mask errors.
- **Fail Loudly & Surface Errors**:
  - In backend C#: Throw explicit, typed exceptions (`InvalidOperationException`, `ArgumentNullException`, `HttpRequestException`).
  - In frontend React: Surface errors immediately through visible error states, error boundaries, or toast notifications.
  - **Rationale**: Silent recovery and artificial fallbacks hide configuration drift, mask underlying bugs, and obstruct rapid debugging.

### B. Framework-First: Zero Hacks
- **Always Prefer Native Framework Primitives**:
  - **Backend**: Use `Microsoft.Agents.AI`, `Microsoft.Agents.AI.Harness`, `Microsoft.Extensions.AI`, and `Microsoft.Agents.AI.Hosting.AGUI.AspNetCore`.
  - **Frontend**: Use `@copilotkit/react-core/v2`, `@copilotkit/react-ui`, and `@copilotkit/runtime/v2`.
- **Zero Unnecessary Hacks**: Do not implement custom workarounds, DOM manipulations, monkey patches, or reinvent primitives already provided by the frameworks.
- **Strict Exception Policy**: Only implement custom logic when 100% verified that the framework does not support the requirement, and **only** if the custom logic is small, well-isolated, and built upon standard extension points (`DelegatingAIAgent`, `DelegatingHandler`, custom React slots).

### C. SOLID Principles & Clean Architecture
- **Single Responsibility (SRP)**: Keep classes, hooks, and components tightly focused on one concern.
- **Open/Closed (OCP)**: Extend behavior through framework extension points, decorators, and composition rather than modifying library internals or bloated conditionals.
- **Liskov Substitution (LSP)**: Ensure custom agents, handlers, and components strictly satisfy their base type contracts.
- **Interface Segregation (ISP)**: Create small, focused interfaces and lean component prop definitions.
- **Dependency Inversion (DIP)**: Depend on abstractions and custom hooks; inject dependencies cleanly via ASP.NET Core DI or React Context.

---

## 2. Project Subsystems & Specific Guidelines

Detailed subsystem rules and invariants are maintained in each subsystem's dedicated guidelines:

- **[Backend Guidelines (`backend/AGENTS.md`)](file:///c:/Users/vicky/.gemini/antigravity/scratch/ChatGroup/backend/AGENTS.md)**:
  - ASP.NET Core .NET 10 minimal API architecture.
  - Microsoft Agent Framework Harness planning, persona generation, and multi-agent focus group deliberation.
  - `ISubagentsStore`, `IDynamicPersonaAgentFactory`, and `GoogleThoughtSignatureHandler`.
  - AG-UI SSE endpoint mapping and structured `ILogger<T>` logging.

- **[Frontend Guidelines (`frontend/AGENTS.md`)](file:///c:/Users/vicky/.gemini/antigravity/scratch/ChatGroup/frontend/AGENTS.md)**:
  - Next.js App Router (React 19, TypeScript).
  - CopilotKit React v2 integration (`useAgent`, `useHumanInTheLoop`, `useRenderToolCall`, `CopilotChat`).
  - Interactive Human-in-the-Loop (HITL) card patterns (`InteractiveChoiceCard`, `PlanApprovalCard`).
  - Modular refactoring targets: decomposing monolithic files into focused custom hooks (`src/hooks/`) and pure presentation components (`src/components/`).
