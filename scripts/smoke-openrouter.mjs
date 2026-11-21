/**
 * End-to-end OpenRouter smoke: one Responses API call via @openrouter/sdk.
 *
 * Setup:
 *   1. Create a key at https://openrouter.ai/keys
 *   2. Put OPENROUTER_API_KEY=... in .env (gitignored) or export it in the shell
 *   3. npm run smoke:openrouter
 *
 * Optional: OPENROUTER_MODEL=anthropic/claude-opus-5.5  (see https://openrouter.ai/models)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpenRouter } from '@openrouter/sdk';
import { OpenRouterError } from '@openrouter/sdk/models/errors';

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = val;
    }
  } catch {
    // .env optional when the variable is already exported
  }
}

loadEnvFile();

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
if (!apiKey) {
  console.error(`
OPENROUTER_API_KEY is not set.

Create a key: https://openrouter.ai/keys
Then either:
  - add to .env:  OPENROUTER_API_KEY=sk-or-v1-...
  - or PowerShell:  $env:OPENROUTER_API_KEY="sk-or-v1-..."

Never commit the key (.env is gitignored).
`);
  process.exit(1);
}

const model =
  process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';

const client = new OpenRouter({
  apiKey,
  httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? 'https://ebobo.app',
  appTitle: process.env.OPENROUTER_APP_TITLE ?? 'eBobo',
});

console.log(`OpenRouter smoke → model=${model}\n`);

try {
  const response = await client.responses.send({
    responsesRequest: {
      model,
      input: 'Reply with exactly: Hello from OpenRouter!',
      stream: false,
    },
  });

  if (!('output' in response)) {
    throw new Error('Expected a non-streaming response');
  }
  if (response.status !== 'completed') {
    throw new Error(
      response.error?.message ?? `Response ended as ${response.status}`,
    );
  }

  const message = response.output.find((item) => item.type === 'message');
  const text = message?.content?.find((part) => part.type === 'output_text')?.text;

  console.log('id:   ', response.id);
  console.log('model:', response.model);
  console.log('text: ', text ?? '(empty)');
  console.log('\nPASS openrouter responses.send');
  process.exit(0);
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(
      `FAIL OpenRouter HTTP ${error.statusCode}: ${error.message}`,
    );
    if (error.body) {
      console.error(error.body.slice(0, 500));
    }
  } else {
    console.error('FAIL', error instanceof Error ? error.message : error);
  }
  process.exit(1);
}
