using System.Runtime.CompilerServices;
using System.Text.Json;
using AgentHarness.Models;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace AgentHarness.Services;

public sealed class SubagentsAgent : DelegatingAIAgent
{
    private readonly ISubagentsStore _store;
    private readonly ILogger<SubagentsAgent> _logger;

    public SubagentsAgent(
        AIAgent innerAgent,
        ISubagentsStore store,
        ILogger<SubagentsAgent> logger)
        : base(innerAgent)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? thread = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return RunCoreStreamingAsync(messages, thread, options, cancellationToken)
            .ToAgentResponseAsync(cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? thread = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var messageList = messages as IReadOnlyList<ChatMessage> ?? messages.ToList();
        var previous = (AgentSession?)_store.SetActiveThread(thread);

        try
        {
            await foreach (var update in InnerAgent.RunStreamingAsync(messageList, thread, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;

                if (_store.TakeDirty(thread))
                {
                    var snapshot = _store.BuildSnapshot(thread);
                    var bytes = JsonSerializer.SerializeToUtf8Bytes(snapshot);
                    yield return new AgentResponseUpdate
                    {
                        Contents = [new DataContent(bytes, "application/json")]
                    };
                }
            }
        }
        finally
        {
            _store.SetActiveThread(previous);
        }

        var finalSnapshot = _store.BuildSnapshot(thread);
        var finalBytes = JsonSerializer.SerializeToUtf8Bytes(finalSnapshot);
        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(finalBytes, "application/json")]
        };
    }
}
