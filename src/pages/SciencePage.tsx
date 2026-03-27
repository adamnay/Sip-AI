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
        text="Energy drinks with 280mg caffeine had hydration properties 14%+ lower than plain water — while 100mg caffeine drinks with electrolytes matched water almost exactly"
        color="#3b82f6"
      />
      <BodyText>
        Caffeine's diuretic effect is real but nuanced — it's far more about dose than most people realize. Research using the Beverage Hydration Index (BHI) shows that low-caffeine drinks (~100mg) paired with electrolytes hydrate nearly as well as water. But high-caffeine formulas (280mg+) show measurable net fluid loss even after accounting for the liquid consumed.
      </BodyText>
      <BodyText>
        Unlike earlier research suggested, habitual caffeine use did not significantly reduce the diuretic response at higher doses — the fluid-loss effect scales with the amount of caffeine, regardless of how often you drink it. The bigger protective factor is electrolyte content in the drink, not your tolerance level.
      </BodyText>
      <CalcBox>
        We track caffeine half-life (5 hours) and add 0.4–1.5% extra decay per hour above the 80mg threshold. The more caffeine active in your system, the faster your hydration drops.
      </CalcBox>
      <Citation>Millard-Stafford et al., Nutrients, 2025 — "Caffeinated Energy Drink Formulations Differentially Impact Hydration Versus Water" (PMID: PMC12472760)</Citation>
    </div>
  );
}

function ElectrolytesPage() {
  return (
    <div>
      <SectionTitle>Electrolytes & Absorption</SectionTitle>
      <StatCard
        text="Electrolyte content alone improves a drink's hydration power by 12%+ over plain water — the combination of electrolytes and carbohydrates pushes that to 15%"
        color="#22c55e"
      />
      <BodyText>
        Using the Beverage Hydration Index — a standardized measure of how well a drink retains fluid in the body vs. plain water — research confirmed that electrolytes are the single biggest driver of how hydrating a drink actually is. Sodium is the primary factor: it activates glucose-sodium co-transport (SGLT1) in the intestinal wall, physically pulling water in alongside it.
      </BodyText>
      <BodyText>
        Adding carbohydrates on top of electrolytes improves absorption further, but electrolytes alone already outperform plain water significantly. This is why a basic electrolyte tablet dissolved in water can outperform expensive sports drinks — the sodium content matters far more than the brand. The absorption benefit is most pronounced in the first 2 hours and tapers through hour 4.
      </BodyText>
      <CalcBox>
        We apply a 35% absorption multiplier to water and juice consumed within 4 hours of electrolyte intake. Electrolytes also reduce your baseline decay rate by 0.4% per hour while active.
      </CalcBox>
      <Citation>Millard-Stafford et al., Nutrients, 2021 — "The Beverage Hydration Index: Influence of Electrolytes, Carbohydrate and Protein" (PMID: 34578811)</Citation>
    </div>
  );
}

function AlcoholPage() {
  return (
    <div>
      <SectionTitle>Alcohol & Dehydration</SectionTitle>
      <StatCard
        text="Alcohol suppresses vasopressin (the hormone that tells your kidneys to hold water) for hours after your last drink — meaning fluid loss continues long after you stop drinking"
        color="#ef4444"
      />
      <BodyText>
        The dehydrating mechanism of alcohol is more prolonged than previously thought. Using copeptin — a stable marker for vasopressin (antidiuretic hormone) — researchers confirmed that alcohol doesn't just briefly blunt ADH: it extends vasopressin suppression for several hours after drinking ends. This means your kidneys keep producing excess urine even while you sleep, accumulating a deficit that worsens through the night.
      </BodyText>
      <BodyText>
        The same study found that drinking extra water alongside alcohol or adding sodium didn't fully counteract this vasopressin suppression. The fluid-loss effect is driven by alcohol's direct pharmacological action on the brain — not simply a dilution or osmolality effect that more water can fix. Each standard drink creates a net fluid deficit of approximately 100–150ml.
      </BodyText>
      <CalcBox>
        Alcohol adds a negative hydration delta (-1.5% to -4.5% per drink based on type) and increases baseline decay rate by +0.8%/hour for 6 hours after consumption. Hangover mode reflects the compounded overnight dehydration from vasopressin suppression.
      </CalcBox>
      <Citation>Sailer et al., American Journal of Physiology – Renal Physiology, 2020 — "Effects of Alcohol Consumption on Copeptin Levels and Sodium-Water Homeostasis" (PMID: 31961713)</Citation>
    </div>
  );
}

function HangoverPage() {
  return (
    <div>
      <SectionTitle>Hangover & Recovery</SectionTitle>

      <StatCard
        text="A hangover is not just dehydration — it's a multi-system syndrome involving immune activation, acetaldehyde toxicity, gut inflammation, and disrupted sleep, all hitting simultaneously"
        color="#f97316"
      />

      <BodyText>
        A decade of research from the Alcohol Hangover Research Group redefined what a hangover actually is. While dehydration is a real component, the 2020 consensus concluded it's one of at least six overlapping mechanisms: alcohol's primary metabolite acetaldehyde triggers immune cells to release inflammatory cytokines, your blood sugar swings from alcohol's effect on gluconeogenesis, sleep architecture is disrupted even if you feel like you slept, and gastrointestinal lining is directly irritated — all of which amplify each other.
      </BodyText>

      <CalcBox>
        Sip AI caps your hydration at 40% when you activate Recovery Mode. Here's the math: a typical overnight starting point of ~75%, minus normal sleep losses (~300ml) and alcohol-driven vasopressin suppression from 5 drinks (~500ml net fluid deficit), against a ~2.5L optimal baseline — leaves you at roughly 38–42% by morning. 40% is the evidence-based midpoint.
      </CalcBox>
      <Citation>Verster, Arnoldy et al., Journal of Clinical Medicine, 2020 — "The Alcohol Hangover Research Group: Ten Years of Progress" (PMID: 33207574)</Citation>

      <SectionTitle style={{ marginTop: 24 }}>Why Recovery Takes Longer</SectionTitle>

      <StatCard
        text="Immune activation and cytokine release during a hangover raise your metabolic rate and body temperature — increasing fluid loss through respiration and skin even when you're lying still"
        color="#f97316"
      />

      <BodyText>
        The inflammatory response is a major underappreciated driver of hangover dehydration. Acetaldehyde — alcohol's first breakdown product — directly stimulates the immune system to release interleukins and tumor necrosis factor. This cytokine release elevates core temperature slightly, increases insensible fluid loss (breath, sweat), and suppresses appetite so you don't want to eat or drink. The net result: you're losing fluid faster than baseline while simultaneously being too nauseous to replace it.
      </BodyText>

      <BodyText>
        The gut is compromised too. Alcohol irritates intestinal lining and slows gastric emptying, meaning water you do manage to drink absorbs more slowly than normal — the opposite of what you need. This is why small, frequent sips of electrolyte fluid outperform large volumes of plain water during recovery.
      </BodyText>

      <CalcBox>
        Sip AI applies a 1.5× decay multiplier while Recovery Mode is active — hydration drops 50% faster than your baseline rate, reflecting the combination of elevated fluid turnover and impaired absorption. Drink water and electrolytes first; other drinks are deprioritized in the UI to reflect this.
      </CalcBox>
      <Citation>Verster, Scholey et al., Journal of Clinical Medicine, 2020 — "Updating the Definition of the Alcohol Hangover" (PMID: 32197381)</Citation>

      <SectionTitle style={{ marginTop: 24 }}>What Actually Helps</SectionTitle>

      <BodyText>
        Electrolyte-enhanced water is the clear leader for recovery — not because of marketing, but because sodium activates SGLT1 co-transport in the intestine, physically pulling water across the gut wall faster. Plain water doesn't trigger this mechanism. The electrolyte packet in a glass of water will rehydrate you measurably faster than the glass of water alone, which matters when your gut is already compromised.
      </BodyText>

      <BodyText>
        Coffee and energy drinks consistently worsen the situation — caffeine's vasopressin-suppressing effect compounds the overnight deficit already created by alcohol. Juice is a reasonable second option (glucose helps absorption, and potassium partially replaces what's lost). Herbal tea provides fluid without diuretic penalty. The research is consistent: restore electrolytes first, plain water second, everything else later.
      </BodyText>

      <CalcBox>
        This is why Sip AI highlights Water and Electrolytes as "best" picks in Recovery Mode, Juice and Tea as "good," and Coffee, Energy Drinks, Soda, and Alcohol as "avoid." The rankings directly reflect the evidence on rehydration efficacy during hangover recovery.
      </CalcBox>
      <Citation>Verster, Arnoldy et al., Journal of Clinical Medicine, 2020 (PMID: 33207574)</Citation>
    </div>
  );
}

function DecayPage() {
  return (
    <div>
      <SectionTitle>Why Hydration Decays</SectionTitle>
      <StatCard
        text="Even mild dehydration — just 1–2% of body weight — measurably impairs working memory, attention, and inhibitory control, according to a 2021 systematic review of 33 studies"
        color="#f59e0b"
      />
      <BodyText>
        Your body loses water continuously through urination (~1.5L/day), breathing (~0.3L/day), and sweating (~0.5L/day at rest) — totaling 2–3 liters daily before any exercise or heat. This loss doesn't pause while you work, sleep, or scroll your phone. The "8 glasses a day" rule is a rough population average; your actual needs depend heavily on body weight, activity level, climate, and what you ate.
      </BodyText>
      <BodyText>
        What's changed in recent research is a sharper picture of when dehydration starts to matter. A 2021 systematic review screened 4,833 studies and found consistent evidence that even subclinical dehydration — the kind where you don't feel thirsty yet — degrades executive function. Working memory is the most sensitive: tasks requiring you to hold and manipulate information show impairment before physical symptoms appear. This is why hydration tracking matters even on days when you feel fine.
      </BodyText>
      <CalcBox>
        We apply a base 3%/hour decay rate, adjusting for caffeine (+up to 1.5%), electrolytes (-0.4%), alcohol (+0.8%), and hangover mode (×1.5). Activity logging adds an immediate deficit based on estimated sweat loss for your exercise type and duration. The decay model is designed to reflect the continuous, baseline fluid loss your body runs through every hour.
      </CalcBox>
      <Citation>Katz, Airaghi & Davy, Journal of the Academy of Nutrition and Dietetics, 2021 — "Does Hydration Status Influence Executive Function? A Systematic Review" (PMID: 33547031)</Citation>
    </div>
  );
}
