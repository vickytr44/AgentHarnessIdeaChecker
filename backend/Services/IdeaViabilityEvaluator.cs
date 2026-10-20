using System.Text.Json;
using AgentHarness.Models;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public class IdeaViabilityEvaluator : IIdeaViabilityEvaluator
{
    private readonly AIAgent _synthesizerAgent;
    private readonly ILogger<IdeaViabilityEvaluator> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public IdeaViabilityEvaluator(IConfiguration configuration, ILogger<IdeaViabilityEvaluator> logger)
    {
        _logger = logger;
        var chatClient = ChatClientFactory.Create(configuration);

        var instructions = """
            You are the Strategic Viability Analyst for the Idea Checker platform.
            Your job is to objectively analyze focus group deliberation transcripts and persona evaluations.
            Identify:
            1. The common ground / consensus among all personas.
            2. The polarizing friction points or conflicts between segments.
            3. The dealbreakers that would kill adoption.
            4. Concrete product pivots and risk mitigations required for market success.
            """;

        _synthesizerAgent = chatClient.AsAIAgent(
            instructions: instructions,
            name: "ViabilitySynthesizer",
            description: "Analyzes focus group transcripts and extracts strategic insights."
        );
    }

    public async Task<string> EvaluateAsync(
        string idea,
        List<PersonaEvaluation> evaluations,
        List<FocusGroupMessage> transcript,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Calculating viability index for idea: {Idea}", idea);

        // Compute mathematical weighted viability score
        double totalWeightedScore = 0.0;
        foreach (var ev in evaluations)
        {
            totalWeightedScore += ev.WeightedContribution;
        }
        totalWeightedScore = Math.Round(Math.Clamp(totalWeightedScore, 0.0, 100.0), 1);

        var status = totalWeightedScore switch
        {
            >= 75.0 => "High Viability / Strong Market Demand",
            >= 50.0 => "Moderate / Conditional Viability (Pivots Required)",
            _ => "High Risk / Critical Friction"
        };

        // Prepare context for the synthesizer LLM to extract strategic consensus, polarization, and pivots
        var evaluationSummary = string.Join("\n", evaluations.Select(e =>
            $"- **{e.PersonaName} ({e.Role})**: Score: {e.Score}/10 | Weight: {e.Weightage}% | Weighted: {e.WeightedContribution} pts | Verdict: {e.Verdict} | Dealbreakers: {string.Join(", ", e.Dealbreakers)} | Conditions: {string.Join(", ", e.ConditionsForAdoption)}"));

        var keyQuotes = string.Join("\n", transcript.TakeLast(6).Select(m =>
            $"- [{m.RoundTitle}] {m.PersonaName}: \"{m.Content.Trim()}\""));

        var prompt = $"""
            Analyze the following focus group outcome for the idea:
            "{idea}"

            Overall Mathematically Weighted Score: {totalWeightedScore}/100 ({status})

            Persona Evaluations:
            {evaluationSummary}

            Recent Discussion Highlights:
            {keyQuotes}

            Please provide a concise synthesis with:
            1. Executive Market Assessment (2-3 sentences)
            2. 2-3 Consensus Points across the personas
            3. 2-3 Polarizing Points or Core Conflicts
            4. 3 Actionable Product Pivots / Solutions to unlock skeptical personas
            """;

        var synthesisResponse = await _synthesizerAgent.RunAsync(prompt, cancellationToken: cancellationToken);
        var synthesisText = synthesisResponse.Text ?? string.Empty;

        // Build clean markdown report
        var report = $"""
            # Focus Group Viability Scorecard

            ## Overall Viability Index: **{totalWeightedScore} / 100** — *{status}*

            ### Persona Score Breakdown:
            | Persona | Role | Weight | Raw Score (1-10) | Weighted Contribution | Verdict |
            | :--- | :--- | :---: | :---: | :---: | :--- |
            {string.Join("\n", evaluations.Select(e => $"| **{e.PersonaName}** | {e.Role} | {e.Weightage}% | {e.Score:0.0} / 10 | **+{e.WeightedContribution:0.0} pts** | {e.Verdict} |"))}

            ---

            ## Strategic Synthesis & Focus Group Analysis
            {synthesisText}

            ---

            ### Focus Group Discussion Transcript:
            {string.Join("\n\n", transcript.Select(m => $"> **{m.PersonaName} ({m.Role})** — *{m.RoundTitle}*\n>\n> {m.Content.Replace("\n", "\n> ")}"))}
            """;

        return report;
    }
}
