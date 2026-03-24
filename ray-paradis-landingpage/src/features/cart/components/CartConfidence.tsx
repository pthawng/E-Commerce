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
        <div className="mt-6 pt-6 border-t border-hairline space-y-3">
            {signals.map((signal, index) => (
                <div key={index} className="flex items-center gap-3 text-muted-foreground/60">
                    <signal.icon size={14} strokeWidth={1.2} />
                    <span className="font-body text-[10px] uppercase tracking-widest">
                        {signal.text}
                    </span>
                </div>
            ))}
        </div>
    );
};
