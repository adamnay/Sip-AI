import Anthropic from '@anthropic-ai/sdk';
import type { DrinkType } from '../engine/hydrationEngine';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env');
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

export interface DrinkAnalysis {
  drink_type: DrinkType;
  estimated_volume_ml: number;
  confidence: number;
  display_name: string;
  notes: string;
}

const VALID_TYPES: DrinkType[] = [
  'water', 'coffee', 'electrolyte', 'energy_drink',
  'juice', 'soda', 'tea', 'alcohol', 'smoothie', 'unknown',
];

export async function analyzeDrinkPhoto(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<DrinkAnalysis> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: `You are analyzing a drink for a hydration tracking app. Look at this image and respond with ONLY valid JSON — no markdown, no explanation:
{
  "drink_type": "<one of: water | coffee | electrolyte | energy_drink | juice | soda | tea | alcohol | smoothie | unknown>",
  "estimated_volume_ml": <integer, typical container size in ml, e.g. 240 for a cup, 500 for a bottle>,
  "confidence": <float 0.0–1.0>,
  "display_name": "<friendly name like 'Black Coffee', 'Gatorade', 'Green Smoothie'>",
  "notes": "<one very brief insight about this drink's hydration effect>"
}`,
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  try {
    // Strip markdown fences if present
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<DrinkAnalysis>;

    return {
      drink_type: VALID_TYPES.includes(parsed.drink_type as DrinkType)
        ? (parsed.drink_type as DrinkType)
        : 'unknown',
      estimated_volume_ml: typeof parsed.estimated_volume_ml === 'number'
        ? Math.max(50, Math.min(2000, parsed.estimated_volume_ml))
        : 250,
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
      display_name: parsed.display_name || 'Unknown Drink',
      notes: parsed.notes || '',
    };
  } catch {
    return {
      drink_type: 'unknown',
      estimated_volume_ml: 250,
      confidence: 0.2,
      display_name: 'Unknown Drink',
      notes: 'Could not analyze image',
    };
  }
}
