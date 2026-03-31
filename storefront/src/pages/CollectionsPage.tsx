import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, RefreshCw, ShoppingBag, Search, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useCategories } from "@/features/products/hooks/useCategories";
import { useStore } from "@/store/useStore";
import { useTranslation } from "@/hooks/useTranslation";
import { mapProductToCardProps, getLocalized } from "@/features/products/utils/productMapper";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

export const CollectionsPage = () => {
    const { language, formatPrice } = useStore();
    const { t } = useTranslation();

  useEffect(() => {
    document.title = t('common.meta.collections');
  }, [t]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const parentRef = useRef<HTMLDivElement>(null);
    
    // Elite UX: Debounce search
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: categories } = useCategories();

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useProducts({
        limit: 12,
        categoryId: activeCategory || undefined,
        search: debouncedSearch || undefined,
    });

    const allProducts = useMemo(() => {
        const flat = data?.pages.flatMap(page => page.data) || [];
        return flat.map(p => mapProductToCardProps(p, language, formatPrice));
    }, [data?.pages, language, formatPrice]);

    // Grid Configuration: Responsively determine columns
    // We assume: 1 col (<640px), 2 cols (<1024px), 3 cols (<1280px), 4 cols (>=1280px)
    // For virtualization, we virtualize ROWS.
    const columns = 4; // Simplified logic for demo, in production use window width listener
    const rowCount = Math.ceil(allProducts.length / columns);

    const virtualizer = useWindowVirtualizer({
        count: rowCount,
        estimateSize: () => 600, // Estimated height of a ProductCard row
        overscan: 2,
        scrollMargin: 400, // Offset for the header
    });

    const lastPageMeta = data?.pages[data.pages.length - 1]?.meta;

    const handleFilterChange = (categoryId: string | null) => {
        setActiveCategory(categoryId);
    };

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="pt-28 sm:pt-32">
                <Section padding="sm" className="bg-secondary/20">
                    <Container className="text-center">
                        <motion.p
                            className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {t('shop.listing.subtitle')}
                        </motion.p>
                        <motion.h1
                            className="font-display text-4xl sm:text-5xl lg:text-7xl text-primary italic font-normal tracking-luxury mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {t('shop.listing.title')}
                        </motion.h1>
                    </Container>
                </Section>

                {/* Filter Bar */}
                <div className="sticky top-20 sm:top-24 z-30 bg-background/80 backdrop-blur-xl border-y border-border/10">
                    <Container className="flex items-center justify-between h-16 sm:h-20 gap-4">
                        <div className="flex items-center gap-8 flex-1">
                            <div className="relative w-full max-w-xs group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-gold transition-colors" />
                                <Input 
                                    placeholder={t('shop.listing.search')} 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10 rounded-full border-border/10 bg-secondary/10 focus-visible:ring-gold/20 font-body text-xs"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-gold">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <nav className="hidden lg:flex items-center gap-8">
                                <button
                                    onClick={() => handleFilterChange(null)}
                                    className={cn(
                                        "font-body text-[10px] uppercase tracking-widest transition-all pb-1 border-b",
                                        activeCategory === null ? "text-primary border-gold" : "text-muted-foreground border-transparent hover:text-primary"
                                    )}
                                >
                                    {t('shop.listing.all')}
                                </button>
                                {categories?.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleFilterChange(cat.id)}
                                        className={cn(
                                            "font-body text-[10px] uppercase tracking-widest transition-all pb-1 border-b",
                                            activeCategory === cat.id ? "text-primary border-gold" : "text-muted-foreground border-transparent hover:text-primary"
                                        )}
                                    >
                                        {getLocalized(cat.name, language)}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
                                {allProducts.length} {t('shop.listing.items')}
                            </span>
                        </div>
                    </Container>
                </div>

                {/* Grid Section */}
                <Section padding="lg">
                    <Container>
                        {isError ? (
                            <div className="py-20 flex justify-center text-center">
                                <Alert className="max-w-md border-destructive/20 bg-destructive/5">
                                    <AlertTitle className="text-destructive font-display tracking-wide">{t('common.error')}</AlertTitle>
                                    <AlertDescription className="text-destructive/80 font-body text-sm mt-2">
                                        {t('common.actions.tryAgain')}
                                    </AlertDescription>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                                        <RefreshCw className="mr-2 h-3 w-3" /> {t('shop.pdp.notFound.retry')}
                                    </Button>
                                </Alert>
                            </div>
                        ) : isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                            </div>
                        ) : allProducts.length === 0 ? (
                            <div className="py-32 text-center">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
                                <h3 className="font-display text-2xl text-primary/60 mb-2 italic">{t('shop.listing.emptyTitle')}</h3>
                                <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground/60">{t('shop.listing.emptyDesc')}</p>
                            </div>
                        ) : (
                            <div ref={parentRef} className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                                {virtualizer.getVirtualItems().map((virtualRow) => (
                                    <div
                                        key={virtualRow.key}
                                        className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {allProducts.slice(virtualRow.index * columns, (virtualRow.index + 1) * columns).map((product, i) => (
                                            <ProductCard key={product.id} {...product} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Trigger */}
                        {hasNextPage && (
                            <div className="mt-24 text-center">
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="rounded-full px-16"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : t('common.actions.revealMore')}
                                </Button>
                            </div>
                        )}
                    </Container>
                </Section>
            </div>
        </Layout>
    );
};
