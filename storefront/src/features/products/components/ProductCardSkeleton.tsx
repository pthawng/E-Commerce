import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * L7/L8 Standard Skeleton
 * Uses a GPU-accelerated shimmer effect for smooth loading.
 */
export const ProductCardSkeleton = ({ className }: { className?: string }) => {
    return (
        <Card className={cn("group flex flex-col h-full overflow-hidden border-none bg-background shadow-luxury-soft animate-pulse", className)}>
            <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden bg-secondary/5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-shimmer" />
                <Skeleton className="w-full h-full opacity-50" />
            </CardHeader>

            <CardContent className="flex flex-col flex-grow p-6 text-center">
                <div className="flex justify-center mb-4">
                    <Skeleton className="h-3 w-20" />
                </div>
                <div className="min-h-[4rem] flex flex-col items-center justify-center mb-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <div className="mt-auto flex justify-center">
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 justify-center h-14">
                <div className="flex gap-6">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardFooter>
        </Card>
    );
};
