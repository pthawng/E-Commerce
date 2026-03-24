import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, RefreshCw, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useProducts } from "@/features/products/hooks/useProducts";
import { useCategories } from "@/features/products/hooks/useCategories";
import { useStore } from "@/store/useStore";
import { mapProductToCardProps, getLocalized } from "@/features/products/utils/productMapper";
import { ProductCardSkeleton } from "@/features/products/components/ProductCardSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationMeta } from "@shared";

export const CollectionsPage = () => {
    const { language, formatPrice } = useStore();
    const [page, setPage] = useState(1);
    const [activeCategory, setActiveCategory] = useState<string | null>(null); // Use ID or slug

    // Fetch Categories
    const { data: categories, isLoading: isLoadingCats } = useCategories();

    // Fetch Products
    const {
        data: productResponse,
        isLoading,
        isError,
        refetch,
        isFetching
    } = useProducts({
        page,
        limit: 12, // Standard professional limit
        categoryId: activeCategory || undefined
    });

    // Map data to UI models
    const products = useMemo(() => {
        return (productResponse?.data || []).map(p => mapProductToCardProps(p, language, formatPrice));
    }, [productResponse?.data, language, formatPrice]);

    const meta = productResponse?.meta;

    const handleLoadMore = () => {
        if (meta?.page && meta.page < meta.totalPages) {
            setPage(prev => prev + 1);
        }
    };

    const handleFilterChange = (categoryId: string | null) => {
        setActiveCategory(categoryId);
        setPage(1); // Reset to first page
    };

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="pt-28 sm:pt-32">
                {/* Header Section */}
                <Section padding="sm" className="bg-secondary/20">
                    <Container className="text-center">
                        <motion.p
                            className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            The Collection
                        </motion.p>
                        <motion.h1
                            className="font-display text-4xl sm:text-5xl lg:text-7xl text-primary italic font-normal tracking-luxury mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            Legacy & <span className="text-primary/80">Innovation</span>
                        </motion.h1>
                    </Container>
                </Section>

                {/* Filter / Sort Bar */}
                <div className="sticky top-20 sm:top-24 z-30 bg-background/80 backdrop-blur-xl border-y border-border/10">
                    <Container className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-8">
                            <button className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-primary/80 hover:text-gold transition-colors">
                                <SlidersHorizontal className="w-3 h-3" />
                                Filters
                            </button>
                            <nav className="hidden md:flex items-center gap-8">
                                <button
                                    onClick={() => handleFilterChange(null)}
                                    className={cn(
                                        "font-body text-[10px] uppercase tracking-widest transition-all pb-1 border-b",
                                        activeCategory === null
                                            ? "text-primary border-gold"
                                            : "text-muted-foreground border-transparent hover:text-primary"
                                    )}
                                >
                                    All
                                </button>
                                {categories?.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleFilterChange(cat.id)}
                                        className={cn(
                                            "font-body text-[10px] uppercase tracking-widest transition-all pb-1 border-b",
                                            activeCategory === cat.id
                                                ? "text-primary border-gold"
                                                : "text-muted-foreground border-transparent hover:text-primary"
                                        )}
                                    >
                                        {getLocalized(cat.name, language)}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
                                {meta?.totalItems || 0} Items
                            </span>
                            <button className="flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-primary/80 hover:text-gold transition-colors">
                                Sort by
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                    </Container>
                </div>

                {/* Product Grid */}
                <Section padding="lg">
                    <Container>
                        {isError ? (
                            <div className="py-20 flex justify-center">
                                <Alert className="max-w-md border-destructive/20 bg-destructive/5">
                                    <AlertTitle className="text-destructive font-display tracking-wide">Connection Error</AlertTitle>
                                    <AlertDescription className="text-destructive/80 font-body text-sm mt-2">
                                        We couldn't retrieve the treasures at this moment. Please check your connection and try again.
                                    </AlertDescription>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-4 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => refetch()}
                                    >
                                        <RefreshCw className="mr-2 h-3 w-3" /> Retry
                                    </Button>
                                </Alert>
                            </div>
                        ) : isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="py-32 text-center"
                            >
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6 stroke-[1]" />
                                <h3 className="font-display text-2xl text-primary/60 mb-2 italic">A Rare Void</h3>
                                <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground/60">
                                    No treasures found in this collection category.
                                </p>
                                <Button 
                                    variant="link" 
                                    className="mt-6 text-gold text-[10px] tracking-widest uppercase hover:text-primary"
                                    onClick={() => handleFilterChange(null)}
                                >
                                    Return to All Masterpieces
                                </Button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                                    <AnimatePresence mode="popLayout">
                                        {products.map((product, index) => (
                                            <motion.div
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.6, delay: (index % 4) * 0.1 }}
                                            >
                                                <ProductCard {...product} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Pagination/Load More */}
                                {(meta?.page || 1) < (meta?.totalPages || 0) && (
                                    <div className="mt-24 text-center">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            className="rounded-full px-16 group"
                                            onClick={handleLoadMore}
                                            disabled={isFetching}
                                        >
                                            {isFetching ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Reveal More"
                                            )}
                                        </Button>
                                        <p className="mt-8 font-body text-[10px] uppercase tracking-ultra text-muted-foreground/60">
                                            Showing {products.length} of {meta?.totalItems} treasures.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </Container>
                </Section>
            </div>
        </Layout>
    );
};
