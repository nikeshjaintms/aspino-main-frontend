"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  PackageOpen,
} from "lucide-react";

export function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  loading = false,
  emptyMessage = "No data found",
  emptyDescription = "There are no records to display.",
  onRowClick,
  actions,
  // Server-side pagination & search props
  isServerSide = false,
  totalCount = 0,
  totalPages = 1,
  currentPage = 1,
  searchQuery = "",
  onPageChange,
  onLimitChange,
  onSearchQueryChange,
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [localRowsPerPage, setLocalRowsPerPage] = useState(pageSize);

  const activeSearchQuery = isServerSide ? searchQuery : localSearchQuery;
  const activeCurrentPage = isServerSide ? currentPage : localCurrentPage;
  const activeRowsPerPage = isServerSide ? pageSize : localRowsPerPage;

  const filteredData = useMemo(() => {
    if (isServerSide) return data;
    if (!activeSearchQuery) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.accessorKey];
        if (value == null) return false;
        return String(value).toLowerCase().includes(activeSearchQuery.toLowerCase());
      })
    );
  }, [data, activeSearchQuery, columns, isServerSide]);

  const sortedData = useMemo(() => {
    if (isServerSide) return data;
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, isServerSide, data]);

  const activeTotalPages = isServerSide ? totalPages : Math.ceil(sortedData.length / activeRowsPerPage);

  const paginatedData = useMemo(() => {
    if (isServerSide) return data;
    return sortedData.slice(
      (activeCurrentPage - 1) * activeRowsPerPage,
      activeCurrentPage * activeRowsPerPage
    );
  }, [sortedData, activeCurrentPage, activeRowsPerPage, isServerSide, data]);

  const handleSort = (key) => {
    if (isServerSide) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="h-3.5 w-3.5 text-aspino-primary" />;
    return <ArrowDown className="h-3.5 w-3.5 text-aspino-primary" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
                {columns.map((_, j) => (
                  <Skeleton key={j} className="h-5 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {searchable && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={activeSearchQuery}
              onChange={(e) => {
                if (isServerSide) {
                  onSearchQueryChange?.(e.target.value);
                } else {
                  setLocalSearchQuery(e.target.value);
                  setLocalCurrentPage(1);
                }
              }}
              className="pl-10 h-10 bg-background border-border/60 focus:border-aspino-primary/50 transition-colors"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {actions}
          <Badge variant="secondary" className="font-normal text-xs">
            {isServerSide ? totalCount : sortedData.length} record{(isServerSide ? totalCount : sortedData.length) !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={col.accessorKey || col.id}
                  className={`font-semibold text-xs uppercase tracking-wider text-muted-foreground ${
                    col.sortable !== false && !isServerSide ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""
                  }`}
                  onClick={() => col.sortable !== false && !isServerSide && handleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable !== false && !isServerSide && col.accessorKey && getSortIcon(col.accessorKey)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="rounded-full bg-muted p-4">
                      <PackageOpen className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{emptyMessage}</p>
                      <p className="text-sm text-muted-foreground/70">{emptyDescription}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, i) => (
                <TableRow
                  key={row.id || i}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-accent/50" : "hover:bg-muted/30"
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.accessorKey || col.id} className="py-3.5">
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {activeTotalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(activeRowsPerPage)}
              onValueChange={(val) => {
                if (isServerSide) {
                  onLimitChange?.(Number(val));
                } else {
                  setLocalRowsPerPage(Number(val));
                  setLocalCurrentPage(1);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {activeCurrentPage} of {activeTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (isServerSide) {
                    onPageChange?.(1);
                  } else {
                    setLocalCurrentPage(1);
                  }
                }}
                disabled={activeCurrentPage <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (isServerSide) {
                    onPageChange?.(activeCurrentPage - 1);
                  } else {
                    setLocalCurrentPage((p) => Math.max(1, p - 1));
                  }
                }}
                disabled={activeCurrentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (isServerSide) {
                    onPageChange?.(activeCurrentPage + 1);
                  } else {
                    setLocalCurrentPage((p) => Math.min(activeTotalPages, p + 1));
                  }
                }}
                disabled={activeCurrentPage >= activeTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (isServerSide) {
                    onPageChange?.(activeTotalPages);
                  } else {
                    setLocalCurrentPage(activeTotalPages);
                  }
                }}
                disabled={activeCurrentPage >= activeTotalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
