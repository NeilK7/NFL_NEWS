import fs from 'fs';
import path from 'path';

export function getEnvFromRuminate(key: string): string {
  if (process.env[key]) {
    return process.env[key] as string;
  }

  const candidateFiles = [
    '../Documents/ruminate/.env.original_ruminate.local',
    '../Documents/ruminate/.env.prod.env',
    '../Documents/ruminate/.env.production',
    '../ruminate/.env.original_ruminate.local',
    '../ruminate/.env.prod.env',
    '../ruminate/.env.production',
  ];

  for (const relPath of candidateFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const regex = new RegExp(`^${key}=["']?([^"'\\r\\n]+)["']?`, 'm');
        const match = content.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    } catch {
      // Ignore fs errors in serverless environments
    }
  }

  return '';
}

function getFireworksApiKey(): string {
  return getEnvFromRuminate('FIREWORKS_API_KEY');
}

const FIREWORKS_MODELS = [
  'accounts/fireworks/models/deepseek-v3',
  'accounts/fireworks/models/llama-v3p3-70b-instruct',
  'accounts/fireworks/models/deepseek-v4-pro',
  'accounts/fireworks/models/llama-v3p1-70b-instruct',
];

export async function callFireworksAI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string | null> {
  const apiKey = getFireworksApiKey();

  // 1. Try Fireworks AI if API key is available
  if (apiKey) {
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
            temperature: options?.temperature ?? 0.3,
            max_tokens: options?.maxTokens ?? 800,
          }),
          signal: AbortSignal.timeout(7000),
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
  }

  // 2. Free Serverless AI Fallback (OpenAI-compatible DeepSeek/Llama endpoint, zero key required)
  try {
    const freeRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: options?.temperature ?? 0.3,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (freeRes.ok) {
      const data = await freeRes.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    }
  } catch (err) {
    console.warn('Free AI fallback attempt failed:', err);
  }

  return null;
}
