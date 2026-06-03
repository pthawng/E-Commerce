import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getDisplayError } from "@/lib/back-office-api";

type ActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  requireReason?: boolean;
  isPending?: boolean;
  error?: unknown;
  onConfirm: (reason?: string) => void;
};

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Add an audit reason...",
  requireReason = false,
  isPending = false,
  error,
  onConfirm,
}: ActionDialogProps) {
  const [reason, setReason] = React.useState("");
  const displayError = error ? getDisplayError(error) : null;
  const reasonMissing = requireReason && !reason.trim();

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive ? <AlertTriangle className="h-4 w-4 text-destructive" /> : null}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason ? (
          <label className="flex flex-col gap-1 text-[12px]">
            {reasonLabel}
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
            />
          </label>
        ) : null}
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={isPending || reasonMissing}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
