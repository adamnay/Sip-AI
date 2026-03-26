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

export async function generateProfileSummary(
  answers: Record<string, string>,
  dailyTargetOz: number
): Promise<string> {
  const client = getClient();

  const parts: string[] = [];
  if (answers.goal) parts.push(`Goal: ${answers.goal}`);
  if (answers.currentIntake) parts.push(`Current intake: ${answers.currentIntake}`);
  if (answers.activityLevel) parts.push(`Activity: ${answers.activityLevel}`);
  if (answers.caffeine) parts.push(`Daily caffeine: ${answers.caffeine}`);
  if (answers.alcohol) parts.push(`Alcohol: ${answers.alcohol}`);
  if (answers.ageTotalYears) parts.push(`Age: ${answers.ageTotalYears} years`);
  if (answers.heightTotalIn) {
    const totalIn = parseInt(answers.heightTotalIn);
    parts.push(`Height: ${Math.floor(totalIn / 12)}'${totalIn % 12}"`);
  }
  if (answers.weightLbs) parts.push(`Weight: ${answers.weightLbs} lbs`);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `Write a 1–2 sentence personalized hydration profile for this person. Be direct and specific — mention their goal and lifestyle naturally. End by noting their ${dailyTargetOz} oz daily target. No filler words, no "Based on your answers".\n\n${parts.join('\n')}`,
    }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : `Your personalized daily hydration goal is ${dailyTargetOz} oz.`;
}
