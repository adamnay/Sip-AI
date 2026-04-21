interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Floating particle config — varied positions, sizes, timings
const PARTICLES = [
  { x: 8,  delay: 0,    dur: 4.2, size: 5, cyan: true  },
  { x: 19, delay: 1.1,  dur: 3.6, size: 3, cyan: false },
  { x: 31, delay: 0.4,  dur: 4.8, size: 6, cyan: true  },
  { x: 44, delay: 2.0,  dur: 3.2, size: 4, cyan: false },
  { x: 57, delay: 0.8,  dur: 4.5, size: 5, cyan: true  },
  { x: 68, delay: 1.5,  dur: 3.9, size: 3, cyan: false },
  { x: 79, delay: 0.2,  dur: 4.1, size: 7, cyan: true  },
  { x: 90, delay: 1.8,  dur: 3.5, size: 4, cyan: false },
  { x: 25, delay: 2.6,  dur: 4.6, size: 3, cyan: true  },
  { x: 62, delay: 0.6,  dur: 3.3, size: 5, cyan: false },
];

export default function WelcomePage({ onGetStarted, onLogin }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'calc(36px + env(safe-area-inset-bottom, 0px))',
    }}>

      {/* ── Background: large slow-drifting glow orbs ── */}
      <div style={{
        position: 'absolute', top: '-8%', left: '50%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 68%)',
        animation: 'welcomeGlow 5s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '15%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        animation: 'welcomeOrb 7s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '25%', right: '8%',
        width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        animation: 'welcomeOrb 9s ease-in-out 2s infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: `${5 + (i % 4) * 3}%`,
          left: `${p.x}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.cyan
            ? `rgba(6,182,212,${0.3 + (i % 3) * 0.1})`
            : `rgba(139,92,246,${0.25 + (i % 3) * 0.1})`,
          animation: `welcomeFloat ${p.dur}s ease-in ${p.delay}s infinite`,
          pointerEvents: 'none',
          filter: 'blur(0.5px)',
        }} />
      ))}

      {/* ── Hero icon with radiating rings ── */}
      <div style={{ position: 'relative', marginBottom: 38 }}>
        {/* Three staggered expanding rings */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 116, height: 116, borderRadius: '50%',
            border: '1.5px solid rgba(6,182,212,0.4)',
            animation: `welcomeRing 2.7s ease-out ${i * 0.9}s infinite`,
          }} />
        ))}

        {/* Icon */}
        <div style={{
          width: 116, height: 116, borderRadius: 34,
          background: 'linear-gradient(145deg, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.12) 100%)',
          border: '1px solid rgba(6,182,212,0.24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'welcomeIconBob 3.6s ease-in-out infinite',
          position: 'relative', zIndex: 1,
          boxShadow: '0 0 48px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <img src="/icon.png" alt="" style={{ width: 74, height: 74, borderRadius: 20 }} />
        </div>
      </div>

      {/* ── Text ── */}
      <div style={{ textAlign: 'center', marginBottom: 46, padding: '0 24px' }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(6,182,212,0.65)',
          margin: '0 0 12px',
          animation: 'welcomeIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}>
          Welcome to
        </p>

        {/* Wordmark */}
        <h1 style={{
          fontSize: 68, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.92,
          margin: '0 0 20px',
          background: 'linear-gradient(140deg, #ffffff 0%, #a5f3fc 40%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'welcomeIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.28s both',
        }}>
          Sip AI
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 17, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.01em',
          color: 'rgba(255,255,255,0.42)',
          margin: 0,
          animation: 'welcomeIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.48s both',
        }}>
          Change your life with one habit.
        </p>
      </div>

      {/* ── CTA ── */}
      <div style={{
        width: '100%', maxWidth: 380, padding: '0 24px',
        animation: 'welcomeIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.68s both',
      }}>

        {/* Primary button */}
        <button
          onClick={onGetStarted}
          style={{
            width: '100%', padding: '19px',
            borderRadius: 22, border: 'none',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            color: '#fff', fontSize: 18, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '-0.02em',
            boxShadow: '0 0 48px rgba(6,182,212,0.28), 0 8px 28px rgba(0,0,0,0.5)',
            position: 'relative', overflow: 'hidden',
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onPointerUp={e   => (e.currentTarget.style.transform = 'scale(1)')}
          onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>Start Here →</span>
          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            overflow: 'hidden',
            borderRadius: 22,
          }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              width: '45%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
              animation: 'welcomeShimmer 3s ease-in-out 1.8s infinite',
            }} />
          </div>
        </button>

        {/* Log-in link */}
        <p style={{
          textAlign: 'center', margin: '22px 0 0',
          fontSize: 14, color: 'rgba(255,255,255,0.28)',
          letterSpacing: '-0.01em',
        }}>
          Already have an account?{' '}
          <button
            onClick={onLogin}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(6,182,212,0.75)', fontWeight: 700,
              fontSize: 14, fontFamily: 'inherit', padding: 0,
            }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
