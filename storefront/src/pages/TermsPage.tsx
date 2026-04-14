import React, { useEffect } from 'react';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { legalContent } from '@/data/legal-content';
import { useStore } from '@/store/useStore';

export const TermsPage: React.FC = () => {
  const { language } = useStore();
  const content = legalContent[language].terms;

  useEffect(() => {
    document.title = `${content.title} | Ray Paradis`;
  }, [content.title]);

  return <LegalLayout content={content} />;
};

export default TermsPage;
