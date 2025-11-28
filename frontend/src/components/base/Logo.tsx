"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, CSSProperties } from "react"; // Import CSSProperties

// 1. Định nghĩa kiểu dữ liệu cho Props
interface LogoProps {
  color?: string; // Dấu ? nghĩa là không bắt buộc (vì có giá trị mặc định)
}

const logoClasses = `
  font-['Great_Vibes']
  text-5xl
  font-normal
  tracking-wide
  transition-all duration-300 ease-in-out
`;

// 2. Gán kiểu LogoProps cho component
export function Logo({ color = "black" }: LogoProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <Link href="/vi" aria-label="Back to homepage">
      {isHomePage ? (
        <h1 className="m-0 p-0 leading-none">
          <RainbowLogo color={color} />
        </h1>
      ) : (
        <div className="leading-none">
          <RainbowLogo color={color} />
        </div>
      )}
    </Link>
  );
}

// 2. Gán kiểu LogoProps cho component con
function RainbowLogo({ color }: LogoProps) {
  const [isIntro, setIsIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntro(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`logo-wrapper relative inline-block ${isIntro ? "active-state" : ""}`}
      style={{
        "--normal-text-color": color,
      } as CSSProperties}
    >
      {/* TEXT */}
      <span className={`target-text ${logoClasses}`}>
        Ray Paradis
      </span>

      {/* Sparkles */}
      <span className="sparkle" style={{ left: "10%", top: "30%", animationDelay: "0s" }} />
      <span className="sparkle" style={{ left: "60%", top: "10%", animationDelay: "1s" }} />
      <span className="sparkle" style={{ left: "80%", top: "50%", animationDelay: "2s" }} />

      <style jsx>{`
        /* --- TRẠNG THÁI MẶC ĐỊNH --- */
        .target-text {
          color: var(--normal-text-color);
          background: none;
          filter: none;
        }

        .sparkle {
          opacity: 0;
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            rgba(255, 215, 0, 1) 0%,
            rgba(255, 255, 255, 1) 70%
          );
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        /* --- TRẠNG THÁI ACTIVE (INTRO HOẶC HOVER) --- */
        .logo-wrapper.active-state .target-text,
        .logo-wrapper:hover .target-text {
          background: linear-gradient(
            90deg,
            #ff7eb3,
            #ff758c,
            #ffc3a0,
            #8da5ff,
            #7fccff,
            #d4fc79,
            #ff7eb3
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          color: transparent; /* Quan trọng: chữ trong suốt để hiện màu nền */
          animation: rainbowMove 8s linear infinite;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
        }

        .logo-wrapper.active-state .sparkle,
        .logo-wrapper:hover .sparkle {
          opacity: 1;
          animation: sparkleFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 0 4px rgba(255, 165, 0, 0.8));
        }

        @keyframes rainbowMove {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: -200% 50%;
          }
        }

        @keyframes sparkleFloat {
          0% {
            transform: scale(0) translateY(5px) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) translateY(0px) rotate(45deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) translateY(-10px) rotate(90deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}