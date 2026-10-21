# Frontend Agent Guidelines & Conventions

This document defines the architectural standards, design principles, and coding conventions for the Next.js CopilotKit frontend. All AI agents and developers working on this codebase must strictly adhere to these guidelines.

---

## 1. Core Philosophy: CopilotKit React-First (No Hacks)

- **Use Native CopilotKit Capabilities**: Always prioritize out-of-the-box hooks and components provided by:
  - `@copilotkit/react-core/v2` (`useAgent`, `useHumanInTheLoop`, `useRenderToolCall`, `CopilotChatAssistantMessage`, etc.)
  - `@copilotkit/react-ui` (`CopilotChat`, `CopilotKit`, theme variables, slot props)
  - `@copilotkit/runtime/v2`
- **Zero Unnecessary Hacks**: Do not implement custom workarounds, DOM hacks, monkey-patches, or bypasses for features already handled by CopilotKit.
- **Strict Exception Rule**: Only implement custom logic when 100% verified that CopilotKit does not support the needed functionality, and **only** if the custom logic is small, well-isolated, and cleanly abstracted.

---

## 2. Fail Fast: Zero Fallbacks

- **Never Use Silent Fallbacks**: If an API call, agent stream, environment variable, or tool invocation fails or is invalid, fail immediately.
- **No Mock or Dummy Fallbacks**: Never inject fake fallback personas, dummy responses, mock data, or simulated success states to mask network, runtime, or LLM failures.
- **Surface Errors Clearly**: Surface failures immediately through visible error states, error boundaries, or explicit UI notifications. Silent fallbacks conceal underlying breakages and make debugging impossible.

---

## 3. SOLID Principles & Component Design

Frontend components and state management must strictly adhere to SOLID and OOP/modular design principles:

1. **Single Responsibility Principle (SRP)**:
   - Separate concerns into distinct modules:
     - **Custom Hooks** (`src/hooks/`): Manage state subscriptions, AG-UI data extraction, and stream event listening (e.g., `useSubagentDelegations`, `useHarnessTodos`).
     - **UI Components** (`src/components/`): Pure presentational or interactive components with minimal inline business logic.
     - **Pages/Layouts** (`src/app/`): High-level composition and layout structure only.
   - *Refactoring Note*: Existing files with mixed responsibilities (e.g. monolithic `page.tsx` or oversized component files) are scheduled for refactoring. New code must not repeat this anti-pattern.
2. **Open/Closed Principle (OCP)**:
   - Extend chat behavior through CopilotKit's standard extension points (`useHumanInTheLoop`, `useRenderToolCall`, message slots, custom toolbar callbacks) rather than hacking internals.
3. **Liskov Substitution Principle (LSP)**:
   - Custom slots and message renderers (e.g., `CustomAssistantMessage`) must honor the exact component prop interfaces defined by CopilotKit and render predictably.
4. **Interface Segregation Principle (ISP)**:
   - Component props must be specific and lean. Avoid passing massive monolithic context objects to child components that only need 1 or 2 fields.
5. **Dependency Inversion Principle (DIP)**:
   - Components should consume high-level abstractions or hooks rather than directly binding to raw SSE message payloads or protocol details.

---

## 4. Code Structure & Organization

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/copilotkit/   # Next.js App Router CopilotKit runtime route handler
│   │   ├── globals.css       # Global design system tokens and resets
│   │   ├── layout.tsx        # Root HTML layout and fonts
│   │   ├── page.tsx          # Clean page composition container
│   │   └── providers.tsx     # CopilotKit provider wrapper
│   ├── components/           # Modular, focused React components
│   │   ├── DelegationLog.tsx
│   │   ├── InteractiveChoiceCard.tsx
│   │   ├── PlanApprovalCard.tsx
│   │   ├── ThinkingActivityCard.tsx
│   │   └── TodoProgressBar.tsx
│   ├── hooks/                # Dedicated custom React hooks (SRP: stream listeners, agent state)
│   └── types/                # Strongly typed domain models and Zod schemas
├── AGENTS.md                 # Frontend developer and agent conventions
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript compiler configuration
```

---

## 5. CopilotKit Tools & Human-in-the-Loop (HITL) Standards

- **Strict Schema Definitions**:
  - Use `zod` to define parameters for all interactive tools and HITL actions.
  - Provide meaningful descriptions for all fields so the LLM invokes tools accurately.
- **Interactive UI Cards**:
  - Interactive cards (e.g., `InteractiveChoiceCard`, `PlanApprovalCard`) should handle user input cleanly, resolve/submit handler callbacks, and provide visual feedback for completed states.
  - Suppress default copy/inspector toolbars on pure interactive action cards without markdown text content.

---

## 6. Coding & Styling Invariants

- **TypeScript**: Strict type checking. Avoid `any` where typed interfaces can be written.
- **Styling**:
  - Use Vanilla CSS, CSS Modules, or clean global classes.
  - Avoid inline styling soup for complex layout and responsive rules.
  - Support dark mode and cohesive themes matching modern design standards.
- **Performance**:
  - Memoize heavy callbacks with `useCallback` and derived data with `useMemo`.
  - Avoid unnecessary re-renders of the chat message list during high-frequency streaming updates.
