using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace AgentHarness.Services;

/// <summary>
/// Preserves and restores Google Gemini cryptographic thought_signatures across
/// tool calling turns when using the OpenAI-compatible endpoint.
/// </summary>
public class GoogleThoughtSignatureHandler : DelegatingHandler
{
    private readonly ConcurrentDictionary<string, JsonNode> _signatures = new();
    private volatile JsonNode? _lastSignature;

    public GoogleThoughtSignatureHandler(HttpMessageHandler? innerHandler = null)
        : base(innerHandler ?? new HttpClientHandler())
    {
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // 1. Process outgoing request: inject thought_signatures into assistant tool_calls if missing
        if (request.Content != null && request.RequestUri != null &&
            request.RequestUri.AbsolutePath.EndsWith("chat/completions", StringComparison.OrdinalIgnoreCase))
        {
            var requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            if (!string.IsNullOrWhiteSpace(requestBody) && (_signatures.Count > 0 || _lastSignature != null))
            {
                try
                {
                    var rootNode = JsonNode.Parse(requestBody);
                    if (rootNode is JsonObject rootObj && rootObj["messages"] is JsonArray messages)
                    {
                        bool modified = false;
                        foreach (var messageNode in messages)
                        {
                            if (messageNode is JsonObject msgObj &&
                                msgObj["role"]?.ToString() == "assistant" &&
                                msgObj["tool_calls"] is JsonArray toolCalls)
                            {
                                foreach (var call in toolCalls)
                                {
                                    if (call is JsonObject callObj && callObj["extra_content"] == null)
                                    {
                                        JsonNode? signatureToUse = null;
                                        if (callObj["id"]?.ToString() is { } callId &&
                                            _signatures.TryGetValue(callId, out var foundSig))
                                        {
                                            signatureToUse = foundSig.DeepClone();
                                        }
                                        else if (_lastSignature != null)
                                        {
                                            signatureToUse = _lastSignature.DeepClone();
                                        }

                                        if (signatureToUse != null)
                                        {
                                            callObj["extra_content"] = signatureToUse;
                                            modified = true;
                                        }
                                    }
                                }
                            }
                        }

                        if (modified)
                        {
                            var updatedJson = rootNode.ToJsonString();
                            request.Content = new StringContent(updatedJson, Encoding.UTF8, "application/json");
                        }
                    }
                }
                catch
                {
                    // Proceed with original payload if mutation parsing fails
                }
            }
        }

        // 2. Execute underlying HTTP call
        var response = await base.SendAsync(request, cancellationToken);

        // 3. Process incoming response: capture thought_signatures returned in tool_calls
        if (response.Content != null && request.RequestUri != null &&
            request.RequestUri.AbsolutePath.EndsWith("chat/completions", StringComparison.OrdinalIgnoreCase))
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                System.Console.ForegroundColor = ConsoleColor.Red;
                System.Console.WriteLine($"\n[Google Gemini HTTP {(int)response.StatusCode} {response.ReasonPhrase}] {responseBody}");
                System.Console.ResetColor();
            }

            if (!string.IsNullOrWhiteSpace(responseBody))
            {
                try
                {
                    if (responseBody.TrimStart().StartsWith("data:"))
                    {
                        // Parse Server-Sent Events (SSE) streaming chunks
                        var lines = responseBody.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                        string? currentCallId = null;

                        foreach (var rawLine in lines)
                        {
                            var line = rawLine.Trim();
                            if (!line.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) continue;
                            var jsonPayload = line.Substring(5).Trim();
                            if (jsonPayload == "[DONE]" || string.IsNullOrWhiteSpace(jsonPayload)) continue;

                            try
                            {
                                using var chunkDoc = JsonDocument.Parse(jsonPayload);
                                if (chunkDoc.RootElement.TryGetProperty("choices", out var chunkChoices) && chunkChoices.GetArrayLength() > 0)
                                {
                                    var choice = chunkChoices[0];
                                    JsonElement container = default;
                                    if (choice.TryGetProperty("delta", out var deltaEl))
                                    {
                                        container = deltaEl;
                                    }
                                    else if (choice.TryGetProperty("message", out var msgEl))
                                    {
                                        container = msgEl;
                                    }

                                    if (container.ValueKind == JsonValueKind.Object)
                                    {
                                        ExtractSignaturesFromElement(container, ref currentCallId);
                                    }
                                }
                            }
                            catch
                            {
                                // Skip malformed chunk
                            }
                        }
                    }
                    else
                    {
                        // Parse standard non-streaming JSON response
                        using var doc = JsonDocument.Parse(responseBody);
                        if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                        {
                            var firstChoice = choices[0];
                            if (firstChoice.TryGetProperty("message", out var msgEl))
                            {
                                string? currentCallId = null;
                                ExtractSignaturesFromElement(msgEl, ref currentCallId);
                            }
                        }
                    }
                }
                catch
                {
                    // Ignore response inspection errors
                }
            }

            // Restore response content stream for downstream readers
            response.Content = new StringContent(responseBody, Encoding.UTF8, response.Content.Headers.ContentType?.MediaType ?? "application/json");
        }

        return response;
    }

    private void ExtractSignaturesFromElement(JsonElement container, ref string? currentCallId)
    {
        if (container.TryGetProperty("tool_calls", out var toolCalls) &&
            toolCalls.ValueKind == JsonValueKind.Array)
        {
            foreach (var call in toolCalls.EnumerateArray())
            {
                if (call.TryGetProperty("id", out var idProp) &&
                    idProp.GetString() is { } id && !string.IsNullOrWhiteSpace(id))
                {
                    currentCallId = id;
                }

                if (call.TryGetProperty("extra_content", out var extraContentEl))
                {
                    var extraContentNode = JsonNode.Parse(extraContentEl.GetRawText());
                    if (extraContentNode != null)
                    {
                        _lastSignature = extraContentNode;
                        if (currentCallId != null)
                        {
                            _signatures[currentCallId] = extraContentNode;
                        }
                    }
                }
                else if (_lastSignature != null && currentCallId != null && !_signatures.ContainsKey(currentCallId))
                {
                    _signatures[currentCallId] = _lastSignature;
                }
            }
        }

        if (container.TryGetProperty("extra_content", out var msgExtraContentEl))
        {
            var node = JsonNode.Parse(msgExtraContentEl.GetRawText());
            if (node != null)
            {
                _lastSignature = node;
                if (currentCallId != null)
                {
                    _signatures[currentCallId] = node;
                }
            }
        }
    }
}
