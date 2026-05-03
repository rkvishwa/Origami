import {
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  streamText,
} from "ai";

import { getOrigamiModel } from "@/lib/model";
import { ORIGAMI_SYSTEM_PROMPT } from "@/lib/prompts";
import { origamiTools } from "@/lib/tools";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: getOrigamiModel(),
    system: ORIGAMI_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: origamiTools,
  });

  return result.toUIMessageStreamResponse({
    onError: (error) =>
      error instanceof Error
        ? error.message
        : "Origami ran into an unexpected issue while folding the source.",
  });
}
