#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Locate and read API Key from backend settings or env
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  const candidatePaths = [
    path.join(__dirname, "backend", "appsettings.Development.json"),
    path.join(__dirname, "backend", "appsettings.json"),
    path.join(__dirname, "backend", "appsettings.example.json"),
  ];

  for (const configPath of candidatePaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (config?.Google?.ApiKey) {
          return config.Google.ApiKey;
        }
      } catch {
        // ignore parse errors and check next
      }
    }
  }

  throw new Error(
    "API Key not found. Please ensure it is present in backend/appsettings.Development.json or set GEMINI_API_KEY."
  );
}

// 2. Fetch models using @google/genai or native fetch fallback
async function fetchModels(apiKey) {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    console.log("Using @google/genai SDK...\n");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.list();
    const models = [];
    if (Symbol.asyncIterator in Object(response)) {
      for await (const m of response) {
        models.push(m);
      }
    } else if (Array.isArray(response)) {
      models.push(...response);
    } else if (response && Array.isArray(response.models)) {
      models.push(...response.models);
    }
    return models;
  } catch (err) {
    if (err.code !== "ERR_MODULE_NOT_FOUND" && !err.message?.includes("Cannot find package")) {
      console.warn("Notice: @google/genai encountered an issue:", err.message);
    }
    console.log("Fetching models via Gemini REST API endpoint...\n");
    let allModels = [];
    let pageToken = "";
    do {
      const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("pageSize", "100");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.models) {
        allModels.push(...data.models);
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    return allModels;
  }
}

async function main() {
  try {
    const apiKey = getApiKey();
    const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
    console.log(`Connecting to Google Gemini API using key: ${maskedKey}`);

    const models = await fetchModels(apiKey);
    console.log(`Successfully retrieved ${models.length} models:\n`);

    // Group models by category
    const categories = {
      "Core Gemini & Gemma (Text & Multimodal)": [],
      "Audio, Speech & Live": [],
      "Image & Video Generation": [],
      "Lyria (Audio & Music Generation)": [],
      "Agents, Robotics & Deep Research": [],
      "Embeddings & Attributed QA": [],
      "Other": []
    };

    for (const m of models) {
      const id = (m.name || m.id || "").replace(/^models\//, "");
      const name = m.displayName || id;
      const entry = { id: `models/${id}`, displayName: name, inLimit: m.inputTokenLimit, outLimit: m.outputTokenLimit };

      if (id.includes("live") || id.includes("tts") || id.includes("transcribe") || id.includes("audio")) {
        categories["Audio, Speech & Live"].push(entry);
      } else if (id.includes("image") || id.includes("banana") || id.includes("veo")) {
        categories["Image & Video Generation"].push(entry);
      } else if (id.includes("lyria")) {
        categories["Lyria (Audio & Music Generation)"].push(entry);
      } else if (id.includes("research") || id.includes("antigravity") || id.includes("robotics") || id.includes("computer-use")) {
        categories["Agents, Robotics & Deep Research"].push(entry);
      } else if (id.includes("embedding") || id.includes("aqa")) {
        categories["Embeddings & Attributed QA"].push(entry);
      } else if (id.includes("gemini") || id.includes("gemma")) {
        categories["Core Gemini & Gemma (Text & Multimodal)"].push(entry);
      } else {
        categories["Other"].push(entry);
      }
    }

    for (const [category, items] of Object.entries(categories)) {
      if (items.length === 0) continue;
      console.log(`=== ${category} (${items.length}) ===`);
      for (const item of items) {
        const limits = item.inLimit ? ` [In: ${item.inLimit.toLocaleString()}, Out: ${item.outLimit?.toLocaleString() || "N/A"}]` : "";
        console.log(`  - ${item.id.padEnd(46)} | ${item.displayName}${limits}`);
      }
      console.log("");
    }
  } catch (error) {
    console.error("Error executing script:", error.message || error);
    process.exit(1);
  }
}

main();
