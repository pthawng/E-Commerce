import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AsyncState } from "./AsyncState";

export type ResourceTableColumn<T> = {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
};

type ResourceTablePagination = {
  page: number;
  totalPages: number;
  total?: number;
  count?: number;
  onPageChange: (page: number) => void;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
};

type ResourceTableProps<T> = {
  rows: T[];
  columns: ResourceTableColumn<T>[];
  getRowKey: (row: T, index: number) => React.Key;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingLabel?: string;
  loadingRows?: number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  pagination?: ResourceTablePagination;
  className?: string;
};

function readCellValue<T>(row: T, key: keyof T | string) {
  if (typeof row !== "object" || row === null) return undefined;
  return (row as Record<string, React.ReactNode>)[String(key)];
}

export function ResourceTable<T>({
  rows,
  columns,
  getRowKey,
  isLoading = false,
  error,
  onRetry,
  isEmpty = rows.length === 0,
  emptyTitle,
  emptyDescription,
  loadingLabel,
  loadingRows,
  onRowClick,
  rowClassName,
  pagination,
  className,
}: ResourceTableProps<T>) {
  return (
    <>
      <AsyncState
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty={isEmpty}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        loadingLabel={loadingLabel}
        loadingRows={loadingRows}
      >
        <Table className={cn("text-[12.5px]", className)}>
          <TableHeader>
            <TableRow className="text-left text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn("px-5 py-3 font-medium", column.headerClassName)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={getRowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-border/60 hover:bg-accent/40",
                  onRowClick && "cursor-pointer",
                  rowClassName?.(row),
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className={cn("px-5 py-3 align-middle", column.className)}
                  >
                    {column.render ? column.render(row) : readCellValue(row, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AsyncState>
      {pagination ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11.5px] text-muted-foreground">
          <div>
            {pagination.label ??
              `Showing ${pagination.count ?? rows.length}${
                typeof pagination.total === "number" ? ` / ${pagination.total}` : ""
              } records`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              {pagination.previousLabel ?? "Previous"}
            </Button>
            <span className="tabular">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              {pagination.nextLabel ?? "Next"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
