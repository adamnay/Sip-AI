import Anthropic from '@anthropic-ai/sdk';
import type { ActivityResult } from '../engine/hydrationEngine';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env');
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

export async function analyzeActivity(text: string): Promise<ActivityResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are a hydration science assistant for a health app. The user just described a physical activity. Analyze it and return ONLY valid JSON — no markdown, no explanation.

User input: "${text}"

Estimate sweat loss based on:
- Activity intensity and type
- Duration (extract from text; default 30 min if unclear)
- Conditions (hot/outdoor = more sweat)

Typical sweat rates (ml/hour): running=900, cycling=700, swimming=500, HIIT/crossfit=1100, gym/weights=500, yoga=300, walking=300, hiking=600, sports(basketball/soccer/tennis)=800, dancing=400, general workout=600.

For hydrationDelta: use -(sweatLossML * 0.034), rounded to 1 decimal. This is always negative (activity dehydrates).

If the input is not a physical activity (e.g. "watched TV", "slept", "cooked"), set isActivity to false.

Respond with ONLY this JSON:
{
  "isActivity": true,
  "activityType": "<friendly name like 'Running', 'Hot Yoga', 'Cycling', 'Basketball'>",
  "durationMin": <number>,
  "sweatLossML": <integer>,
  "hydrationDelta": <negative number, e.g. -12.3>,
  "feedback": "<one sentence: activity + duration + fluid loss, e.g. 'Running for 45 min used ~675ml of fluids'>"
}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  // Strip markdown fences
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as {
    isActivity: boolean;
    activityType: string;
    durationMin: number;
    sweatLossML: number;
    hydrationDelta: number;
    feedback: string;
  };

  if (!parsed.isActivity) {
    throw new Error('NOT_AN_ACTIVITY');
  }

  return {
    activityType: parsed.activityType || 'Activity',
    durationMin: typeof parsed.durationMin === 'number' ? Math.max(1, parsed.durationMin) : 30,
    sweatLossML: typeof parsed.sweatLossML === 'number' ? Math.max(0, parsed.sweatLossML) : 300,
    hydrationDelta: typeof parsed.hydrationDelta === 'number'
      ? Math.min(0, Math.max(-60, parsed.hydrationDelta))
      : -10,
    feedback: parsed.feedback || `${parsed.activityType} logged`,
  };
}
