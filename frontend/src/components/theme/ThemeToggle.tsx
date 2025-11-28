"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiSun, HiMoon } from "react-icons/hi";

export const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle Theme"
      className="
        relative w-11 h-11 rounded-full 
        flex items-center justify-center
        bg-bg-secondary/80 backdrop-blur-sm
        border border-border-light/60
        shadow-[0_1px_4px_rgba(0,0,0,0.08)]
        transition-all duration-300
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        hover:bg-bg-secondary
      "
    >
      {/* Glow subtle */}
      <span
        className="
          absolute inset-0 rounded-full pointer-events-none
          bg-primary/10 opacity-0
          transition-opacity duration-300
          group-hover:opacity-40
        "
      />

      {isDark ? (
        <HiMoon className="w-5 h-5 text-button-text transition-opacity duration-300" />
      ) : (
        <HiSun className="w-5 h-5 text-button-text transition-opacity duration-300" />
      )}
    </button>
  );
};
