import * as React from "react";
import { Button } from "@/components/ui/button";
import { getDisplayError } from "@/lib/back-office-api";

type FormShellProps = {
  title?: string;
  description?: string;
  submitLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  error?: unknown;
  onCancel?: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
};

export function FormShell({
  title,
  description,
  submitLabel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  error,
  onCancel,
  onSubmit,
  children,
}: FormShellProps) {
  const displayError = error ? getDisplayError(error) : null;

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {title || description ? (
        <div>
          {title ? <h3 className="text-[14px] font-medium">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
      {displayError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
          <div>{displayError.message}</div>
          {displayError.correlationId ? (
            <div className="mt-1 text-[11px] text-destructive/80">
              Correlation: {displayError.correlationId}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
