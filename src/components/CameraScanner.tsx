import { useEffect, useRef, useState } from 'react';

// ── Stability tuning ──────────────────────────────────────────────────────────
const SAMPLE_PX     = 32;   // side of the center crop used for frame comparison
const STABLE_DIFF   = 7;    // mean per-channel pixel diff below which = stable
const FRAMES_NEEDED = 14;   // consecutive stable frames before auto-capture (~1.4 s)

interface Props {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

type Phase = 'init' | 'ready' | 'flash' | 'error';

export default function CameraScanner({ onCapture, onClose }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const analysisRef = useRef<HTMLCanvasElement>(null); // tiny offscreen canvas
  const captureRef  = useRef<HTMLCanvasElement>(null); // full-res offscreen canvas

  // Use a ref so the interval closure always sees the latest callback
  const onCaptureRef = useRef(onCapture);
  useEffect(() => { onCaptureRef.current = onCapture; });

  const prevFrameRef  = useRef<Uint8ClampedArray | null>(null);
  const stableRef     = useRef(0);
  const didCaptureRef = useRef(false);

  const [phase,    setPhase]    = useState<Phase>('init');
  const [progress, setProgress] = useState(0); // 0–100

  // ── Core: camera boot + stability interval ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval>;

    // ── Capture helper (called from interval or manual shutter) ────────────
    function grab() {
      if (didCaptureRef.current) return;
      didCaptureRef.current = true;
      clearInterval(intervalId);

      const video  = videoRef.current;
      const canvas = captureRef.current;
      if (!video || !canvas) return;

      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
      stream?.getTracks().forEach(t => t.stop());

      if (mounted) setPhase('flash');
      setTimeout(() => { if (mounted) onCaptureRef.current(base64); }, 380);
    }

    // Expose grab so the manual-capture button can call it
    (window as unknown as Record<string, unknown>).__sipGrab = grab;

    // ── Start camera ───────────────────────────────────────────────────────
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(s => {
        if (!mounted) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().then(() => {
          if (!mounted) return;
          setPhase('ready');

          // ── Stability loop ─────────────────────────────────────────────
          intervalId = setInterval(() => {
            if (!mounted || didCaptureRef.current) return;
            const canvas = analysisRef.current;
            if (!canvas || !video || video.readyState < 2) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Centre-crop into tiny canvas
            const vw = video.videoWidth  || 1;
            const vh = video.videoHeight || 1;
            ctx.drawImage(
              video,
              vw / 2 - SAMPLE_PX / 2,
              vh / 2 - SAMPLE_PX / 2,
              SAMPLE_PX, SAMPLE_PX,
              0, 0, SAMPLE_PX, SAMPLE_PX,
            );
            const { data } = ctx.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX);

            if (prevFrameRef.current) {
              let sum = 0;
              for (let i = 0; i < data.length; i += 4) {
                sum += Math.abs(data[i]   - prevFrameRef.current[i]);
                sum += Math.abs(data[i+1] - prevFrameRef.current[i+1]);
                sum += Math.abs(data[i+2] - prevFrameRef.current[i+2]);
              }
              const avg = sum / (SAMPLE_PX * SAMPLE_PX * 3);

              if (avg < STABLE_DIFF) {
                stableRef.current = Math.min(stableRef.current + 1, FRAMES_NEEDED);
              } else {
                stableRef.current = Math.max(0, stableRef.current - 2);
              }

              const pct = (stableRef.current / FRAMES_NEEDED) * 100;
              if (mounted) setProgress(pct);

              if (stableRef.current >= FRAMES_NEEDED) grab();
            }

            prevFrameRef.current = new Uint8ClampedArray(data);
          }, 100); // 10 fps checks
        });
      })
      .catch(() => { if (mounted) setPhase('error'); });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      stream?.getTracks().forEach(t => t.stop());
      delete (window as unknown as Record<string, unknown>).__sipGrab;
    };
  }, []); // runs once on mount

  // ── Derived style values ───────────────────────────────────────────────────
  const locked      = progress >= 65;
  const bracketClr  = locked ? '#06b6d4' : 'rgba(255,255,255,0.82)';
  const bracketPx   = locked ? 3 : 2;
  const scanLineClr = locked ? '#06b6d4' : 'rgba(255,255,255,0.7)';

  // Bracket shorthand helper
  const corner = (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: 30,
    height: 30,
    transition: 'border-color 0.3s ease, border-width 0.2s ease',
    ...pos,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      maxWidth: 420, margin: '0 auto',
    }}>

      {/* ── Live video ─────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        playsInline muted autoPlay
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: phase === 'flash' ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }}
      />

      {/* ── Capture flash ──────────────────────────────────────────────────── */}
      {phase === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fff', zIndex: 60,
          animation: 'fadeIn 0.05s ease forwards',
        }} />
      )}

      {/* ── Radial vignette ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 65% at 50% 44%, transparent 30%, rgba(0,0,0,0.62) 100%)',
      }} />

      {/* ── Close button ───────────────────────────────────────────────────── */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 18, left: 18, zIndex: 40,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(0,0,0,0.48)',
          border: '1px solid rgba(255,255,255,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* ── Instruction pill ───────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 22, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 40,
      }}>
        <div style={{
          padding: '7px 16px', borderRadius: 20,
          background: 'rgba(0,0,0,0.48)',
          border: '1px solid rgba(255,255,255,0.13)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
            {phase === 'init'  && 'Starting camera…'}
            {phase === 'ready' && (progress > 30 ? 'Hold still…' : 'Point at your drink')}
            {phase === 'flash' && '✓ Got it!'}
            {phase === 'error' && 'Camera unavailable'}
          </span>
        </div>
      </div>

      {/* ── Target viewfinder ──────────────────────────────────────────────── */}
      {(phase === 'ready' || phase === 'flash') && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -56%)',
          width: 224, height: 296,
          zIndex: 30,
        }}>
          {/* Top-left */}
          <div style={corner({
            top: 0, left: 0,
            borderTop:  `${bracketPx}px solid ${bracketClr}`,
            borderLeft: `${bracketPx}px solid ${bracketClr}`,
            borderRadius: '10px 0 0 0',
          })} />
          {/* Top-right */}
          <div style={corner({
            top: 0, right: 0,
            borderTop:   `${bracketPx}px solid ${bracketClr}`,
            borderRight: `${bracketPx}px solid ${bracketClr}`,
            borderRadius: '0 10px 0 0',
          })} />
          {/* Bottom-left */}
          <div style={corner({
            bottom: 0, left: 0,
            borderBottom: `${bracketPx}px solid ${bracketClr}`,
            borderLeft:   `${bracketPx}px solid ${bracketClr}`,
            borderRadius: '0 0 0 10px',
          })} />
          {/* Bottom-right */}
          <div style={corner({
            bottom: 0, right: 0,
            borderBottom: `${bracketPx}px solid ${bracketClr}`,
            borderRight:  `${bracketPx}px solid ${bracketClr}`,
            borderRadius: '0 0 10px 0',
          })} />

          {/* Scan line */}
          <div style={{
            position: 'absolute',
            left: 12, right: 12,
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, transparent, ${scanLineClr} 20%, ${scanLineClr} 80%, transparent)`,
            boxShadow: `0 0 6px ${scanLineClr}, 0 0 18px ${scanLineClr}66`,
            animation: 'scanSweep 2.4s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* ── Bottom HUD ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
        padding: '20px 28px 50px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)',
      }}>

        {phase === 'ready' && (
          <>
            {/* Stability bar */}
            <div style={{ marginBottom: 22 }}>
              <div style={{
                height: 3, borderRadius: 3,
                background: 'rgba(255,255,255,0.13)',
                overflow: 'hidden', marginBottom: 9,
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${progress}%`,
                  background: locked ? '#06b6d4' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.12s linear, background 0.35s ease',
                }} />
              </div>
              <p style={{
                textAlign: 'center', margin: 0,
                fontSize: 12, fontWeight: 500,
                color: locked ? 'rgba(6,182,212,0.85)' : 'rgba(255,255,255,0.48)',
                transition: 'color 0.3s ease',
              }}>
                {locked ? 'Locked on — capturing…' : 'Hold still to auto-capture'}
              </p>
            </div>

            {/* Shutter row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <p style={{ flex: 1, margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.32)', textAlign: 'right', lineHeight: 1.5 }}>
                Auto-captures<br />when stable
              </p>

              {/* Shutter button */}
              <button
                onClick={() => {
                  const grab = (window as unknown as Record<string, unknown>).__sipGrab as (() => void) | undefined;
                  grab?.();
                }}
                style={{
                  width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.93)',
                  border: '5px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s ease',
                }}
                onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.92)')}
                onPointerUp={e   => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#111' }} />
              </button>

              <p style={{ flex: 1, margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.32)', textAlign: 'left', lineHeight: 1.5 }}>
                Tap to<br />capture now
              </p>
            </div>
          </>
        )}

        {phase === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              Camera access was denied. Allow camera permission in your browser settings, or go back to use the file picker.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 28px', borderRadius: 14,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: 'white', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
              }}
            >
              Go back
            </button>
          </div>
        )}
      </div>

      {/* ── Hidden canvases ────────────────────────────────────────────────── */}
      <canvas ref={analysisRef} width={SAMPLE_PX} height={SAMPLE_PX} style={{ display: 'none' }} />
      <canvas ref={captureRef}  style={{ display: 'none' }} />
    </div>
  );
}
