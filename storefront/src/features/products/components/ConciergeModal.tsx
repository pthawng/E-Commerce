import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck } from 'lucide-react';

export const ConciergeModal = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [productInfo, setProductInfo] = useState<{ productId: string; name: string } | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const handleOpen = (e: Event) => {
            const customEvent = e as CustomEvent;
            setProductInfo(customEvent.detail);
            setIsSubmitted(false);
            setIsOpen(true);
        };

        window.addEventListener('open-concierge-modal', handleOpen);
        return () => window.removeEventListener('open-concierge-modal', handleOpen);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would submit the lead to the backend CRM.
        setIsSubmitted(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] border-border/10 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-sm">
                <div className="bg-secondary/10 p-8 text-center border-b border-border/5">
                    <ShieldCheck className="w-8 h-8 text-gold mx-auto mb-4" />
                    <DialogTitle className="font-display text-2xl italic tracking-wide text-primary">
                        Private Concierge
                    </DialogTitle>
                    <DialogDescription className="font-body text-xs text-muted-foreground mt-2 tracking-widest uppercase">
                        {productInfo?.name}
                    </DialogDescription>
                </div>

                <div className="p-8">
                    {isSubmitted ? (
                        <div className="text-center space-y-6 py-8">
                            <p className="font-display text-xl text-primary">
                                Your Request is Received
                            </p>
                            <p className="font-body text-sm text-muted-foreground leading-relaxed">
                                A dedicated Sales Advisor will contact you shortly to arrange a private viewing or assist with your acquisition.
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsOpen(false)}
                                className="mt-4 border-primary/20 text-xs tracking-widest uppercase"
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Input 
                                        placeholder="Full Name" 
                                        required 
                                        className="border-b border-border/20 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-body text-sm placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div>
                                    <Input 
                                        type="email" 
                                        placeholder="Email Address" 
                                        required 
                                        className="border-b border-border/20 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-body text-sm placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div>
                                    <Input 
                                        type="tel" 
                                        placeholder="Phone Number (WhatsApp preferred)" 
                                        className="border-b border-border/20 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-body text-sm placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <div>
                                    <Textarea 
                                        placeholder="Any specific requests or questions?" 
                                        className="border-b border-border/20 bg-transparent rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 font-body text-sm placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                            
                            <Button type="submit" variant="luxury" className="w-full tracking-widest text-[10px] uppercase h-14">
                                Request Private Consultation
                            </Button>
                            
                            <p className="text-center font-body text-[9px] text-muted-foreground/60 tracking-widest uppercase">
                                Your information is handled with the utmost discretion.
                            </p>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
