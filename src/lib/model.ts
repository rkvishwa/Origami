import { createOpenAI } from "@ai-sdk/openai";
import { createVercel } from "@ai-sdk/vercel";

const openaiCompatible = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  name: "openai-compatible",
});

const v0Provider = createVercel({
  apiKey: process.env.V0_API_KEY,
});

export function getOrigamiModel() {
  return openaiCompatible(process.env.OPENAI_MODEL ?? "gpt-4o");
}

export function getV0Model() {
  return v0Provider("v0-1.5-md");
}
