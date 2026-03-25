import { useState } from 'react';
import { BackIcon } from '../components/Icons';

interface Props {
  onClose: () => void;
}

type Topic = 'caffeine' | 'electrolytes' | 'alcohol' | 'decay' | 'hangover';

const TABS: Array<{ key: Topic; label: string }> = [
  { key: 'decay', label: 'Decay' },
  { key: 'caffeine', label: 'Caffeine' },
  { key: 'electrolytes', label: 'Electrolytes' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'hangover', label: 'Recovery' },
];

export default function SciencePage({ onClose }: Props) {
  const [topic, setTopic] = useState<Topic>('decay');

  return (
    <div
      className="animate-slide-right"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f2f3f7',
        zIndex: 60,
        maxWidth: 420,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '20px 20px 12px',
          background: '#f2f3f7',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <BackIcon size={20} color="#111827" />
        </button>
        <h1 style={{ fontWeight: 700, fontSize: 18, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
          The Science
        </h1>
      </header>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          padding: '0 16px 12px',
          gap: 6,
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTopic(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: topic === tab.key ? '1.5px solid #111827' : '1px solid rgba(0,0,0,0.1)',
              background: topic === tab.key ? '#111827' : '#ffffff',
              color: topic === tab.key ? '#ffffff' : 'rgba(0,0,0,0.55)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 16px 40px', overflowY: 'auto' }}>
        {topic === 'caffeine' && <CaffeinePage />}
        {topic === 'electrolytes' && <ElectrolytesPage />}
        {topic === 'alcohol' && <AlcoholPage />}
        {topic === 'decay' && <DecayPage />}
        {topic === 'hangover' && <HangoverPage />}
      </div>
    </div>
  );
}

function StatCard({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 20,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 15, color, lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontWeight: 700, fontSize: 22, color: '#111827', letterSpacing: '-0.02em', margin: '0 0 12px', ...style }}>
      {children}
    </h2>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(0,0,0,0.6)', margin: '0 0 16px' }}>
      {children}
    </p>
  );
}

function CalcBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14,
        padding: '14px 16px',
        marginTop: 4,
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', margin: '0 0 6px' }}>
        How Sip AI calculates this
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(0,0,0,0.55)', margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>
      {children}
    </p>
  );
}

function CaffeinePage() {
  return (
    <div>
      <SectionTitle>Caffeine & Hydration</SectionTitle>
      <StatCard
        text="80mg+ of caffeine increases fluid loss by up to 30%"
        color="#3b82f6"
      />
      <BodyText>
        Caffeine is a mild diuretic — it signals your kidneys to release more water. A single cup of coffee (95mg caffeine) can increase urine output by ~300ml within 3 hours. Regular intake above 400mg/day significantly accelerates dehydration.
      </BodyText>
      <BodyText>
        The effect is dose-dependent: small amounts (&lt;80mg) are largely offset by the fluid you consume. Once you cross the 80mg threshold, net fluid loss begins to accumulate. Daily caffeine tolerance can reduce but never eliminates the diuretic effect.
      </BodyText>
      <CalcBox>
        We track caffeine half-life (5 hours) and add 0.4–1.5% extra decay per hour above the 80mg threshold. The more caffeine active in your system, the faster your hydration drops.
      </CalcBox>
      <Citation>Journal of Human Nutrition and Dietetics, 2014</Citation>
    </div>
  );
}

function ElectrolytesPage() {
  return (
    <div>
      <SectionTitle>Electrolytes & Absorption</SectionTitle>
      <StatCard
        text="Sodium and potassium boost water absorption by up to 35%"
        color="#22c55e"
      />
      <BodyText>
        Electrolytes create an osmotic gradient that pulls water across intestinal cells faster. This is why sports drinks hydrate faster than plain water during exercise. Sodium, potassium, and magnesium are the key minerals.
      </BodyText>
      <BodyText>
        The absorption benefit lasts approximately 4 hours after consuming electrolytes. During this window, any water or juice you drink is significantly more effective at raising your hydration level. This is especially important after exercise or sweating.
      </BodyText>
      <CalcBox>
        We apply a 35% absorption multiplier to water and juice consumed within 4 hours of electrolyte intake. Electrolytes also reduce your baseline decay rate by 0.4% per hour while active.
      </CalcBox>
      <Citation>American Journal of Clinical Nutrition, 2015</Citation>
    </div>
  );
}

function AlcoholPage() {
  return (
    <div>
      <SectionTitle>Alcohol & Dehydration</SectionTitle>
      <StatCard
        text="Each alcoholic drink causes net fluid loss of 100–150ml"
        color="#ef4444"
      />
      <BodyText>
        Alcohol suppresses antidiuretic hormone (ADH), causing kidneys to produce 4x more urine than normal. A standard drink (14g alcohol) triggers a net fluid deficit of ~100–150ml. This is why alcohol consumption without water intake leads to rapid dehydration.
      </BodyText>
      <BodyText>
        The ADH suppression effect peaks within 30–60 minutes of drinking and lasts for several hours. This is the primary mechanism behind next-morning hangover symptoms — your body is severely depleted of both water and electrolytes.
      </BodyText>
      <CalcBox>
        Alcohol adds a negative hydration delta (-1.5% to -4.5% per drink based on type) and increases baseline decay rate by +0.8%/hour for 6 hours after consumption. Hangover mode reflects the compounded dehydration from the prior night.
      </CalcBox>
      <Citation>Alcohol and Alcoholism Journal, 2010</Citation>
    </div>
  );
}

function HangoverPage() {
  return (
    <div>
      <SectionTitle>Hangover & Recovery</SectionTitle>

      <StatCard
        text="A night of 4–6 drinks can cause a net fluid deficit of 400–600ml — putting you in clinical mild dehydration before you even wake up"
        color="#f97316"
      />

      <BodyText>
        Alcohol suppresses antidiuretic hormone (ADH/vasopressin), forcing your kidneys to produce up to 4× more urine than normal. Each standard drink (14g alcohol) drives a net fluid loss of ~100–150ml beyond what you consumed — even accounting for the liquid in the drink itself. By the time your blood alcohol returns to zero, most of the damage is done.
      </BodyText>

      <CalcBox>
        Sip AI caps your hydration at 40% when you activate Recovery Mode. Here's the math: a typical overnight starting point of ~75%, minus normal sleep losses (~300ml) and alcohol diuresis from 5 drinks (~500ml), against a ~2.5L optimal baseline — leaves you at roughly 38–42% by morning. 40% is the evidence-based midpoint.
      </CalcBox>
      <Citation>Verster et al., Current Drug Abuse Reviews, 2010 — "The Alcohol Hangover Research Group Consensus Statement"</Citation>

      <SectionTitle style={{ marginTop: 24 }}>Why Recovery Takes Longer</SectionTitle>

      <StatCard
        text="Your fluid needs are ~25–50% higher than baseline during a hangover — even after you stop drinking"
        color="#f97316"
      />

      <BodyText>
        Hangover isn't just dehydration — it's a multi-system inflammatory response. Acetaldehyde (alcohol's primary metabolite) triggers cytokine release, raising your body temperature and metabolic rate. This increases insensible fluid losses through skin and respiration. At the same time, nausea suppresses your ability to rehydrate effectively, and your gut's water absorption is compromised.
      </BodyText>

      <BodyText>
        Studies measuring urine osmolality during hangovers confirm that kidneys continue operating in a semi-depleted state for 8–12 hours after BAC returns to zero. Your body is still working to restore electrolyte balance and clear acetaldehyde, both of which cost water.
      </BodyText>

      <CalcBox>
        Sip AI applies a 1.5× decay multiplier while Recovery Mode is active — meaning hydration drops 50% faster than your baseline rate. This is consistent with research showing 25–50% elevated fluid turnover during hangover recovery. Drink water and electrolytes first; other drinks are deprioritized in the UI to reflect this.
      </CalcBox>
      <Citation>Swift & Davidson, Alcohol Health & Research World, 1998</Citation>
      <Citation>Wiese et al., Annals of Internal Medicine, 2000 — "Interventions for preventing or treating alcohol hangover"</Citation>

      <SectionTitle style={{ marginTop: 24 }}>What Actually Helps</SectionTitle>

      <BodyText>
        The most evidence-backed hangover interventions are plain water and electrolyte replacement — specifically sodium, potassium, and magnesium, which are disproportionately lost through alcohol-driven diuresis. Isotonic drinks (sports drinks, electrolyte packets) outperform plain water during recovery because they restore both fluid volume and the osmotic gradient your cells need to absorb it.
      </BodyText>

      <BodyText>
        Coffee and energy drinks worsen the situation — caffeine's mild diuretic effect adds to your deficit, and the additional ADH suppression prolongs recovery. Juice and herbal tea are reasonable second-tier options: they provide fluid plus some electrolytes without the diuretic penalty.
      </BodyText>

      <CalcBox>
        This is why Sip AI highlights Water and Electrolytes as "best" picks in Recovery Mode, Juice and Tea as "good," and Coffee, Energy Drinks, Soda, and Alcohol as "avoid." The rankings directly reflect the evidence on rehydration efficacy during hangover recovery.
      </CalcBox>
      <Citation>Verster & Penning, Current Drug Abuse Reviews, 2010</Citation>
    </div>
  );
}

function DecayPage() {
  return (
    <div>
      <SectionTitle>Why Hydration Decays</SectionTitle>
      <StatCard
        text="The average adult loses 2–3 liters of water per day at rest"
        color="#f59e0b"
      />
      <BodyText>
        Your body continuously loses water through breathing (~0.3L/day), sweating (~0.5L/day), and urination (~1.5L/day). This means hydration naturally drops even without exercise. The rate increases with temperature, activity, caffeine, and alcohol.
      </BodyText>
      <BodyText>
        Factors like dry environments, high altitude, illness, and medications can all accelerate this rate. The standard 8-glasses-a-day recommendation is a rough average — your actual needs vary widely based on body weight, activity level, and climate.
      </BodyText>
      <CalcBox>
        We apply a base 3%/hour decay rate, adjusting for caffeine (+up to 1.5%), electrolytes (-0.4%), alcohol (+0.8%), and hangover mode (x1.5). Activity logging adds an immediate deficit based on estimated sweat loss for your exercise type and duration.
      </CalcBox>
      <Citation>European Journal of Clinical Nutrition, 2010</Citation>
    </div>
  );
}
