import React from 'react';
import HighlightVisual from './HighLightVisual';
import HighlightContent from './HighLightContent';

interface HighlightSectionProps {
  title: string;
  subtitle?: string;
  description: string;
  imageSrc: string;
  ctaText?: string;
  reversed?: boolean;
}

export default function HighlightSection({
  title,
  subtitle,
  description,
  imageSrc,
  ctaText = 'Discover',
  reversed = false,
}: HighlightSectionProps) {
  return (
    <section className="w-full py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Logic đảo chiều layout nằm ở đây */}
        <div className={`flex flex-col gap-12 md:flex-row md:items-center md:gap-24 ${reversed ? 'md:flex-row-reverse' : ''}`}>
          
          {/* Component con 1: Ảnh */}
          <HighlightVisual src={imageSrc} alt={title} />

          {/* Component con 2: Nội dung */}
          <HighlightContent 
            title={title}
            subtitle={subtitle}
            description={description}
            ctaText={ctaText}
          />
          
        </div>
      </div>
    </section>
  );
}