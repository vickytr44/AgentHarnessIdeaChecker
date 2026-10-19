using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Extensions.AI;
using OpenAI;

namespace AgentHarness.Services;

public static class ChatClientFactory
{
    public static IChatClient Create(IConfiguration configuration)
    {
        var section = configuration.GetSection("Google");
        var apiKey = section["ApiKey"] ?? Environment.GetEnvironmentVariable("GOOGLE_API_KEY");
        var model = section["Model"] ?? "gemini-3.5-flash-lite";
        var endpoint = section["Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/openai/";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Google Gemini API key is missing. Please set 'Google:ApiKey' in appsettings.Development.json or the 'GOOGLE_API_KEY' environment variable.");
        }

        if (string.IsNullOrWhiteSpace(model))
        {
            throw new InvalidOperationException("Google:Model must be specified.");
        }

        var httpClient = new HttpClient(new GoogleThoughtSignatureHandler());

        var clientOptions = new OpenAIClientOptions
        {
            Endpoint = new Uri(endpoint),
            Transport = new HttpClientPipelineTransport(httpClient),
            RetryPolicy = new ClientRetryPolicy(maxRetries: 3)
        };

        var openAiClient = new OpenAIClient(new ApiKeyCredential(apiKey), clientOptions);
        
        return openAiClient.GetChatClient(model).AsIChatClient();
    }
}
