import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const ProductCardSkeleton = () => {
    return (
        <Card className="group flex flex-col h-full overflow-hidden border-none bg-background shadow-luxury-soft">
            <CardHeader className="p-0 relative aspect-[4/5] overflow-hidden bg-secondary/10">
                <Skeleton className="w-full h-full" />
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
