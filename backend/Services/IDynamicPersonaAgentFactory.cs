using AgentHarness.Models;
using Microsoft.Agents.AI;

namespace AgentHarness.Services;

/// <summary>
/// Factory that materializes declarative Persona specifications into executable AIAgent instances.
/// </summary>
public interface IDynamicPersonaAgentFactory
{
    /// <summary>
    /// Dynamically creates an AIAgent initialized with a persona's identity, background, and prompt constraints.
    /// </summary>
    /// <param name="persona">The declarative persona specification.</param>
    /// <returns>An executable AIAgent roleplaying as the specified persona.</returns>
    AIAgent CreatePersonaAgent(Persona persona);
}
