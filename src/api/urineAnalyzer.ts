import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) throw new Error('No API key');
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

export interface UrineAnalysisResult {
  adjustment: number;   // delta to apply to current level (can be + or -)
  newLevel: number;     // what the true level should be after calibration
  feedback: string;     // 1-2 sentences, personal + actionable
}

export async function analyzeUrineColor(
  colorLabel: string,
  currentLevel: number
): Promise<UrineAnalysisResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `You are a hydration science assistant inside a tracking app. The user just identified their urine color using a slider.

Current app hydration level: ${currentLevel}%
Urine color they selected: "${colorLabel}"

Urine color hydration reference:
- Clear → 85–100% hydrated (possibly over-hydrated)
- Pale straw → 75–90%
- Yellow → 60–80%
- Dark yellow → 45–65%
- Amber → 30–50%
- Orange → 15–35%
- Brown → 0–20% (severely dehydrated, urgent)

Your job: recalibrate the hydration level based on the urine color as ground truth.

Rules:
- Urine color is more reliable than the app's estimate — trust it
- Calculate a sensible target level within the color's range
- adjustment = targetLevel - currentLevel (can be positive or negative)
- feedback: 1–2 sentences, friendly and specific, include what to drink/do next
- If urgently low (orange/brown), be direct and firm
- If well hydrated (clear/pale), be positive and note if over-hydration is possible

Respond with ONLY valid JSON (no markdown):
{"adjustment": <integer>, "newLevel": <integer 0-100>, "feedback": "<string>"}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as UrineAnalysisResult;

  // Sanity clamp
  parsed.newLevel = Math.max(0, Math.min(100, parsed.newLevel));
  parsed.adjustment = parsed.newLevel - currentLevel;

  return parsed;
}
