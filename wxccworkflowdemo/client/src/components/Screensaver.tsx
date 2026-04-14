import { useEffect, useRef, useState } from "react";
import logoUrl from "@/assets/logo_darkbackground.png";

// Orb definition
interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  color: string;
}

const ORB_COLORS = [
  "rgba(5,195,221,OP)",
  "rgba(0,169,145,OP)",
  "rgba(5,130,221,OP)",
  "rgba(80,200,255,OP)",
];

function makeOrb(width: number, height: number): Orb {
  const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)];
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 80 + Math.random() * 220,
    opacity: 0.08 + Math.random() * 0.18,
    color,
  };
}

function useIdleTimer(idleMs: number, onIdle: () => void, onActive: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  useEffect(() => {
    const reset = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        onActive();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        onIdle();
      }, idleMs);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // start timer immediately

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [idleMs, onIdle, onActive]);
}

interface ScreensaverProps {
  idleSeconds?: number;
}

export default function Screensaver({ idleSeconds = 45 }: ScreensaverProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false); // delayed unmount for fade-out
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const rafRef = useRef<number>(0);
  const [pulse, setPulse] = useState(false);

  useIdleTimer(
    idleSeconds * 1000,
    () => setVisible(true),
    () => setVisible(false),
  );

  // Manage mount/unmount with fade delay
  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 600);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Pulsing CTA beacon
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(id);
  }, [visible]);

  // Canvas animation
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      orbsRef.current = Array.from({ length: 14 }, () => makeOrb(canvas.width, canvas.height));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const orb of orbsRef.current) {
        // Move
        orb.x += orb.vx;
        orb.y += orb.vy;
        // Bounce
        if (orb.x - orb.r < 0 || orb.x + orb.r > width) orb.vx *= -1;
        if (orb.y - orb.r < 0 || orb.y + orb.r > height) orb.vy *= -1;

        // Draw soft radial glow
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        const c = orb.color.replace("OP", String(orb.opacity));
        grad.addColorStop(0, c);
        grad.addColorStop(1, orb.color.replace("OP", "0"));
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#040b14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => setVisible(false)}
    >
      {/* Animated orb canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Top scan line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(5,195,221,0.6) 40%, rgba(5,195,221,0.6) 60%, transparent 100%)",
          animation: "scanline 6s linear infinite",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2.5rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        {/* Logo */}
        <img
          src={logoUrl}
          alt="ArchiTech"
          style={{ height: "56px", width: "auto", mixBlendMode: "screen", filter: "drop-shadow(0 0 32px rgba(5,195,221,0.5))" }}
        />

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: "0 0 40px rgba(5,195,221,0.4), 0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            The Digital Front Door
          </h2>
          <p
            style={{
              fontSize: "clamp(0.85rem, 2vw, 1.2rem)",
              fontWeight: 600,
              color: "#05C3DD",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              margin: 0,
              textShadow: "0 0 20px rgba(5,195,221,0.6)",
            }}
          >
            Patient Experience Journey — Live Demo
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "240px",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(5,195,221,0.5) 50%, transparent 100%)",
          }}
        />

        {/* CTA beacon */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "2px solid rgba(5,195,221,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: pulse
                ? "0 0 0 16px rgba(5,195,221,0.06), 0 0 0 32px rgba(5,195,221,0.03), 0 0 40px rgba(5,195,221,0.4)"
                : "0 0 0 8px rgba(5,195,221,0.08), 0 0 20px rgba(5,195,221,0.2)",
              transition: "box-shadow 1.2s ease",
              background: "rgba(5,195,221,0.08)",
            }}
          >
            {/* Tap/touch icon — concentric rings */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="3" fill="rgba(5,195,221,1)" />
              <circle cx="16" cy="16" r="7" stroke="rgba(5,195,221,0.7)" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="12" stroke="rgba(5,195,221,0.35)" strokeWidth="1.2" />
            </svg>
          </div>
          <p
            style={{
              fontSize: "clamp(0.75rem, 1.5vw, 0.95rem)",
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Touch anywhere to begin
          </p>
        </div>

        {/* Powered by pill */}
        <div
          style={{
            position: "absolute",
            bottom: "-6rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "1px solid rgba(5,195,221,0.2)",
            background: "rgba(5,195,221,0.05)",
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00A991", boxShadow: "0 0 6px rgba(0,169,145,0.8)" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00A991", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Powered by Webex Contact Centre
          </span>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 1; }
          95% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
