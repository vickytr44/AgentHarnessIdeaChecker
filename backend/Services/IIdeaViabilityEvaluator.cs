using AgentHarness.Models;

namespace AgentHarness.Services;

public interface IIdeaViabilityEvaluator
{
    /// <summary>
    /// Synthesizes the focus group transcript and persona evaluations into a comprehensive viability report.
    /// </summary>
    /// <param name="idea">The evaluated idea.</param>
    /// <param name="evaluations">The persona evaluations with individual scores and weights.</param>
    /// <param name="transcript">The complete deliberation transcript.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Formatted report with executive summary, tables, and structured FocusGroupResult JSON.</returns>
    Task<string> EvaluateAsync(
        string idea,
        List<PersonaEvaluation> evaluations,
        List<FocusGroupMessage> transcript,
        CancellationToken cancellationToken = default);
}
