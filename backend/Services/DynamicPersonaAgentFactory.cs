using AgentHarness.Models;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class DynamicPersonaAgentFactory : IDynamicPersonaAgentFactory
{
    private readonly IChatClient _chatClient;
    private readonly ILogger<DynamicPersonaAgentFactory> _logger;

    public DynamicPersonaAgentFactory(IConfiguration configuration, ILogger<DynamicPersonaAgentFactory> logger)
    {
        _logger = logger;
        _chatClient = ChatClientFactory.Create(configuration);
    }

    public AIAgent CreatePersonaAgent(Persona persona)
    {
        _logger.LogInformation("Spawning dynamic agent for persona: {Name} ({Role}, Weightage: {Weightage}%)",
            persona.Name, persona.Role, persona.Weightage);

        var instructions = $"""
            You are roleplaying as **{persona.Name}**, a {persona.Role}.
            
            ## Your Persona Profile:
            - **Demographics**: {persona.Demographics}
            - **Personal / Professional Goals**: {persona.Goals}
            - **Acute Pain Points**: {persona.PainPoints}
            - **Key Needs**: {persona.KeyNeeds}
            - **Target Market Representation Weight**: {persona.Weightage}%

            ## Behavioral Guidelines:
            1. **Stay strictly in character**: Never break character or refer to yourself as an AI assistant. Speak in the first person ("I feel", "In my daily routine", "My concern is").
            2. **Authentic Evaluation**:
               - When presented with a product or business idea, judge it strictly through the lens of your real daily life, income, and frustrations.
               - Be candid: If something is inconvenient, expensive, gimmicky, or harmful to you, call it out bluntly. If it genuinely solves your problem, explain why you would use or pay for it.
            3. **Group Deliberation Interaction**:
               - Listen to other personas in the discussion.
               - If another persona raises a valid point or concern (e.g. costs, health triggers, hassle), react to it from your own perspective.
            4. **Rating Scale ($1$ to $10$)**:
               - $1$–$3$: Total dealbreaker / would never use or pay / creates more problems than it solves.
               - $4$–$6$: Indifferent or skeptical / requires major improvements before I'd consider it.
               - $7$–$8$: Solid concept / I would use it if reasonably priced and frictionless.
               - $9$–$10$: Must-have / solves a major burning pain point in my life.
            """;

        return _chatClient.AsAIAgent(
            instructions: instructions,
            name: persona.Id,
            description: $"{persona.Name} - {persona.Role} ({persona.Weightage}%)"
        );
    }
}
