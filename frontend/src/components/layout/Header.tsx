"use client";

import { ThemeToggle } from '../theme/ThemeToggle';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ButtonIcon } from '@/components/base/Button';
import { MapPin, Phone, User } from "lucide-react";

export function Header() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <a className="flex items-center space-x-2" href="/">
            <span className="text-xl font-bold">
              My App
            </span>
          </a>
        </div>
        <ButtonIcon className="sm:bg-red-500 md:bg-green-400 lg:bg-blue-500" icon={MapPin} />

        {/* Navigation & Theme Toggle */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              href="/docs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Docs
            </a>
            <a
              href="/about"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              About
            </a>
          </nav>
          
          {/* Theme Toggle với điều kiện mounted */}
          <div className="flex items-center">
            {mounted && <ThemeToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}