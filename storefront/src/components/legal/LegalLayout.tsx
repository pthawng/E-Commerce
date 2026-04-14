import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { LegalTOC } from './LegalTOC';
import { LegalSection } from './LegalSection';
import { LegalPageContent } from '@/data/legal-content';
import { cn } from '@/lib/utils';

interface LegalLayoutProps {
  content: LegalPageContent;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ content }) => {
  const [activeId, setActiveId] = useState(content.sections[0].id);

  const tocItems = content.sections.map(s => ({
    id: s.id,
    title: s.title
  }));

  return (
    <Layout forceHeaderOpaque={true}>
      {/* Skip to Content for Accessibility */}
      <a 
        href="#legal-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-24 focus:left-6 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-primary focus:rounded-full font-body text-xs uppercase tracking-widest transition-all"
      >
        Skip to main content
      </a>



      {/* Main Body */}
      <Section id="legal-content" className="pt-32 lg:pt-40 pb-24 print:py-0">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 relative">
            
            {/* Sidebar TOC - Desktop only in columns, Mobile is sticky top bar in TOC component */}
            <aside className="lg:w-1/4 print:hidden">
              <LegalTOC 
                items={tocItems} 
                activeId={activeId} 
                pageTitle={content.title} 
                lastUpdated={content.lastUpdated} 
              />
            </aside>

            {/* Content Area */}
            <article className="flex-1 max-w-[720px] mx-auto lg:mx-0 print:max-w-none print:w-full">
              <div className="space-y-12">
                {content.sections.map((section) => (
                  <LegalSection 
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    onVisible={setActiveId}
                  >
                    {Array.isArray(section.content) ? (
                      section.content.map((p, idx) => (
                        <p key={idx} className={cn("leading-relaxed", idx > 0 && "mt-6")}>
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="leading-relaxed">{section.content}</p>
                    )}

                    {section.subsections && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 bg-secondary/5 p-8 rounded-2xl print:bg-transparent print:p-0">
                        {section.subsections.map((sub, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="font-display text-lg text-primary italic">{sub.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{sub.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </LegalSection>
                ))}
              </div>

              {/* Print Footer */}
              <div className="hidden print:block mt-24 pt-8 border-t border-hairline text-center text-[10px] text-muted-foreground uppercase tracking-widest">
                Official Document of Ray Paradis Luxury | a80efc88-3a14-4c6c-8dd4-7f8cef4a4e42
              </div>
            </article>

          </div>
        </Container>
      </Section>

      {/* Global CSS Overrides for Reading UX & Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, aside, footer, header, .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .max-w-\\[720px\\] { max-width: none !important; width: 100% !important; }
          section { page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 2rem; }
        }
        
        /* Reading Focus System */
        article p {
          color: hsl(var(--foreground) / 0.85);
          font-kerning: normal;
          font-variant-ligatures: common-ligatures;
        }
        
        /* Smooth anchor jumping */
        html {
          scroll-behavior: smooth;
        }
      `}} />
    </Layout>
  );
};
