import React from 'react';
import { useStore } from '@/store/useStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'zh', name: 'Chinese', native: '简体中文' },
] as const;

interface LocaleSelectorProps {
    isOpaque?: boolean;
}

export const LocaleSelector = ({ isOpaque }: LocaleSelectorProps) => {
    const { language, setLanguage } = useStore();

    const currentLang = languages.find(l => l.code === language) || languages[0];

    const textClass = isOpaque ? 'text-primary' : 'text-white dark:text-foreground';
    const borderClass = isOpaque ? 'border-primary/20' : 'border-white/20 dark:border-foreground/20';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderClass} hover:bg-white/5 transition-all duration-500`}
                    aria-label="Select Language"
                >
                    <Globe className={`w-3.5 h-3.5 ${textClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
                    <span className={`font-body text-[10px] tracking-[0.2em] uppercase font-medium ${textClass}`}>
                        {currentLang.code}
                    </span>
                    <ChevronDown className={`w-3 h-3 ${textClass} opacity-40 group-hover:opacity-80 transition-all duration-500 group-data-[state=open]:rotate-180`} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="min-w-[160px] bg-background/95 backdrop-blur-xl border-border/10 p-1.5 animate-in fade-in slide-in-from-top-2 duration-300"
            >
                <div className="px-2 py-1.5 mb-1">
                    <p className="text-[10px] font-body uppercase tracking-[0.15em] text-muted-foreground/60">
                        Select Language
                    </p>
                </div>
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors duration-300 focus:bg-primary/5 ${language === lang.code ? 'bg-primary/5 text-primary' : 'text-foreground/70 hover:text-foreground'
                            }`}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="font-body text-xs font-medium tracking-wide">
                                {lang.native}
                            </span>
                            <span className="text-[9px] font-body uppercase tracking-widest opacity-40">
                                {lang.name}
                            </span>
                        </div>
                        {language === lang.code && (
                            <Check className="w-3.5 h-3.5 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
