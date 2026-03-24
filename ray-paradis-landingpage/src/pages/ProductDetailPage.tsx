import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/ProductCard";
import { 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  ArrowLeft
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useProduct, useProducts } from "@/features/products/hooks/useProducts";
import { useCartStore } from '@/features/cart/store/useCartStore';
import { useStore } from "@/store/useStore";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalized, mapProductToCardProps } from "@/features/products/utils/productMapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocalizedString, AttributeValue } from "@/features/products/types";

export const ProductDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const { language, t } = useTranslation();
    const { formatPrice } = useStore();
    const { addItem } = useCartStore();

    const [activeAccordion, setActiveAccordion] = useState<string | null>("craftsmanship");

    // Fetch Main Product
    const { data: product, isLoading, isError, refetch } = useProduct(slug || "");

    // Fetch Recommendations (Same Category)
    const categoryId = product?.categories?.[0]?.category?.id;
    const { data: recommendationsRes } = useProducts({
        categoryId,
        limit: 4,
    });

    const recommendations = useMemo(() => {
        return (recommendationsRes?.data || [])
            .filter(p => p.id !== product?.id)
            .slice(0, 4)
            .map(p => mapProductToCardProps(p, language, formatPrice));
    }, [recommendationsRes?.data, product?.id, language, formatPrice]);

    // --- Senior Variant Selection Logic ---

    // 1. Extract all available attributes across variants
    const availableAttributes = useMemo(() => {
        if (!product?.variants) return [];

        const attrMap = new Map<string, { id: string; code: string; name: LocalizedString; values: Map<string, AttributeValue> }>();

        product.variants.forEach(variant => {
            variant.attributes.forEach(va => {
                const val = va.attributeValue;
                const attr = val.attribute;

                if (!attrMap.has(attr.code)) {
                    attrMap.set(attr.code, {
                        id: attr.id,
                        code: attr.code,
                        name: attr.name,
                        values: new Map()
                    });
                }

                const currentAttr = attrMap.get(attr.code)!;
                if (!currentAttr.values.has(val.id)) {
                    currentAttr.values.set(val.id, val);
                }
            });
        });

        return Array.from(attrMap.values()).map(attr => ({
            ...attr,
            values: Array.from(attr.values.values())
        }));
    }, [product]);

    // 2. Selection State: attributeCode -> valueId
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

    // 3. Initialize selection from default variant
    useEffect(() => {
        if (product?.variants?.length && Object.keys(selectedAttributes).length === 0) {
            const defaultVar = product.variants.find(v => v.isDefault) || product.variants[0];
            const initialSelections: Record<string, string> = {};
            defaultVar.attributes.forEach(va => {
                initialSelections[va.attributeValue.attribute.code] = va.attributeValue.id;
            });
            setSelectedAttributes(initialSelections);
        }
    }, [product, selectedAttributes]);

    // 4. Resolve current variant based on selections
    const selectedVariant = useMemo(() => {
        if (!product?.variants) return null;

        // Attempt to find a variant that matches ALL selected attributes
        const match = product.variants.find(variant => {
            return Object.entries(selectedAttributes).every(([attrCode, valId]) => {
                return variant.attributes.some(va => 
                    va.attributeValue.attribute.code === attrCode && va.attributeValue.id === valId
                );
            });
        });

        return match || product.variants.find(v => v.isDefault) || product.variants[0];
    }, [product, selectedAttributes]);

    // handleAddToCart Action
    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;

        const cartItem = {
            id: `${product.id}-${selectedVariant.id}`,
            productId: product.id,
            variantId: selectedVariant.id,
            name: product.name,
            price: selectedVariant.price,
            quantity: 1,
            image: selectedVariant.media?.[0]?.url || product.media?.[0]?.url || '',
            slug: product.slug,
            attributes: selectedVariant.attributes.map(va => ({
                name: getLocalized(va.attributeValue.attribute.name, language),
                value: getLocalized(va.attributeValue.value, language)
            })),
            stock: selectedVariant.stock
        };

        addItem(cartItem);
    };

    // --- SEO & Metadata ---
    useEffect(() => {
        if (product) {
            const name = getLocalized(product.name, language);
            document.title = `${name} | Ray Paradis Heritage`;

            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            const desc = getLocalized(product.description, language)?.replace(/<[^>]*>/g, '').slice(0, 160);
            metaDesc.setAttribute('content', desc || `Discover ${name} by Ray Paradis.`);
        }
    }, [product, language]);

    if (isLoading) {
        return (
            <Layout forceHeaderOpaque={true}>
                <div className="pt-32 pb-20">
                    <Container>
                        <div className="flex flex-col lg:flex-row gap-16">
                            <div className="w-full lg:w-[60%] space-y-8">
                                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                            </div>
                            <div className="w-full lg:w-[40%] space-y-12">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-8 w-40" />
                                </div>
                                <Skeleton className="h-32 w-full" />
                                <div className="space-y-4">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            </div>
                        </div>
                    </Container>
                </div>
            </Layout>
        );
    }

    if (isError || !product) {
        return (
            <Layout forceHeaderOpaque={true}>
                <div className="pt-40 pb-40 text-center">
                    <Container>
                        <Alert className="max-w-md mx-auto border-destructive/20 bg-destructive/5 py-12 shadow-luxury">
                            <ShoppingBag className="w-12 h-12 text-destructive/20 mx-auto mb-6" />
                            <AlertTitle className="text-destructive font-display text-2xl mb-4 italic">Lost Treasure</AlertTitle>
                            <AlertDescription className="text-destructive/80 font-body text-sm mb-8">
                                We couldn't find the specific masterpiece you're looking for. It may have been curated away.
                            </AlertDescription>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button variant="outline" onClick={() => refetch()} className="border-destructive/20">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                                </Button>
                                <Link to="/collections">
                                    <Button variant="luxury">Discover Collection</Button>
                                </Link>
                            </div>
                        </Alert>
                    </Container>
                </div>
            </Layout>
        );
    }

    const images = product.media?.length 
        ? product.media.map(m => m.url) 
        : [selectedVariant?.media?.[0]?.url || ''];

    const priceFormatted = formatPrice(
        selectedVariant?.price || product.displayPriceMin || 0
    );

    return (
        <Layout forceHeaderOpaque={true}>
            <div className="pt-24 sm:pt-28">
                <Section padding="none">
                    <Container>
                        {/* Breadcrumb / Back */}
                        <div className="mb-8">
                            <Link to="/collections" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors group">
                                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                                Back to Collection
                            </Link>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start min-h-[calc(100vh-120px)]">
                            {/* Left: Immersive Gallery */}
                            <div className="w-full lg:w-[60%] space-y-8">
                                {images.map((img, i) => (
                                    <motion.div
                                        key={i}
                                        className="aspect-[4/5] overflow-hidden rounded-xl bg-secondary/10 shadow-luxury-soft"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1 }}
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${getLocalized(product.name, language)} view ${i + 1}`} 
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2000ms] cursor-zoom-in"
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right: Sticky Info Panel */}
                            <div className="w-full lg:w-[40%] lg:sticky lg:top-32 space-y-12 pb-20">
                                <header className="space-y-4">
                                    <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground">
                                        High Jewelry / {getLocalized(product.categories?.[0]?.category?.name, language) || 'Necklaces'}
                                    </p>
                                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary italic font-normal tracking-luxury leading-tight">
                                        {getLocalized(product.name, language)}
                                    </h1>
                                    <AnimatePresence mode="wait">
                                        <motion.p 
                                            key={selectedVariant?.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="font-body text-2xl text-primary font-light"
                                        >
                                            {priceFormatted}
                                        </motion.p>
                                    </AnimatePresence>
                                </header>

                                <div className="space-y-10">
                                    <div className="font-body text-base text-muted-foreground leading-relaxed max-w-sm"
                                        dangerouslySetInnerHTML={{ __html: getLocalized(product.description, language) || '' }}
                                    />

                                    {/* --- Advanced Attribute Selectors --- */}
                                    {availableAttributes.length > 0 && (
                                        <div className="space-y-8">
                                            {availableAttributes.map((attr) => (
                                                <div key={attr.id} className="space-y-4">
                                                    <label className="font-body text-[10px] uppercase tracking-widest text-primary/60 block">
                                                        {getLocalized(attr.name, language)}
                                                    </label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {attr.values.map((val) => {
                                                            const isSelected = selectedAttributes[attr.code] === val.id;
                                                            return (
                                                                <button
                                                                    key={val.id}
                                                                    onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.code]: val.id }))}
                                                                    className={cn(
                                                                        "px-5 h-12 rounded-xl border text-[10px] uppercase tracking-widest transition-all duration-500",
                                                                        isSelected
                                                                            ? "border-gold bg-gold/5 text-primary shadow-luxury-soft ring-1 ring-gold/20"
                                                                            : "border-border/10 text-muted-foreground hover:border-border/40 hover:bg-secondary/20"
                                                                    )}
                                                                >
                                                                    {val.metaValue && (
                                                                        <span 
                                                                            className="inline-block w-2 h-2 rounded-full mr-2 mb-0.5" 
                                                                            style={{ backgroundColor: val.metaValue }}
                                                                        />
                                                                    )}
                                                                    {getLocalized(val.value, language)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add to Cart */}
                                    <div className="space-y-4 pt-4">
                                        <Button 
                                            variant="luxury" 
                                            className="w-full h-14 group"
                                            onClick={handleAddToCart}
                                        >
                                            <span className="mr-2">{t.pdp.addToCollection}</span>
                                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                        <p className="text-center font-body text-[10px] text-muted-foreground tracking-wide">
                                            GIA Certified / Handcrafted in Atelier / SKU: {selectedVariant?.sku}
                                        </p>
                                    </div>

                                    {/* Info Tabs / Accordion */}
                                    <div className="space-y-1 border-t border-border/10 pt-8">
                                        {[
                                            { 
                                                id: "craftsmanship", 
                                                label: t.pdp.craftsmanship, 
                                                content: "Each masterpiece is meticulously hand-assembled by our master artisans, requiring over 40 hours of focused dedication to perfect every facet and link.", 
                                                icon: ShieldCheck 
                                            },
                                            { 
                                                id: "shipping", 
                                                label: t.pdp.delivery, 
                                                content: "Complimentary worldwide white-glove delivery. Insured and handled with the utmost care. Returns accepted within 14 days in original condition.", 
                                                icon: Truck 
                                            },
                                            { 
                                                id: "care", 
                                                label: t.pdp.careGuide, 
                                                content: "Clean gently with a soft cloth. We offer professional polishing and inspection services at our boutique to maintain the eternal radiance of your jewel.", 
                                                icon: RotateCcw 
                                            },
                                        ].map((tab) => (
                                            <div key={tab.id} className="border-b border-border/10 overflow-hidden">
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === tab.id ? null : tab.id)}
                                                    className="w-full flex items-center justify-between py-5 text-left group"
                                                >
                                                    <span className="font-body text-xs uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors">
                                                        {tab.label}
                                                    </span>
                                                    <Plus className={cn("w-4 h-4 text-primary/40 transition-transform duration-500", activeAccordion === tab.id && "rotate-45")} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeAccordion === tab.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                        >
                                                            <p className="pb-8 font-body text-sm text-muted-foreground leading-relaxed">
                                                                {tab.content}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                </Section>

                {/* Recommendation Section */}
                {recommendations.length > 0 && (
                    <Section padding="lg" withHairline="top" className="bg-secondary/5">
                        <Container>
                            <div className="flex items-end justify-between mb-16">
                                <div className="space-y-4">
                                    <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground">
                                        Digital Atelier
                                    </p>
                                    <h2 className="font-display text-3xl sm:text-4xl italic font-normal tracking-luxury text-primary">
                                        {t.pdp.completeLook}
                                    </h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {recommendations.map((p) => (
                                    <ProductCard key={p.id} {...p} />
                                ))}
                            </div>
                        </Container>
                    </Section>
                )}
            </div>
        </Layout>
    );
};
