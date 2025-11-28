'use client'; 

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useEffect, useState } from "react";
import { ButtonIcon } from '@/components/base/Button';
import { MapPin, Phone} from "lucide-react";
import { RightDrawer } from '@/components/composite/Header/RightDrawer';
export function RightSection() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center">
      {/* <LanguageSelection /> */}
      <ButtonIcon  icon={MapPin} />
      <ButtonIcon  icon={Phone} />
      <RightDrawer />
      {mounted && <ThemeToggle />}
    </div>
  );
}