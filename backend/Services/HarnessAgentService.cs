using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class HarnessAgentService : IHarnessAgentService
{
    private readonly AIAgent _agent;
    private readonly ILogger<HarnessAgentService> _logger;

    public AIAgent Agent => _agent;

    public HarnessAgentService(
        IConfiguration configuration,
        IPersonaAgentService personaAgentService,
        IFocusGroupOrchestrator focusGroupOrchestrator,
        IIdeaViabilityEvaluator viabilityEvaluator,
        ILogger<HarnessAgentService> logger)
    {
        _logger = logger;

        // Build Google Gemini ChatClient - throws if API key is missing
        IChatClient chatClient = ChatClientFactory.Create(configuration);

        // Tool 1: Create Personas
        var createPersonasTool = AIFunctionFactory.Create(
            async (
                [Description("The product, feature, or business idea to analyze and generate personas for.")] string idea,
                [Description("Optional target market context or geographic/industry constraints.")] string? targetMarket,
                [Description("Optional number of personas to generate (typically 3 to 5).")] int? personaCount,
                CancellationToken cancellationToken) =>
            {
                logger.LogInformation("Coordinator delegating to PersonaGeneratorAgent for idea: {Idea}", idea);
                return await personaAgentService.GeneratePersonasAsync(idea, targetMarket, personaCount, cancellationToken);
            },
            name: "create_idea_personas",
            description: "Invokes the Persona Generator sub-agent to synthesize distinct target audience personas and assign normalized priority weightages summing to 100% for an idea."
        );

        // Tool 2: Run Focus Group Deliberation & Viability Evaluation
        var runFocusGroupTool = AIFunctionFactory.Create(
            async (
                [Description("The product or business idea being evaluated in the focus group.")] string idea,
                [Description("Optional target market context or customer segment guidance.")] string? targetMarket,
                [Description("Number of discussion rounds (2 or 3 rounds max). Default is 3.")] int? rounds,
                CancellationToken cancellationToken) =>
            {
                logger.LogInformation("Coordinator initiating dynamic Persona Focus Group for idea: {Idea}", idea);

                // 1. Retrieve or generate the declarative personas
                var personas = await personaAgentService.GetPersonasAsync(idea, targetMarket, cancellationToken);

                // 2. Run multi-agent focus group deliberation
                var deliberationRounds = Math.Clamp(rounds ?? 3, 2, 3);
                var (transcript, evaluations) = await focusGroupOrchestrator.DeliberateAsync(
                    idea,
                    personas,
                    deliberationRounds,
                    cancellationToken);

                // 3. Compute weighted viability scorecard and strategic synthesis
                var report = await viabilityEvaluator.EvaluateAsync(idea, evaluations, transcript, cancellationToken);
                return report;
            },
            name: "run_persona_focus_group",
            description: "Spawns dynamic in-character persona agents to conduct a 2 to 3 round focus group debate (first impressions, cross-talk conflict, final verdict), and produces a mathematically weighted viability scorecard with critical dealbreakers."
        );

        var systemInstructions = """
            You are the Idea Checker coordinator assistant powered by Google Gemini and Microsoft Agent Framework Harness.

            Your purpose is to help users validate, refine, and stress-test product and business ideas using multi-agent focus groups.

            ## Available Specialist Sub-Agents & Tools:
            1. **`create_idea_personas`**:
               Generates distinct target audience personas with pain points, key needs, and normalized market weightages (summing to 100%).
            2. **`run_persona_focus_group`**:
               Dynamically spawns in-character agents for each persona, runs a 2 to 3 round moderated focus group (Round 1: First Impressions & Initial Scores; Round 2: Cross-Talk & Conflict Debate; Round 3: Final Verdict), and computes the overall mathematically weighted viability score ($0$ to $100$) with dealbreakers and recommended pivots.

            ## Operating Modes:
            - **'plan' mode**:
              1. Break down idea evaluation into structured todo items using 'todos_add':
                 - Todo 1: Analyze core concept and market context.
                 - Todo 2: Generate target audience personas & weightages (`create_idea_personas`).
                 - Todo 3: Conduct multi-agent focus group deliberation (`run_persona_focus_group`).
                 - Todo 4: Synthesize weighted viability score, critical dealbreakers, and strategic recommendations.
              2. Discuss the plan with the user, clarify requirements, and ask for approval to execute.
            - **'execute' mode**:
              1. Systematically execute each step.
              2. Call the tools (`create_idea_personas` and `run_persona_focus_group`) to simulate the dynamic focus group and calculate viability.
              3. When each item is finished, call 'todos_complete' to mark it complete.

            Always maintain your todo list accurately and present both the focus group discussion highlights and the weighted viability scorecard clearly.
            """;

        _agent = chatClient.AsHarnessAgent(new HarnessAgentOptions
        {
            Name = "PlanningHarnessAgent",
            Description = "An agent harness capable of planning and tracking todos with idea persona generation and focus group deliberation sub-agents.",
            HarnessInstructions = "Use tools deliberately. Break complex work into clear steps, maintain the todo list, and delegate persona generation and focus group simulation to the specialist tools.",
            DisableWebSearch = true,
            ChatOptions = new ChatOptions
            {
                Instructions = systemInstructions,
                Tools = [createPersonasTool, runFocusGroupTool]
            },
            LoopEvaluators =
            [
                new TodoCompletionLoopEvaluator(new TodoCompletionLoopEvaluatorOptions { Modes = ["execute"] })
            ],
            LoopAgentOptions = new LoopAgentOptions { MaxIterations = 10 }
        });

        _logger.LogInformation("PlanningHarnessAgent initialized successfully with PersonaGenerator and FocusGroup sub-agents.");
    }
}
