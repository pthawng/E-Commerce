import * as React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDisplayError } from "@/lib/back-office-api";

type AsyncStateProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  className?: string;
  loadingRows?: number;
};

export function AsyncState({
  children,
  isLoading = false,
  isEmpty = false,
  error,
  onRetry,
  loadingLabel = "Loading data...",
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting filters or create a new record.",
  errorTitle = "Unable to load data",
  className,
  loadingRows = 5,
}: AsyncStateProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3 p-5", className)} aria-busy="true">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
          {loadingLabel}
        </div>
        {Array.from({ length: loadingRows }).map((_, index) => (
          <Skeleton key={index} className="h-12 rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    const displayError = getDisplayError(error);

    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>
          <div>{displayError.message}</div>
          {displayError.errorClass || displayError.correlationId ? (
            <div className="mt-2 text-[11px] text-destructive/80">
              {displayError.errorClass ? `Class: ${displayError.errorClass}` : null}
              {displayError.errorClass && displayError.correlationId ? " · " : null}
              {displayError.correlationId ? `Correlation: ${displayError.correlationId}` : null}
            </div>
          ) : null}
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              <RefreshCw />
              Retry
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center",
          className,
        )}
      >
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{emptyTitle}</div>
          <div className="mt-1 text-[12px] text-muted-foreground">{emptyDescription}</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
