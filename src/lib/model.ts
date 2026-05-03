import { createOpenAI } from "@ai-sdk/openai";

const openaiCompatible = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  name: "openai-compatible",
});

export function getOrigamiModel() {
  return openaiCompatible(process.env.OPENAI_MODEL ?? "gpt-4o");
}
