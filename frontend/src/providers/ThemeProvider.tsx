"use client";

import { ThemeProvider } from "next-themes";

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"   
      defaultTheme="light"  
      enableSystem={false}  
      storageKey="theme"    
    >
      {children}
    </ThemeProvider>
  );
}
