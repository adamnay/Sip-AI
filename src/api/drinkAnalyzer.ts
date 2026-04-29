import { supabase } from '../lib/supabase';
import type { DrinkType } from '../engine/hydrationEngine';

// ── Proxy caller ──────────────────────────────────────────────────────────────
// Instead of calling Anthropic directly (which would expose the API key),
// we call our Supabase Edge Function. The key lives there, not in the app.

const PROXY_URL = 'https://iawrnzqubhzphlouriva.supabase.co/functions/v1/anthropic-proxy';
const ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhd3JuenF1Ymh6cGhsb3VyaXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDI0NDgsImV4cCI6MjA5MDAxODQ0OH0.Vzt6jIHuBtwsLyJVakvDgupEhnDSsSm_koZlJFMCsQA';

async function callAnthropic(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Use the logged-in user's token if available, fall back to anon key
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON_KEY;

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy error ${res.status}: ${text}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DrinkAnalysis {
  drink_type: DrinkType;
  estimated_volume_ml: number;
  confidence: number;
  display_name: string;
  notes: string;
}

export interface DrinkHydrationAnalysis {
  hydrationPerMl: number;
  caffeinePer100ml: number;
  electrolyte: boolean;
  label: string;
  notes: string;
}

// ── Helper: extract text from Anthropic response ───────────────────────────
function extractText(response: Record<string, unknown>): string {
  const content = response.content as Array<{ type: string; text: string }> | undefined;
  if (!Array.isArray(content)) return '';
  const block = content.find(b => b.type === 'text');
  return block?.text?.trim() ?? '';
}

// ── analyzeDrinkName ──────────────────────────────────────────────────────────
export async function analyzeDrinkName(
  drinkName: string,
  drinkType: string,
): Promise<DrinkHydrationAnalysis> {
  const typeContext: Record<string, string> = {
    energy_drink: 'an energy drink',
    juice:        'a juice or fruit drink',
    soda:         'a soda or carbonated soft drink',
    electrolyte:  'an electrolyte supplement or sports drink',
  };
  const context = typeContext[drinkType] ?? 'a beverage';

  const response = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `The user drank "${drinkName}", which is ${context}. Analyze its hydration effect for a hydration tracking app. Respond with ONLY valid JSON — no markdown:
{
  "hydrationPerMl": <float, net hydration per ml. Pure water ~0.035. Juice ~0.028–0.032. Soda ~0.012–0.018. Energy drink ~0.005–0.008. Electrolyte drink ~0.042–0.065. Negative values only if strongly diuretic.>,
  "caffeinePer100ml": <integer mg caffeine per 100ml, or 0 if none>,
  "electrolyte": <true if contains significant electrolytes, false otherwise>,
  "label": "<clean display name, max 20 chars>",
  "notes": "<one brief insight about this drink's hydration>"
}`,
    }],
  });

  const raw = extractText(response);
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<DrinkHydrationAnalysis>;
    return {
      hydrationPerMl:   typeof parsed.hydrationPerMl   === 'number' ? Math.max(-0.1, Math.min(0.1, parsed.hydrationPerMl)) : 0.02,
      caffeinePer100ml: typeof parsed.caffeinePer100ml === 'number' ? parsed.caffeinePer100ml : 0,
      electrolyte:      parsed.electrolyte === true,
      label:            (parsed.label || drinkName).slice(0, 20),
      notes:            parsed.notes || '',
    };
  } catch {
    return { hydrationPerMl: 0.02, caffeinePer100ml: 0, electrolyte: false, label: drinkName.slice(0, 20), notes: '' };
  }
}

// ── detectDrinkPresence ───────────────────────────────────────────────────────
export async function detectDrinkPresence(base64Image: string): Promise<boolean> {
  try {
    const response = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          { type: 'text',  text: 'Is there a drink (cup, mug, bottle, can, glass, or any beverage container) clearly visible in this image? Reply YES or NO only.' },
        ],
      }],
    });
    const text = extractText(response).toUpperCase();
    return text.startsWith('YES');
  } catch {
    return false;
  }
}

// ── analyzeDrinkPhoto ─────────────────────────────────────────────────────────
const VALID_TYPES: DrinkType[] = [
  'water', 'coffee', 'electrolyte', 'energy_drink',
  'juice', 'soda', 'tea', 'alcohol', 'smoothie', 'unknown',
];

export async function analyzeDrinkPhoto(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
): Promise<DrinkAnalysis> {
  const response = await callAnthropic({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
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
    }],
  });

  const raw = extractText(response);
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<DrinkAnalysis>;
    return {
      drink_type:          VALID_TYPES.includes(parsed.drink_type as DrinkType) ? (parsed.drink_type as DrinkType) : 'unknown',
      estimated_volume_ml: typeof parsed.estimated_volume_ml === 'number' ? Math.max(50, Math.min(2000, parsed.estimated_volume_ml)) : 250,
      confidence:          typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      display_name:        parsed.display_name || 'Unknown Drink',
      notes:               parsed.notes || '',
    };
  } catch {
    return { drink_type: 'unknown', estimated_volume_ml: 250, confidence: 0.2, display_name: 'Unknown Drink', notes: 'Could not analyze image' };
  }
}
