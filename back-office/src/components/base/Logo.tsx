import { type CSSProperties } from "react";

interface LogoProps {
  className?: string;
  color?: string; // can override primary if needed
}

const logoClasses = `
  font-['Great_Vibes']
  text-4xl
  font-normal
  tracking-wide
  select-none
`;

export function Logo({
  className = "",
  color = "var(--color-blue-primary)",
}: LogoProps) {
  return (
    <div
      className={`logo-wrapper relative inline-block ${className}`}
      style={{ "--primary-color": color } as CSSProperties}
      aria-label="Ray Paradis"
    >
      <span className={`logo-text ${logoClasses}`}>Ray Paradis</span>

      {/* Subtle shine element */}
      <span className="shine" />

      {/* Tiny refined sparkles */}
      <span className="sparkle" style={{ left: "14%", top: "44%" }} />
      <span className="sparkle" style={{ left: "66%", top: "18%" }} />
      <span className="sparkle" style={{ left: "84%", top: "56%" }} />

      <style>{`
        .logo-text {
          background: linear-gradient(
            90deg,
            rgba(10,61,98,0.95),
            var(--primary-color),
            rgba(52,160,164,0.95)
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          color: transparent;
          animation: oceanFlow 12s ease-in-out infinite;
          filter: drop-shadow(0 1px 2px rgba(10, 61, 98, 0.18));
        }

        .shine {
          position: absolute;
          top: 0;
          left: -35%;
          width: 36%;
          height: 100%;
          background: linear-gradient(
            115deg,
            transparent,
            rgba(255,255,255,0.45),
            transparent
          );
          transform: skewX(-18deg);
          animation: shineMove 8s ease-in-out infinite;
          opacity: 0.18;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.95), rgba(52,160,164,0.9));
          animation: sparklePulse 3.8s ease-in-out infinite;
          opacity: 0.75;
          pointer-events: none;
        }

        @keyframes oceanFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: -180% 50%; }
        }

        @keyframes shineMove {
          0% { left: -35%; }
          45% { left: 110%; opacity: 0.18; }
          100% { left: 110%; opacity: 0.18; }
        }

        @keyframes sparklePulse {
          0% { transform: scale(0.2); opacity: 0; }
          50% { transform: scale(1); opacity: 0.85; }
          100% { transform: scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
