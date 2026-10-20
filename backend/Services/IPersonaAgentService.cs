using Microsoft.Agents.AI;

namespace AgentHarness.Services;

public interface IPersonaAgentService
{
    /// <summary>
    /// Gets the underlying AIAgent for the Persona Generator.
    /// </summary>
    AIAgent Agent { get; }

    /// <summary>
    /// Evaluates an idea, generates user personas, and assigns normalized percentage weightages.
    /// </summary>
    /// <param name="idea">The product, business, or feature idea to evaluate.</param>
    /// <param name="targetMarket">Optional guidance or market constraints.</param>
    /// <param name="personaCount">Optional count of personas to generate (default 3 to 5).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Formatted analysis containing markdown details and structured JSON data.</returns>
    Task<string> GeneratePersonasAsync(
        string idea,
        string? targetMarket = null,
        int? personaCount = null,
        CancellationToken cancellationToken = default);
}
