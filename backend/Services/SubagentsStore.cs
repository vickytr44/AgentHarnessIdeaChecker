using System.Text.Json;
using AgentHarness.Models;
using Microsoft.Agents.AI;

namespace AgentHarness.Services;

public interface ISubagentsStore
{
    object? SetActiveThread(AgentSession? thread);
    string AppendRunning(string subAgent, string task);
    void Update(string id, string status, string result);
    bool TakeDirty(AgentSession? thread);
    SubagentsSnapshot BuildSnapshot(AgentSession? thread);
}

public sealed class SubagentsStore : ISubagentsStore
{
    private readonly object _globalSlot = new();
    private readonly AsyncLocal<object?> _activeThreadKey = new();
    private readonly Dictionary<object, ThreadSlot> _slots = new();
    private readonly object _lock = new();

    public object? SetActiveThread(AgentSession? thread)
    {
        var prior = _activeThreadKey.Value;
        _activeThreadKey.Value = thread ?? _globalSlot;
        return prior;
    }

    public string AppendRunning(string subAgent, string task)
    {
        var entry = new SubagentDelegation(
            Id: Guid.NewGuid().ToString("n")[..16],
            SubAgent: subAgent,
            Task: task,
            Status: "running",
            Result: "",
            Timestamp: DateTime.UtcNow);

        lock (_lock)
        {
            foreach (var slot in WriteTargets())
            {
                slot.Delegations.Add(entry);
                slot.DirtyVersion++;
            }
        }

        return entry.Id;
    }

    public void Update(string id, string status, string result)
    {
        lock (_lock)
        {
            foreach (var slot in WriteTargets())
            {
                for (var i = 0; i < slot.Delegations.Count; i++)
                {
                    if (slot.Delegations[i].Id == id)
                    {
                        slot.Delegations[i] = slot.Delegations[i] with
                        {
                            Status = status,
                            Result = result
                        };
                        slot.DirtyVersion++;
                        break;
                    }
                }
            }
        }
    }

    public bool TakeDirty(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return false;
            }

            if (slot.DirtyVersion == slot.LastEmittedVersion)
            {
                return false;
            }

            slot.LastEmittedVersion = slot.DirtyVersion;
            return true;
        }
    }

    public SubagentsSnapshot BuildSnapshot(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return new SubagentsSnapshot(Array.Empty<SubagentDelegation>());
            }

            return new SubagentsSnapshot(slot.Delegations.ToArray());
        }
    }

    private ThreadSlot? ResolveSlotForRead(AgentSession? thread)
    {
        if (thread is not null &&
            _slots.TryGetValue(thread, out var threadSlot) &&
            (threadSlot.Delegations.Count > 0 || threadSlot.DirtyVersion > 0))
        {
            return threadSlot;
        }

        if (_slots.TryGetValue(_globalSlot, out var globalSlot) &&
            (globalSlot.Delegations.Count > 0 || globalSlot.DirtyVersion > 0))
        {
            return globalSlot;
        }

        if (thread is not null && _slots.TryGetValue(thread, out threadSlot))
        {
            return threadSlot;
        }

        return _slots.TryGetValue(_globalSlot, out globalSlot) ? globalSlot : null;
    }

    private IEnumerable<ThreadSlot> WriteTargets()
    {
        var key = _activeThreadKey.Value ?? _globalSlot;
        yield return GetOrCreateSlot(key);

        if (ReferenceEquals(key, _globalSlot))
        {
            foreach (var kvp in _slots)
            {
                if (!ReferenceEquals(kvp.Key, _globalSlot))
                {
                    yield return kvp.Value;
                }
            }
        }
    }

    private ThreadSlot GetOrCreateSlot(object key)
    {
        if (!_slots.TryGetValue(key, out var slot))
        {
            slot = new ThreadSlot();
            _slots[key] = slot;
        }
        return slot;
    }

    private sealed class ThreadSlot
    {
        public List<SubagentDelegation> Delegations { get; } = new();
        public long DirtyVersion { get; set; }
        public long LastEmittedVersion { get; set; }
    }
}
