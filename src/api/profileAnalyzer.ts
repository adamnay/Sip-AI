import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return _client;
}

const QUESTION_LABELS: Record<string, string> = {
  goal: 'Goal',
  currentIntake: 'Current water intake',
  activityLevel: 'Activity level',
  caffeine: 'Daily caffeine',
  alcohol: 'Alcohol frequency',
};

export async function generateProfileSummary(
  answers: Record<string, string>,
  dailyTargetOz: number
): Promise<string> {
  const client = getClient();

  const answersText = Object.entries(QUESTION_LABELS)
    .filter(([k]) => answers[k])
    .map(([k, label]) => `${label}: ${answers[k]}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Write a 1–2 sentence personalized hydration profile for this person. Be direct and specific — mention their goal and activity level naturally. End by noting their ${dailyTargetOz} oz daily target. No filler words, no "Based on your answers".\n\n${answersText}`,
    }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : `Your personalized daily hydration goal is ${dailyTargetOz} oz.`;
}
