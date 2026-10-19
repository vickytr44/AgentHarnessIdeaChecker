using AGUI.Abstractions;
using AGUI.Client;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

string serverUrl = args.Length > 0 ? args[0] : (Environment.GetEnvironmentVariable("AGUI_SERVER_URL") ?? "http://localhost:5053/ag-ui");
Console.WriteLine($"[AG-UI Client] Target Server URL: {serverUrl}");

using HttpClient httpClient = new() { Timeout = TimeSpan.FromSeconds(60) };
var chatClient = new AGUIChatClient(new(httpClient, serverUrl));

AIAgent agent = chatClient.AsAIAgent(
    instructions: null,
    name: "agui-client",
    description: "AG-UI Client Agent",
    tools: []);

var session = await agent.CreateSessionAsync();

// Multi-turn test sequence
string[] testPrompts = args.Length > 1
    ? [args[1]]
    : [
        "Create a todo item to Review PR for AG-UI integration and show current todos.",
        "Now complete the todo item for Review PR and show the updated list."
    ];

string? threadId = null;

for (int i = 0; i < testPrompts.Length; i++)
{
    var prompt = testPrompts[i];
    Console.WriteLine($"\n=======================================================");
    Console.WriteLine($"[Turn {i + 1}] User: {prompt}");
    Console.WriteLine($"=======================================================");
    Console.Write("Agent: ");

    ChatClientAgentRunOptions? runOptions = null;
    if (!string.IsNullOrEmpty(threadId))
    {
        runOptions = new ChatClientAgentRunOptions
        {
            ChatOptions = new ChatOptions
            {
                AdditionalProperties = new AdditionalPropertiesDictionary
                {
                    ["agui_thread_id"] = threadId
                }
            }
        };
    }

    await foreach (AgentResponseUpdate update in agent.RunStreamingAsync(prompt, session, runOptions))
    {
        if (update.AsChatResponseUpdate()?.RawRepresentation is RunStartedEvent runStarted)
        {
            threadId = runStarted.ThreadId;
        }

        foreach (AIContent content in update.Contents)
        {
            switch (content)
            {
                case TextContent textContent:
                    Console.Write(textContent.Text);
                    break;
                case ErrorContent errorContent:
                    Console.WriteLine($"\n[Error Content] Message: {errorContent.Message}");
                    Console.WriteLine($"[Error Details] Code: {errorContent.ErrorCode}");
                    break;
            }
        }
    }

    Console.WriteLine($"\n[Run Completed - ThreadId: {threadId}]");
}

Console.WriteLine("\n[AG-UI Client] All turns completed successfully!");
