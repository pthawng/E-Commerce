import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = t('common.meta.notFound');
  }, [location.pathname, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-10">
      <div className="text-center max-w-md">
        <h1 className="font-display text-8xl text-primary/20 mb-8 font-normal">404</h1>
        <h2 className="font-display text-3xl text-primary mb-6 font-normal">
          {t('shop.pdp.notFound.title')}
        </h2>
        <p className="font-body text-sm text-muted-foreground mb-12 leading-relaxed">
          {t('shop.pdp.notFound.description')}
        </p>
        <Button variant="luxury" size="lg" asChild className="w-full sm:w-auto">
          <a href="/">
            {t('common.actions.backToHome')}
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
