using System.Text.RegularExpressions;
using AgentHarness.Models;
using Microsoft.Agents.AI;

namespace AgentHarness.Services;

public class FocusGroupOrchestrator : IFocusGroupOrchestrator
{
    private readonly IDynamicPersonaAgentFactory _factory;
    private readonly ILogger<FocusGroupOrchestrator> _logger;

    public FocusGroupOrchestrator(
        IDynamicPersonaAgentFactory factory,
        ILogger<FocusGroupOrchestrator> logger)
    {
        _factory = factory;
        _logger = logger;
    }

    public async Task<(List<FocusGroupMessage> Transcript, List<PersonaEvaluation> Evaluations)> DeliberateAsync(
        string idea,
        IReadOnlyList<Persona> personas,
        int maxRounds = 2,
        CancellationToken cancellationToken = default)
    {
        var rounds = Math.Clamp(maxRounds, 2, 3);
        _logger.LogInformation("Starting focus group deliberation on idea with {Count} personas. Discussion rounds: {Rounds}",
            personas.Count, rounds);

        var transcript = new List<FocusGroupMessage>();
        var evaluations = new List<PersonaEvaluation>();

        // Materialize dynamic AIAgent and AgentSession for each persona
        var personaAgents = new List<(Persona Persona, AIAgent Agent, AgentSession Session)>();
        foreach (var p in personas)
        {
            var agent = _factory.CreatePersonaAgent(p);
            var session = await agent.CreateSessionAsync(cancellationToken);
            personaAgents.Add((p, agent, session));
        }

        // =================================================================
        // ROUND 1: First Impressions & Individual Initial Reactions
        // =================================================================
        _logger.LogInformation("--- Commencing Round 1: First Impressions ---");
        var round1Responses = new List<(Persona Persona, string Response)>();

        foreach (var (p, agent, session) in personaAgents)
        {
            var prompt = $"""
                We are presenting this product/business idea to you:
                "{idea}"

                As {p.Name} ({p.Role}):
                1. What is your honest, unfiltered first reaction?
                2. How would this impact your daily life, routine, or work?
                3. What immediate concerns or skepticism do you have?
                4. Give an initial rating from 1 to 10 (where 10 is an urgent must-have and 1 is useless/harmful).
                """;

            var resp = await agent.RunAsync(prompt, session: session, cancellationToken: cancellationToken);
            var content = resp.Text ?? string.Empty;
            round1Responses.Add((p, content));

            transcript.Add(new FocusGroupMessage(
                PersonaId: p.Id,
                PersonaName: p.Name,
                Role: p.Role,
                RoundIndex: 1,
                RoundTitle: "First Impressions & Pain Point Fit",
                Content: content
            ));

            // Brief throttle to avoid hitting API rate limits
            await Task.Delay(1000, cancellationToken);
        }

        // =================================================================
        // ROUND 2: Cross-Talk & Counter-Debate
        // =================================================================
        _logger.LogInformation("--- Commencing Round 2: Cross-Talk & Peer Deliberation ---");
        bool isFinalRound = (rounds == 2);

        foreach (var (p, agent, session) in personaAgents)
        {
            var otherRemarks = string.Join("\n\n", round1Responses
                .Where(r => r.Persona.Id != p.Id)
                .Select(r => $"• **{r.Persona.Name} ({r.Persona.Role})** said:\n\"{r.Response.Trim()}\""));

            var prompt = isFinalRound
                ? $"""
                    Here is what other focus group participants said:
                    {otherRemarks}

                    As {p.Name} ({p.Role}), deliver your peer reaction AND your final verdict in this exact format:
                    
                    REACTION: [Briefly react to what the other participants said. Do you agree, push back, or see a risk they missed?]
                    
                    FINAL_SCORE: [a number from 1.0 to 10.0]
                    VERDICT: [One sentence stating your ultimate stance]
                    DEALBREAKERS: [List 1-3 critical flaws or non-negotiable risks, or 'None']
                    CONDITIONS: [List 1-3 specific conditions, features, or guarantees you require to adopt/pay for this]
                    """
                : $"""
                    Here is what other members of the focus group had to say:
                    {otherRemarks}

                    As {p.Name} ({p.Role}):
                    - How do you respond to their perspectives?
                    - Do their concerns resonate with you, or do you disagree?
                    - Does someone else's point highlight a risk or benefit you hadn't considered?
                    Keep your response concise, authentic, and directly addressed to the panel.
                    """;

            var resp = await agent.RunAsync(prompt, session: session, cancellationToken: cancellationToken);
            var content = resp.Text ?? string.Empty;

            double? roundScore = null;
            if (isFinalRound)
            {
                double score = ExtractScore(content, defaultScore: 5.0);
                roundScore = score;
                var verdict = ExtractField(content, "VERDICT", "Neutral interest.");
                var dealbreakers = ExtractList(content, "DEALBREAKERS");
                var conditions = ExtractList(content, "CONDITIONS");
                var weightedContribution = Math.Round((score * 10.0) * (p.Weightage / 100.0), 2);

                evaluations.Add(new PersonaEvaluation(
                    PersonaId: p.Id,
                    PersonaName: p.Name,
                    Role: p.Role,
                    Weightage: p.Weightage,
                    Score: score,
                    WeightedContribution: weightedContribution,
                    Verdict: verdict,
                    Dealbreakers: dealbreakers,
                    ConditionsForAdoption: conditions
                ));
            }

            transcript.Add(new FocusGroupMessage(
                PersonaId: p.Id,
                PersonaName: p.Name,
                Role: p.Role,
                RoundIndex: 2,
                RoundTitle: isFinalRound ? "Peer Deliberation & Final Verdict" : "Cross-Talk & Peer Deliberation",
                Content: content,
                Score: roundScore
            ));

            await Task.Delay(1000, cancellationToken);
        }

        if (rounds == 2)
        {
            return (transcript, evaluations);
        }

        // =================================================================
        // ROUND 3: Final Verdict & Scoring (if 3 rounds requested)
        // =================================================================
        _logger.LogInformation("--- Commencing Round 3: Final Verdict & Scoring ---");

        foreach (var (p, agent, session) in personaAgents)
        {
            var prompt = $"""
                The focus group discussion is concluding. Deliver your final verdict on the idea:
                "{idea}"

                Provide your response strictly in the following format:
                FINAL_SCORE: [a number from 1.0 to 10.0]
                VERDICT: [One sentence stating your ultimate stance]
                DEALBREAKERS: [List 1-3 critical flaws or non-negotiable risks, or 'None']
                CONDITIONS: [List 1-3 specific conditions, features, or guarantees you require to adopt/pay for this]
                """;

            var resp = await agent.RunAsync(prompt, session: session, cancellationToken: cancellationToken);
            var content = resp.Text ?? string.Empty;

            double score = ExtractScore(content, defaultScore: 5.0);
            var verdict = ExtractField(content, "VERDICT", "Neutral interest.");
            var dealbreakers = ExtractList(content, "DEALBREAKERS");
            var conditions = ExtractList(content, "CONDITIONS");
            var weightedContribution = Math.Round((score * 10.0) * (p.Weightage / 100.0), 2);

            evaluations.Add(new PersonaEvaluation(
                PersonaId: p.Id,
                PersonaName: p.Name,
                Role: p.Role,
                Weightage: p.Weightage,
                Score: score,
                WeightedContribution: weightedContribution,
                Verdict: verdict,
                Dealbreakers: dealbreakers,
                ConditionsForAdoption: conditions
            ));

            transcript.Add(new FocusGroupMessage(
                PersonaId: p.Id,
                PersonaName: p.Name,
                Role: p.Role,
                RoundIndex: 3,
                RoundTitle: "Final Verdict & Scoring",
                Content: content,
                Score: score
            ));

            await Task.Delay(1000, cancellationToken);
        }

        return (transcript, evaluations);
    }

    private static double ExtractScore(string text, double defaultScore)
    {
        var match = Regex.Match(text, @"FINAL_SCORE:\s*([0-9]+(?:\.[0-9]+)?)", RegexOptions.IgnoreCase);
        if (match.Success && double.TryParse(match.Groups[1].Value, out var val))
        {
            return Math.Clamp(val, 1.0, 10.0);
        }

        var altMatch = Regex.Match(text, @"([0-9]+(?:\.[0-9]+)?)\s*/\s*10", RegexOptions.IgnoreCase);
        if (altMatch.Success && double.TryParse(altMatch.Groups[1].Value, out var altVal))
        {
            return Math.Clamp(altVal, 1.0, 10.0);
        }

        return defaultScore;
    }

    private static string ExtractField(string text, string fieldName, string defaultVal)
    {
        var match = Regex.Match(text, $@"{fieldName}:\s*([^\n\r]+)", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value.Trim() : defaultVal;
    }

    private static List<string> ExtractList(string text, string sectionName)
    {
        var list = new List<string>();
        var pattern = $@"{sectionName}:\s*(.*?)(?=(?:FINAL_SCORE|VERDICT|DEALBREAKERS|CONDITIONS):|$)";
        var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (match.Success)
        {
            var raw = match.Groups[1].Value.Trim();
            var lines = raw.Split(['\n', '\r'], StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                var clean = line.Trim().TrimStart('-', '*', '•', '1', '2', '3', '.', ' ').Trim();
                if (!string.IsNullOrWhiteSpace(clean) && !clean.Equals("None", StringComparison.OrdinalIgnoreCase))
                {
                    list.Add(clean);
                }
            }
        }
        return list;
    }
}
