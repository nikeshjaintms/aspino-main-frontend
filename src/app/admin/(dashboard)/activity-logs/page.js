"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { customToast } from "@/components/custom-toast";
import {
  Activity,
  Search,
  Eye,
  Loader2,
  Calendar,
  User,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Code2,
} from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filtering & Pagination State
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Load logs from backend
  async function fetchLogs() {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getCookie("adminToken") || getCookie("userToken");

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search) queryParams.append("search", search);
      if (sortBy) queryParams.append("sortBy", sortBy);
      if (sortOrder) queryParams.append("sortOrder", sortOrder);
      if (userEmail.trim()) queryParams.append("userEmail", userEmail.trim());
      if (userRole.trim()) queryParams.append("userRole", userRole.trim());
      if (action.trim()) queryParams.append("action", action.trim());
      if (entityType.trim()) queryParams.append("entityType", entityType.trim());
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/audit/logs?${queryParams.toString()}`, {
        headers,
      });

      if (res.ok) {
        const body = await res.json();
        setLogs(body.data || []);
        setMeta({
          total: body.pagination?.total ?? body.meta?.total ?? 0,
          totalPages: body.pagination?.totalPages ?? body.meta?.totalPages ?? 1,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        customToast.error(errData.message || "Failed to load activity logs");
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
      customToast.error("An unexpected error occurred while loading logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, sortBy, sortOrder, userEmail, userRole, action, entityType, startDate, endDate]);

  // Reset filters
  const handleReset = () => {
    setUserEmail("");
    setUserRole("");
    setAction("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
    setTimeout(() => {
      fetchLogs();
    }, 50);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Styling helpers
  const getActionBadgeColor = (actionName) => {
    const act = String(actionName).toUpperCase();
    if (act.startsWith("CREATE")) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400";
    if (act.startsWith("UPDATE")) return "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400";
    if (act.startsWith("DELETE")) return "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400";
    if (act === "LOGIN") return "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400";
    return "bg-slate-500/10 text-slate-600 border-slate-500/25 dark:text-slate-400";
  };

  const getMethodBadgeColor = (method) => {
    const m = String(method).toUpperCase();
    switch (m) {
      case "POST":
        return "bg-emerald-500 text-white";
      case "PUT":
      case "PATCH":
        return "bg-blue-500 text-white";
      case "DELETE":
        return "bg-rose-500 text-white";
      case "GET":
        return "bg-slate-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const getStatusBadgeColor = (code) => {
    const status = Number(code);
    if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    if (status >= 400) return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
  };

  const formatJSON = (json) => {
    if (!json) return "{}";
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  // Columns definition for DataTable
  const columns = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {d.toLocaleDateString()}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {d.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "userEmail",
      header: "Actor",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            {row.userName || "System / Guest"}
          </span>
          {row.userEmail && (
            <span className="text-xs text-muted-foreground font-medium">{row.userEmail}</span>
          )}
          {row.userRole && (
            <span className="text-[10px] uppercase font-extrabold text-aspino-primary tracking-wider mt-0.5">
              {row.userRole}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`font-bold tracking-wider text-[10.5px] px-2 py-0.5 rounded-md ${getActionBadgeColor(row.action)}`}>
            {row.action}
          </Badge>
          {row.entityType && (
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded border">
              {row.entityType}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "method",
      header: "Request",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded ${getMethodBadgeColor(row.method)}`}>
            {row.method}
          </Badge>
          <span className="text-xs font-mono font-medium max-w-[200px] truncate text-muted-foreground" title={row.url}>
            {row.url}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "statusCode",
      header: "Status",
      cell: (row) => (
        <Badge variant="outline" className={`font-bold text-xs rounded-full px-2.5 ${getStatusBadgeColor(row.statusCode)}`}>
          {row.statusCode}
        </Badge>
      ),
    },
    {
      accessorKey: "ip",
      header: "Origin",
      cell: (row) => (
        <div className="flex flex-col text-[11.5px] text-muted-foreground">
          <span className="font-mono">{row.ip || "127.0.0.1"}</span>
          <span className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]" title={row.userAgent}>
            {row.userAgent || "Unknown Client"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: "Details",
      sortable: false,
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg font-bold border-border hover:bg-aspino-primary/10 hover:text-aspino-primary flex items-center gap-1 cursor-pointer"
          onClick={() => setSelectedLog(row)}
        >
          <Eye className="w-3.5 h-3.5" />
          Payload
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <PageHeader
          icon={Activity}
          title="Audit Trail & Activity Logs"
          subtitle="Monitor user actions, system modifications, and security events across Aspino GatePass"
        />
        <Button
          variant="outline"
          className="rounded-xl font-bold flex items-center gap-1.5 h-9 cursor-pointer"
          onClick={fetchLogs}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {/* Advanced Filter Panel */}
      <form onSubmit={handleSearch} className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-aspino-primary" />
            <h3 className="text-sm font-extrabold text-foreground">Filter Activities</h3>
          </div>
          <Badge variant="secondary" className="font-extrabold text-[10.5px] uppercase tracking-wider text-aspino-primary">
            {userRole ? `Role: ${userRole}` : "All Activity Logs"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label htmlFor="filter-role" className="text-xs font-bold text-muted-foreground">
              User Role
            </Label>
            <Input
              id="filter-role"
              placeholder="ADMIN"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="h-9 text-xs rounded-xl font-bold text-aspino-primary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-email" className="text-xs font-bold text-muted-foreground">
              User Email
            </Label>
            <Input
              id="filter-email"
              placeholder="e.g. admin@aspino.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-action" className="text-xs font-bold text-muted-foreground">
              Action Name
            </Label>
            <Input
              id="filter-action"
              placeholder="e.g. CREATE_GATE_PASS"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-entity" className="text-xs font-bold text-muted-foreground">
              Entity Type
            </Label>
            <Input
              id="filter-entity"
              placeholder="e.g. GatePass"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-start" className="text-xs font-bold text-muted-foreground">
              Start Date
            </Label>
            <Input
              id="filter-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-end" className="text-xs font-bold text-muted-foreground">
              End Date
            </Label>
            <Input
              id="filter-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="rounded-xl font-bold h-9 text-xs cursor-pointer"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-aspino-primary hover:bg-aspino-primary/90 text-white font-bold rounded-xl h-9 text-xs px-4 cursor-pointer"
          >
            Apply Filters
          </Button>
        </div>
      </form>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        isServerSide
        totalCount={meta.total}
        totalPages={meta.totalPages}
        currentPage={page}
        pageSize={limit}
        searchQuery={search}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearchQueryChange={(s) => { setSearch(s); setPage(1); }}
        searchPlaceholder="Search audit trail by actor, action, path or IP..."
        emptyMessage="No activity logs found"
        emptyDescription="Try adjusting your search criteria or clear date filters."
      />

      {/* Payload Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl bg-card overflow-hidden border shadow-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-aspino-primary" />
              Activity Details & Payloads
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Audit context, HTTP route parameters, and sanitized JSON request/response bodies.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 min-h-0 mt-4 pr-3">
              <div className="space-y-4 text-xs pb-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-2xl border">
                  <div>
                    <span className="text-muted-foreground font-medium block">Timestamp</span>
                    <span className="font-extrabold text-foreground">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Log ID</span>
                    <span className="font-mono text-[10px] text-muted-foreground select-all">
                      {selectedLog.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Actor Name / Email</span>
                    <span className="font-extrabold text-foreground">
                      {selectedLog.userName || "System"} {selectedLog.userEmail ? `(${selectedLog.userEmail})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Role</span>
                    <span className="font-extrabold text-aspino-primary uppercase tracking-wide">
                      {selectedLog.userRole || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">HTTP Method & Path</span>
                    <span className="font-mono text-foreground">
                      [{selectedLog.method}] {selectedLog.url}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium block">Status Code</span>
                    <span className={`font-extrabold ${selectedLog.statusCode >= 400 ? "text-rose-500" : "text-emerald-500"}`}>
                      {selectedLog.statusCode}
                    </span>
                  </div>
                </div>

                {/* Payloads */}
                <div className="space-y-3">
                  {selectedLog.routeParams && Object.keys(selectedLog.routeParams).length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-foreground block">Route Parameters</span>
                      <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                        {formatJSON(selectedLog.routeParams)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.queryParams && Object.keys(selectedLog.queryParams).length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-foreground block">Query Parameters</span>
                      <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                        {formatJSON(selectedLog.queryParams)}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-bold text-foreground block">Request Payload (Sanitized)</span>
                    <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {formatJSON(selectedLog.requestBody)}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-foreground block">Response Output (Sanitized)</span>
                    <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {formatJSON(selectedLog.responseBody)}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="shrink-0 border-t pt-4 mt-2">
            <Button onClick={() => setSelectedLog(null)} className="bg-aspino-primary hover:bg-aspino-primary/90 text-white font-bold rounded-xl h-9 text-xs cursor-pointer">
              Close Detail Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
