using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class HarnessAgentService : IHarnessAgentService
{
    private readonly AIAgent _agent;
    private readonly ILogger<HarnessAgentService> _logger;

    public AIAgent Agent => _agent;

    public HarnessAgentService(IConfiguration configuration, ILogger<HarnessAgentService> logger)
    {
        _logger = logger;

        // Build Google Gemini ChatClient - throws if API key is missing
        IChatClient chatClient = ChatClientFactory.Create(configuration);

        var systemInstructions = """
            You are a task planning and execution assistant powered by Google Gemini and Microsoft Agent Framework Harness.
            
            ## Operating Modes:
            - 'plan' mode: Break down tasks into structured todo items using the 'todos_add' tool. Discuss the plan with the user, clarify requirements, and organize items.
            - 'execute' mode: Systematically work through each item on the todo list. When an item is finished, call 'todos_complete' to mark it complete.
            
            Always maintain your todo list accurately using the provided todo tools.
            """;

        _agent = chatClient.AsHarnessAgent(new HarnessAgentOptions
        {
            Name = "PlanningHarnessAgent",
            Description = "An agent harness capable of planning and tracking todos.",
            HarnessInstructions = "Use tools deliberately. Break complex work into clear steps and maintain the todo list.",
            DisableWebSearch = true,
            ChatOptions = new ChatOptions
            {
                Instructions = systemInstructions
            },
            LoopEvaluators =
            [
                new TodoCompletionLoopEvaluator(new TodoCompletionLoopEvaluatorOptions { Modes = ["execute"] })
            ],
            LoopAgentOptions = new LoopAgentOptions { MaxIterations = 10 }
        });

        _logger.LogInformation("PlanningHarnessAgent initialized successfully with Google Gemini.");
    }
}
