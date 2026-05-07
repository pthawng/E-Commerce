import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import axiosClient from '@/services/axiosClient';

interface LuxuryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
    lowResSrc?: string;
    aspectRatio?: 'square' | 'portrait' | 'landscape' | 'wide';
    priority?: 'high' | 'low' | 'auto';
    productId?: string;
}

export const LuxuryImage: React.FC<LuxuryImageProps> = ({
    src,
    alt,
    className,
    fallback = '/placeholder.svg',
    lowResSrc,
    aspectRatio = 'square',
    priority = 'auto',
    productId,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    const aspectClasses = {
        square: 'aspect-square',
        portrait: 'aspect-[3/4]',
        landscape: 'aspect-[4/3]',
        wide: 'aspect-video',
    };

    return (
        <div className={cn(
            "relative overflow-hidden bg-muted/20",
            aspectClasses[aspectRatio],
            className
        )}>
            {/* Low-res "Blur-up" layer */}
            {lowResSrc && !isLoaded && !error && (
                <img
                    src={lowResSrc}
                    alt={alt}
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50 transition-opacity duration-1000"
                    aria-hidden="true"
                />
            )}

            {/* Main High-integrity Image */}
            <img
                src={error ? fallback : src}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                    setError(true);
                    if (productId && src) {
                        axiosClient.post('/products/report-media-issue', {
                            productId,
                            mediaUrl: src,
                        }).catch(() => {});
                    }
                }}
                fetchPriority={priority === 'high' ? 'high' : 'auto'}
                loading={priority === 'high' ? 'eager' : 'lazy'}
                className={cn(
                    "w-full h-full object-cover transition-all duration-[1200ms] cubic-bezier(0.4, 0, 0.2, 1)",
                    isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm",
                    error && "grayscale opacity-50"
                )}
                {...props}
            />

            {/* Luxury Reveal Overlay */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent animate-pulse" />
            )}

            {/* Gloss Effect (Luxury Signature) */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
    );
};

export default LuxuryImage;
