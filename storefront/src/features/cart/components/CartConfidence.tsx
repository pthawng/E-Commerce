import React from 'react';
import { ShieldCheck, RotateCcw, Ruler } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const CartConfidence = () => {
    const { t } = useTranslation();

    const signals = [
        { icon: ShieldCheck, text: 'Authenticity Guaranteed' },
        { icon: RotateCcw, text: '30-Day Returns' },
        { icon: Ruler, text: 'Complimentary Resizing' },
    ];

    return (
        <div className="space-y-2 mt-2">
            {signals.map((signal, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground/40">
                    <signal.icon size={12} strokeWidth={1} />
                    <span className="font-body text-[9px] uppercase tracking-[0.2em]">
                        {signal.text}
                    </span>
                </div>
            ))}
        </div>
    );
};
