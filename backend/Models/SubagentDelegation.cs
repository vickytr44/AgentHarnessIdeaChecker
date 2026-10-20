using System.Text.Json.Serialization;

namespace AgentHarness.Models;

public sealed record SubagentDelegation(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sub_agent")] string SubAgent,
    [property: JsonPropertyName("task")] string Task,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("result")] string Result,
    [property: JsonPropertyName("timestamp")] DateTime? Timestamp = null
);

public sealed record SubagentsSnapshot(
    [property: JsonPropertyName("delegations")] IReadOnlyList<SubagentDelegation> Delegations
);
