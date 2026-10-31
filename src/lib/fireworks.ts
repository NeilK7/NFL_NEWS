import fs from 'fs';
import path from 'path';

function getFireworksApiKey(): string {
  if (process.env.FIREWORKS_API_KEY) {
    return process.env.FIREWORKS_API_KEY;
  }

  // Fallback for local dev: check ruminate's .env.original_ruminate.local if present
  try {
    const ruminateEnvPath = path.resolve(process.cwd(), '../ruminate/.env.original_ruminate.local');
    if (fs.existsSync(ruminateEnvPath)) {
      const content = fs.readFileSync(ruminateEnvPath, 'utf8');
      const match = content.match(/^FIREWORKS_API_KEY=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {
    // Ignore fs errors in serverless environments
  }

  return '';
}

const FIREWORKS_MODELS = [
  'accounts/fireworks/models/deepseek-v4-pro',
  'accounts/fireworks/models/deepseek-v3',
  'accounts/fireworks/models/llama-v3p3-70b-instruct',
  'accounts/fireworks/models/llama-v3p1-70b-instruct',
];

export async function callFireworksAI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  const apiKey = getFireworksApiKey();
  if (!apiKey) {
    console.warn('Fireworks API key not found');
    return null;
  }

  for (const model of FIREWORKS_MODELS) {
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 700,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn(`Fireworks model ${model} attempt failed:`, err);
    }
  }

  return null;
}
