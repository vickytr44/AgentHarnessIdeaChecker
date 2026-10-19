using Microsoft.Agents.AI;

namespace AgentHarness.Services;

public interface IHarnessAgentService
{
    AIAgent Agent { get; }
}
