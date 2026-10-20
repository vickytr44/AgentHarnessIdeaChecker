using System.Text.Json.Serialization;

namespace AgentHarness.Models;

/// <summary>
/// A single contribution or message in a focus group round.
/// </summary>
public record FocusGroupMessage(
    [property: JsonPropertyName("personaId")] string PersonaId,
    [property: JsonPropertyName("personaName")] string PersonaName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("roundIndex")] int RoundIndex,
    [property: JsonPropertyName("roundTitle")] string RoundTitle,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("score")] double? Score = null
);

/// <summary>
/// Individual evaluation from a single persona after the deliberation rounds.
/// </summary>
public record PersonaEvaluation(
    [property: JsonPropertyName("personaId")] string PersonaId,
    [property: JsonPropertyName("personaName")] string PersonaName,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("weightage")] double Weightage,
    [property: JsonPropertyName("score")] double Score, // 1 to 10
    [property: JsonPropertyName("weightedContribution")] double WeightedContribution, // (Score * 10) * (Weightage / 100)
    [property: JsonPropertyName("verdict")] string Verdict,
    [property: JsonPropertyName("dealbreakers")] List<string> Dealbreakers,
    [property: JsonPropertyName("conditionsForAdoption")] List<string> ConditionsForAdoption
);

/// <summary>
/// Final synthesized report of the focus group deliberation.
/// </summary>
public record FocusGroupResult(
    [property: JsonPropertyName("idea")] string Idea,
    [property: JsonPropertyName("overallViabilityScore")] double OverallViabilityScore, // 0 to 100
    [property: JsonPropertyName("viabilityStatus")] string ViabilityStatus, // High, Conditional, High Risk
    [property: JsonPropertyName("executiveSummary")] string ExecutiveSummary,
    [property: JsonPropertyName("evaluations")] List<PersonaEvaluation> Evaluations,
    [property: JsonPropertyName("transcript")] List<FocusGroupMessage> Transcript,
    [property: JsonPropertyName("consensusPoints")] List<string> ConsensusPoints,
    [property: JsonPropertyName("polarizingPoints")] List<string> PolarizingPoints,
    [property: JsonPropertyName("recommendedPivots")] List<string> RecommendedPivots
);
