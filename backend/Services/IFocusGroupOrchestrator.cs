using AgentHarness.Models;

namespace AgentHarness.Services;

public interface IFocusGroupOrchestrator
{
    /// <summary>
    /// Conducts a multi-round focus group deliberation between dynamically spawned persona agents.
    /// </summary>
    /// <param name="idea">The product or business idea being evaluated.</param>
    /// <param name="personas">The list of personas and their weightages.</param>
    /// <param name="maxRounds">Number of deliberation rounds (typically 2 to 3).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Complete focus group deliberation transcript and per-persona evaluations.</returns>
    Task<(List<FocusGroupMessage> Transcript, List<PersonaEvaluation> Evaluations)> DeliberateAsync(
        string idea,
        IReadOnlyList<Persona> personas,
        int maxRounds = 3,
        CancellationToken cancellationToken = default);
}
