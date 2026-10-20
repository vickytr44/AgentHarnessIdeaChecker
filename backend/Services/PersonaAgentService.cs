using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.RegularExpressions;
using AgentHarness.Models;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class PersonaAgentService : IPersonaAgentService
{
    private readonly AIAgent _agent;
    private readonly ILogger<PersonaAgentService> _logger;
    private readonly ConcurrentDictionary<string, List<Persona>> _personaCache = new();
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

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
               - **Id**: short kebab-case identifier (e.g., 'busy-commuter', 'fleet-manager', 'sensitive-rider')
               - **Name**: Archetypal persona name (e.g., 'David, The Daily Commuter')
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

        var count = personaCount is > 0 and <= 10 ? personaCount.Value : 3;
        var marketContext = string.IsNullOrWhiteSpace(targetMarket) ? "General Market & Stakeholders" : targetMarket;

        var prompt = $"""
            Please evaluate the following idea and generate {count} distinct personas with assigned weightages (summing to 100%):

            **Idea Description**:
            {idea}

            **Target Market / Segment Context**:
            {marketContext}
            """;

        var response = await _agent.RunAsync(prompt, cancellationToken: cancellationToken);
        var responseText = response.Text ?? "No persona analysis generated.";

        // Attempt to extract and cache personas
        var personas = ParsePersonasFromJson(responseText);
        if (personas.Count > 0)
        {
            _personaCache[NormalizeKey(idea)] = personas;
        }

        return responseText;
    }

    public async Task<List<Persona>> GetPersonasAsync(
        string idea,
        string? targetMarket = null,
        CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(idea);
        if (_personaCache.TryGetValue(key, out var cached) && cached.Count > 0)
        {
            return cached;
        }

        // Generate if not cached
        var text = await GeneratePersonasAsync(idea, targetMarket, 3, cancellationToken);
        var parsed = ParsePersonasFromJson(text);
        if (parsed.Count > 0)
        {
            return parsed;
        }

        // Fallback fallback default personas if JSON block was malformed
        return
        [
            new Persona("primary-user", "Alex, The Primary User", "Frequent Consumer / Commuter", "Age 25-45, Daily Rider", "Solve daily friction and inconvenience", "Stale environments and wasted time", "Reliability, cleanliness, consistency", 50.0, "Core market audience representing primary volume"),
            new Persona("operator-buyer", "Morgan, The Operations Manager", "Fleet / Facility Operator", "Mid-career professional", "Maximize efficiency and maintain customer satisfaction", "High maintenance costs and unpredictable downtime", "Low operational overhead and durable hardware", 30.0, "Decision-maker and budget holder"),
            new Persona("sensitive-edge", "Taylor, The Sensitive Stakeholder", "Health-conscious / Allergy-prone Consumer", "Health-aware user", "Avoid sensory triggers or adverse reactions", "Migraines, asthma triggers, and synthetic chemical exposure", "Hypoallergenic, natural, transparent ingredients", 20.0, "Edge-case stakeholder whose negative feedback can cause backlash")
        ];
    }

    private static string NormalizeKey(string text)
    {
        return text.Trim().ToLowerInvariant();
    }

    private static List<Persona> ParsePersonasFromJson(string text)
    {
        try
        {
            var match = Regex.Match(text, @"```json\s*(.*?)\s*```", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var jsonString = match.Success ? match.Groups[1].Value : text;

            var result = JsonSerializer.Deserialize<PersonaAnalysisResult>(jsonString, JsonOptions);
            if (result?.Personas != null && result.Personas.Count > 0)
            {
                // Ensure weights sum to 100%
                NormalizeWeights(result.Personas);
                return result.Personas;
            }
        }
        catch
        {
            // Regex/JSON extraction failed, handled gracefully by fallback
        }

        return [];
    }

    private static void NormalizeWeights(List<Persona> personas)
    {
        double sum = personas.Sum(p => p.Weightage);
        if (sum <= 0) sum = 100;
        if (Math.Abs(sum - 100.0) > 1.0)
        {
            for (int i = 0; i < personas.Count; i++)
            {
                var normalized = Math.Round((personas[i].Weightage / sum) * 100.0, 1);
                personas[i] = personas[i] with { Weightage = normalized };
            }
        }
    }
}
