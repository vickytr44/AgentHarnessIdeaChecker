using System.Text.Json.Serialization;

namespace AgentHarness.Models;

/// <summary>
/// Represents an audience persona for an evaluated idea.
/// </summary>
public record Persona(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("demographics")] string Demographics,
    [property: JsonPropertyName("goals")] string Goals,
    [property: JsonPropertyName("painPoints")] string PainPoints,
    [property: JsonPropertyName("keyNeeds")] string KeyNeeds,
    [property: JsonPropertyName("weightage")] double Weightage,
    [property: JsonPropertyName("weightageRationale")] string WeightageRationale
);

/// <summary>
/// Result returned by the Persona Generator Agent.
/// </summary>
public record PersonaAnalysisResult(
    [property: JsonPropertyName("idea")] string Idea,
    [property: JsonPropertyName("summary")] string Summary,
    [property: JsonPropertyName("personas")] List<Persona> Personas,
    [property: JsonPropertyName("totalWeightage")] double TotalWeightage,
    [property: JsonPropertyName("recommendation")] string Recommendation
);
