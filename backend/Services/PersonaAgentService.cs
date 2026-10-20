using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class PersonaAgentService : IPersonaAgentService
{
    private readonly AIAgent _agent;
    private readonly ILogger<PersonaAgentService> _logger;

    public AIAgent Agent => _agent;

    public PersonaAgentService(IConfiguration configuration, ILogger<PersonaAgentService> logger)
    {
        _logger = logger;

        IChatClient chatClient = ChatClientFactory.Create(configuration);

        var systemInstructions = """
            You are the Persona Generator Specialist Agent in the Idea Checker platform.
            Your role is to deeply analyze product concepts, startups, or business ideas and synthesize realistic, actionable audience personas.

            For any idea given to you:
            1. Identify distinct customer segments (such as primary early adopters, secondary users, enterprise/business buyers, and skeptical edge cases).
            2. For each persona, establish:
               - **Id**: short kebab-case identifier (e.g., 'busy-parent', 'freelance-designer')
               - **Name**: Archetypal persona name (e.g., 'Sarah, The Multitasking Parent')
               - **Role / Occupation**: Their professional or daily role
               - **Demographics**: Relevant age range, income, location, or tech proficiency
               - **Goals**: What they aspire to achieve in the problem domain
               - **Pain Points**: Their current acute frustrations and blockers
               - **Key Needs**: What specifically they need from this idea to become loyal users
               - **Weightage**: A numeric percentage between 1 and 100 representing their proportion/priority in the target market.
                 CRITICAL: The sum of all persona weightages MUST equal exactly 100%.
               - **Weightage Rationale**: Clear reasoning for why this weightage was assigned based on market prevalence, willingness to pay, and problem urgency.

            3. Format your response cleanly:
               - Start with an executive summary of the target market analysis.
               - Present a formatted Markdown comparison table displaying each Persona, Role, Weightage %, and Key Need.
               - Provide a detailed profile breakdown for each persona.
               - Conclude with a valid JSON block enclosed strictly in ```json ... ``` tags following this structure:
                 {
                   "idea": "idea summary",
                   "summary": "market analysis summary",
                   "personas": [
                     {
                       "id": "persona-id",
                       "name": "Persona Name",
                       "role": "Role",
                       "demographics": "...",
                       "goals": "...",
                       "painPoints": "...",
                       "keyNeeds": "...",
                       "weightage": 35.0,
                       "weightageRationale": "..."
                     }
                   ],
                   "totalWeightage": 100.0,
                   "recommendation": "strategic recommendation"
                 }
            """;

        _agent = chatClient.AsAIAgent(
            instructions: systemInstructions,
            name: "PersonaGeneratorAgent",
            description: "Specialist agent that analyzes product ideas, generates detailed customer personas, and computes market priority weightages summing to 100%."
        );

        _logger.LogInformation("PersonaGeneratorAgent initialized successfully.");
    }

    public async Task<string> GeneratePersonasAsync(
        string idea,
        string? targetMarket = null,
        int? personaCount = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Generating personas for idea: {Idea}", idea);

        var count = personaCount is > 0 and <= 10 ? personaCount.Value : 4;
        var marketContext = string.IsNullOrWhiteSpace(targetMarket) ? "Global / General Consumer & Professional" : targetMarket;

        var prompt = $"""
            Please evaluate the following idea and generate {count} distinct personas with assigned weightages (summing to 100%):

            **Idea Description**:
            {idea}

            **Target Market / Segment Context**:
            {marketContext}
            """;

        var response = await _agent.RunAsync(prompt, cancellationToken: cancellationToken);
        return response.Text ?? "No persona analysis generated.";
    }
}
