"use client";

import { useTheme } from "next-themes";
import * as React from "react";
import { cn } from "@/lib/utils";
import { HiSun, HiMoon } from "react-icons/hi";

export const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder để tránh SSR mismatch
    return <div className="h-6 w-14 rounded-full bg-gray-200"></div>;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      {/* Sun Icon */}
      <HiSun className="h-5 w-5 text-yellow-400 transition-colors" />

      {/* Toggle Track */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "relative inline-flex h-6 w-14 rounded-full p-1 transition-colors duration-300",
          "bg-muted hover:bg-accent/20", // lấy màu từ CSS variable
          "shadow-inner shadow-black/10 hover:shadow-lg hover:shadow-rainbow-blue/40"
        )}
        aria-label="Toggle Theme"
      >
        {/* Thumb */}
        <span
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full bg-foreground transition-transform duration-300",
            isDark ? "translate-x-8" : "translate-x-0",
            "shadow-md shadow-black/20"
          )}
        />
        {/* Optional gradient glow behind thumb */}
        <span
          className={cn(
            "absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500",
            isDark ? "opacity-30 bg-rainbow-gradient" : "opacity-0"
          )}
        />
      </button>

      {/* Moon Icon */}
      <HiMoon className="h-5 w-5 text-blue-400 transition-colors" />
    </div>
  );
};
