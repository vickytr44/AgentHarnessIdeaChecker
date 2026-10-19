import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const intelligence = new CopilotKitIntelligence({
  apiKey: process.env.CPK_INTELLIGENCE_API_KEY || "",
  getLearningContainerId: () => "chatgroup",
});

const runtime = new CopilotRuntime({
  intelligence,
  identifyUser: () => ({ id: "dev-user", name: "Developer" }),

  agents: {
    default: new HttpAgent({
      url: "http://localhost:5053/ag-ui",
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const POST = (req: Request) => handler(req);
export const GET = (req: Request) => handler(req);
