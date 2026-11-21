import { OpenRouter } from '@openrouter/sdk';

/**
 * Server / Node only. Do not import this into Expo client code with a real key —
 * Expo only inlines EXPO_PUBLIC_* vars, and the OpenRouter key must never ship to the app.
 */
export function requireOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Create a key at https://openrouter.ai/keys and set it in your environment (or .env). Never commit the key.',
    );
  }
  return apiKey;
}

export function createOpenRouterClient(apiKey = requireOpenRouterApiKey()): OpenRouter {
  return new OpenRouter({
    apiKey,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? 'https://ebobo.app',
    appTitle: process.env.OPENROUTER_APP_TITLE ?? 'eBobo',
  });
}
