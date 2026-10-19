using AgentHarness.Services;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Agent Harness AG-UI Server (Google Gemini)",
        Version = "v1",
        Description = "ASP.NET Core AG-UI Server backend powering Microsoft Agent Framework Harness with planning and todo tracking."
    });
});

// Configure CORS for web frontends (e.g., Next.js CopilotKit)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register Agent Harness Singleton Service and AG-UI Server
builder.Services.AddSingleton<IHarnessAgentService, HarnessAgentService>();
builder.Services.AddKeyedSingleton<AgentSessionStore>("PlanningHarnessAgent", new InMemoryAgentSessionStore());
builder.Services.AddAGUIServer();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Map AG-UI Server endpoint using the Harness AIAgent
var harnessAgentService = app.Services.GetRequiredService<IHarnessAgentService>();
app.MapAGUIServer("/ag-ui", harnessAgentService.Agent);

// Root landing endpoint
app.MapGet("/", () => Results.Ok(new
{
    service = "Agent Harness AG-UI Server",
    status = "running",
    provider = "Google Gemini",
    endpoints = new
    {
        agui = "POST /ag-ui",
        swagger = "/swagger"
    }
}));

app.Run();
