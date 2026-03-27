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

export interface NotifContext {
  level: number;
  trigger: 'interval' | 'threshold';
  streak: number;
  userName: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  drinksLoggedToday: number;
  hadActivityToday: boolean;
  lastDrinkMinutesAgo: number | null;
}

export async function generateNotificationMessage(ctx: NotifContext): Promise<{ title: string; body: string }> {
  const client = getClient();

  const urgency = ctx.level < 35 ? 'urgent' : ctx.level < 55 ? 'moderate' : 'light';
  const parts: string[] = [
    `- User: ${ctx.userName || 'the user'}`,
    `- Hydration: ${ctx.level}% (${urgency} urgency)`,
    `- Trigger: ${ctx.trigger === 'threshold' ? 'dropped below low threshold' : 'scheduled check-in'}`,
    `- Time: ${ctx.timeOfDay}`,
    `- Streak: ${ctx.streak} day${ctx.streak !== 1 ? 's' : ''}`,
    `- Drinks logged today: ${ctx.drinksLoggedToday}`,
    `- Worked out today: ${ctx.hadActivityToday ? 'yes' : 'no'}`,
    `- Last drink: ${ctx.lastDrinkMinutesAgo !== null ? `${ctx.lastDrinkMinutesAgo} min ago` : 'none today'}`,
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: `You write push notifications for Sip AI, a hydration tracking app. Write one short, personal notification.

${parts.join('\n')}

Rules:
- title: max 6 words, no emoji, punchy
- body: max 12 words, 1 emoji ok, natural and specific to context
- If urgent (level < 40): direct and action-oriented
- If moderate: friendly nudge, reference streak or workout if relevant
- If light: casual, positive, can be slightly playful
- Never say "hydration level is X%" — work the number in naturally
- Vary phrasing — sound human, not templated

Respond with ONLY valid JSON (no markdown): {"title": "...", "body": "..."}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as { title: string; body: string };

  if (!parsed.title || !parsed.body) throw new Error('Bad AI response shape');
  return parsed;
}
