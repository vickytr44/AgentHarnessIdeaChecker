# Backend Agent Guidelines & Conventions

This document defines the architectural standards, design principles, and coding conventions for the ASP.NET Core backend (`AgentHarness`). All AI agents and developers working on this codebase must strictly adhere to these guidelines.

---

## 1. Core Philosophy: Framework-First (No Hacks)

- **Use Native Capabilities**: Always prioritize out-of-the-box abstractions provided by:
  - `Microsoft.Agents.AI` and `Microsoft.Agents.AI.Harness`
  - `Microsoft.Extensions.AI`
  - `Microsoft.Agents.AI.Hosting.AGUI.AspNetCore`
- **Zero Unnecessary Hacks**: Do not create custom workarounds, bypasses, or ad-hoc reinventions of features natively supported by the framework (e.g., session handling, tool calling, evaluators, agent loops, streaming updates).
- **Strict Exception Rule**: Only implement custom logic when 100% verified that the framework does not support the requirement, and **only** if the custom logic is small, well-isolated, and adheres to standard framework extension points:
  - Custom HTTP transports: Implement as standard `DelegatingHandler` (e.g., `GoogleThoughtSignatureHandler`).
  - Custom agent pipelines: Implement as standard `DelegatingAIAgent` (e.g., `SubagentsAgent`).

---

## 2. Fail Fast: Zero Fallbacks

- **Never Use Silent Fallbacks**: If a required configuration, credential, dependency, API response, or argument is missing, invalid, or broken, fail immediately.
- **No Mock or Dummy Fallbacks**: Never fall back to mock data, hardcoded dummy personas, placeholder text, or fake results when an external service, tool, or model fails.
- **Expose Errors Immediately**: Throw explicit, informative exceptions (e.g., `InvalidOperationException`, `ArgumentNullException`, `HttpRequestException`). Silent recovery and hidden fallbacks mask bugs, configuration drift, and broken states.

---

## 3. SOLID Principles & OOP Standards

Every service, agent wrapper, and component in `backend/Services/` must adhere to SOLID principles:

1. **Single Responsibility Principle (SRP)**:
   - Each class must have one clearly defined responsibility.
   - Persona generation (`PersonaAgentService`), dynamic agent instantiation (`DynamicPersonaAgentFactory`), multi-round debate moderation (`FocusGroupOrchestrator`), and scorecard calculation (`IdeaViabilityEvaluator`) must remain separate classes.
2. **Open/Closed Principle (OCP)**:
   - Extend behaviors using decorator/delegation patterns (`DelegatingAIAgent`, `DelegatingHandler`) without altering framework types or base implementations.
3. **Liskov Substitution Principle (LSP)**:
   - Implementations must honor base contracts (`AIAgent`, `IChatClient`, `HttpMessageHandler`) without unexpected side effects or broken preconditions.
4. **Interface Segregation Principle (ISP)**:
   - Prefer small, client-specific interfaces (`IDynamicPersonaAgentFactory`, `IFocusGroupOrchestrator`, `ISubagentsStore`, `IIdeaViabilityEvaluator`, `IPersonaAgentService`, `IHarnessAgentService`).
   - Consumers depend only on the specific methods they call.
5. **Dependency Inversion Principle (DIP)**:
   - Depend on abstractions, not concretions.
   - All services must be registered in the ASP.NET Core DI container (`Program.cs`) and injected via constructors.
   - Avoid direct instantiation of dependencies (`new SomeService()`) within consumer classes.

---

## 4. Code Structure & Organization

```
backend/
├── Models/              # Domain models, request/response DTOs, immutable C# records
├── Services/            # Business logic, interfaces (I*.cs), factories, and orchestrators
├── Properties/          # Launch settings and assembly metadata
├── tests/               # Backend integration and AG-UI test suites
├── Program.cs           # Web application bootstrap, DI registrations, middleware, AG-UI endpoint
├── AgentHarness.csproj  # Target framework (.NET 10), package references, build settings
└── AGENTS.md            # Backend developer and agent instructions
```

---

## 5. Coding & Implementation Invariants

- **C# Language Features**: Target `.NET 10`. Use modern C# features (records, pattern matching, primary constructors where appropriate, nullable reference types enabled).
- **Asynchronous Programming**:
  - All I/O and agent interactions must be `async Task` or `IAsyncEnumerable`.
  - Always accept and propagate `CancellationToken` across all asynchronous call chains.
- **Logging**:
  - Inject and use `ILogger<T>` in every service class.
  - Log significant state transitions (agent creation, deliberation rounds, tool invocations, error handling) with structured parameters.
- **Error Handling**:
  - Catch specific exceptions, log meaningful context, update delegation state stores if applicable, and avoid swallowing exceptions silently.
- **Data Transfer & Models**:
  - Use immutable C# `record` types with typed properties.
  - Avoid untyped string-based messaging where structured contracts can be defined.

---

## 6. Agent Harness & AG-UI Best Practices

- **Harness Agent Setup**:
  - Configure the main coordinator agent with `AsHarnessAgent(HarnessAgentOptions)`.
  - Equip tools cleanly using `AIFunctionFactory.Create(...)` with rich `[Description]` attributes for parameters.
  - Keep agent instructions concise, structured, and focused on coordinating specialist tools.
- **Streaming & AG-UI**:
  - Expose the agent via `MapAGUIServer("/ag-ui", agent)`.
  - Maintain session state via `InMemoryAgentSessionStore` or registered `AgentSessionStore`.
  - Send UI streaming events using typed `DataContent` and strict JSON serialization.
