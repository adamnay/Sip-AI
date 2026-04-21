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

  // Demographics
  if (answers.goal)           parts.push(`Goal: ${answers.goal}`);
  if (answers.gender)         parts.push(`Gender: ${answers.gender}`);
  if (answers.ageTotalYears)  parts.push(`Age: ${answers.ageTotalYears} years`);
  if (answers.heightTotalIn) {
    const totalIn = parseInt(answers.heightTotalIn);
    parts.push(`Height: ${Math.floor(totalIn / 12)}'${totalIn % 12}"`);
  }
  if (answers.weightLbs)      parts.push(`Weight: ${answers.weightLbs} lbs`);

  // Lifestyle
  if (answers.activityLevel)  parts.push(`Activity level: ${answers.activityLevel}`);
  if (answers.exerciseType)   parts.push(`Exercise type: ${answers.exerciseType}`);
  if (answers.workEnv)        parts.push(`Work environment: ${answers.workEnv}`);
  if (answers.sleepHours)     parts.push(`Sleep: ${answers.sleepHours}`);

  // Environment
  if (answers.climate)        parts.push(`Climate: ${answers.climate}`);
  if (answers.indoorEnv)      parts.push(`Indoor environment: ${answers.indoorEnv}`);
  // Diet & substances
  if (answers.caffeine)       parts.push(`Daily caffeine: ${answers.caffeine}`);
  if (answers.alcohol)        parts.push(`Alcohol: ${answers.alcohol}`);
  if (answers.diet)           parts.push(`Diet: ${answers.diet}`);
  if (answers.currentIntake)  parts.push(`Current water intake: ${answers.currentIntake}`);

  // Health
  if (answers.healthCondition && answers.healthCondition !== 'None of the above') {
    parts.push(`Health condition: ${answers.healthCondition}`);
  }
  // Motivations & habits
  if (answers.challenge)      parts.push(`Biggest challenge: ${answers.challenge}`);
  if (answers.wakeTime)       parts.push(`Wake time: ${answers.wakeTime}`);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 160,
    messages: [{
      role: 'user',
      content: `Write a 2–3 sentence personalized hydration profile for this person. Be direct and specific — reference their actual lifestyle details (exercise, work environment, climate, diet, etc.) naturally. Mention any health or medication factors that affect their needs. End with their ${dailyTargetOz} oz daily target and why it's higher or lower than average. No filler words, no "Based on your answers".\n\n${parts.join('\n')}`,
    }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : `Your personalized daily hydration goal is ${dailyTargetOz} oz.`;
}
