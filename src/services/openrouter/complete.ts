import type { OpenResponsesResult } from '@openrouter/sdk/models';
import { OpenRouterError } from '@openrouter/sdk/models/errors';

import { createOpenRouterClient } from '@/services/openrouter/client';

/** Default cheap smoke model — override with OPENROUTER_MODEL. Catalog: https://openrouter.ai/models */
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

export type OpenRouterCompletion = {
  model: string;
  text: string;
  id: string;
};

function extractOutputText(response: OpenResponsesResult): string {
  const message = response.output.find((item) => item.type === 'message');
  if (!message || message.type !== 'message') {
    throw new Error('OpenRouter returned no message output.');
  }
  const textPart = message.content.find((part) => part.type === 'output_text');
  if (!textPart || textPart.type !== 'output_text') {
    throw new Error('OpenRouter returned no output_text in the response.');
  }
  const text = textPart.text.trim();
  if (!text) {
    throw new Error('OpenRouter returned empty output_text.');
  }
  return text;
}

export function formatOpenRouterError(error: unknown): string {
  if (error instanceof OpenRouterError) {
    return `OpenRouter HTTP ${error.statusCode}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * One non-streaming Responses API call (OpenRouter quickstart shape).
 * Model slugs: https://openrouter.ai/models (e.g. anthropic/claude-opus-5.5).
 */
export async function completeWithOpenRouter(
  input: string,
  options?: {
    model?: string;
    apiKey?: string;
  },
): Promise<OpenRouterCompletion> {
  const model =
    options?.model?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_OPENROUTER_MODEL;

  const client = createOpenRouterClient(options?.apiKey);

  try {
    const response = await client.responses.send({
      responsesRequest: {
        model,
        input,
        stream: false,
      },
    });

    if (!('output' in response)) {
      throw new Error('Expected a non-streaming OpenRouter response.');
    }
    if (response.status !== 'completed') {
      throw new Error(
        response.error?.message ?? `OpenRouter response ended as ${response.status}`,
      );
    }

    return {
      model: response.model,
      id: response.id,
      text: extractOutputText(response),
    };
  } catch (error) {
    throw new Error(formatOpenRouterError(error), { cause: error });
  }
}
