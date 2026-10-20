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
        ILogger<HarnessAgentService> logger)
    {
        _logger = logger;

        // Build Google Gemini ChatClient - throws if API key is missing
        IChatClient chatClient = ChatClientFactory.Create(configuration);

        // Create tool that delegates to the Persona Generator sub-agent
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

        var systemInstructions = """
            You are the Idea Checker coordinator assistant powered by Google Gemini and Microsoft Agent Framework Harness.

            Your purpose is to help users validate, refine, and stress-test product and business ideas.

            ## Capabilities & Sub-Agents:
            - **Persona Generator Sub-Agent (`create_idea_personas`)**:
              Whenever a user shares an idea or asks for customer segments, personas, or target audience validation, call the `create_idea_personas` tool. This specialist agent evaluates the idea, constructs comprehensive buyer/user personas, and assigns normalized market weightages (summing to 100%).

            ## Operating Modes:
            - 'plan' mode:
              1. Break down idea evaluation into structured todo items using 'todos_add' (e.g., 'Analyze value proposition', 'Generate target audience personas with weightages', 'Identify highest-weight persona risks').
              2. Discuss the plan with the user, clarify requirements or target market constraints, and organize items.
            - 'execute' mode:
              1. Systematically work through each item on the todo list.
              2. Invoke 'create_idea_personas' to generate the personas and weightages.
              3. When an item is finished, call 'todos_complete' to mark it complete.

            Always maintain your todo list accurately using the provided todo tools and leverage the 'create_idea_personas' sub-agent tool for audience analysis.
            """;

        _agent = chatClient.AsHarnessAgent(new HarnessAgentOptions
        {
            Name = "PlanningHarnessAgent",
            Description = "An agent harness capable of planning and tracking todos with idea persona generation sub-agents.",
            HarnessInstructions = "Use tools deliberately. Break complex work into clear steps, maintain the todo list, and delegate persona generation to the specialist tool.",
            DisableWebSearch = true,
            ChatOptions = new ChatOptions
            {
                Instructions = systemInstructions,
                Tools = [createPersonasTool]
            },
            LoopEvaluators =
            [
                new TodoCompletionLoopEvaluator(new TodoCompletionLoopEvaluatorOptions { Modes = ["execute"] })
            ],
            LoopAgentOptions = new LoopAgentOptions { MaxIterations = 10 }
        });

        _logger.LogInformation("PlanningHarnessAgent initialized successfully with PersonaGenerator sub-agent.");
    }
}
