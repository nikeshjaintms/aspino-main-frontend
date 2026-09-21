"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccounts } from "@/redux/slices/accountsSlice";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark,
  Eye,
  Building2,
  Search,
  Download,
  RefreshCw,
  Wallet,
  Scale,
  Coins,
  TrendingUp,
  TrendingDown,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_CONFIG = {
  ASSET: {
    label: "Asset",
    color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    badgeGradient: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    icon: Wallet,
  },
  LIABILITY: {
    label: "Liability",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    badgeGradient: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Scale,
  },
  EQUITY: {
    label: "Equity",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    badgeGradient: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Coins,
  },
  REVENUE: {
    label: "Revenue",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    badgeGradient: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: TrendingUp,
  },
  EXPENSE: {
    label: "Expense",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    badgeGradient: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: TrendingDown,
  },
};

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
};

export default function UserAccountsPage() {
  const dispatch = useDispatch();
  const { accounts = [], loading } = useSelector((state) => state.accounts || {});

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (typeFilter !== "ALL" && acc.accountType !== typeFilter) return false;
      if (statusFilter === "ACTIVE" && !acc.isActive) return false;
      if (statusFilter === "INACTIVE" && acc.isActive) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (acc.accountCode || "").toLowerCase();
        const name = (acc.accountName || "").toLowerCase();
        const group = (acc.accountGroup || "").toLowerCase();
        const sub = (acc.subGroup || "").toLowerCase();
        return code.includes(q) || name.includes(q) || group.includes(q) || sub.includes(q);
      }

      return true;
    });
  }, [accounts, typeFilter, statusFilter, search]);

  const handleOpenView = (acc) => {
    setSelectedAccount(acc);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredAccounts.length === 0) {
      toast.error("No account records to export.");
      return;
    }

    const headers = [
      "Account Code",
      "Account Name",
      "Type",
      "Group",
      "Sub Group",
      "Currency",
      "Current Balance",
      "Normal Balance",
      "Status",
    ];

    const rows = filteredAccounts.map((a) => [
      `"${a.accountCode}"`,
      `"${a.accountName}"`,
      `"${a.accountType}"`,
      `"${a.accountGroup || ""}"`,
      `"${a.subGroup || ""}"`,
      `"${a.currency || "INR"}"`,
      a.currentBalance || 0,
      `"${a.normalBalance || "DEBIT"}"`,
      a.isActive ? "Active" : "Inactive",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aspino_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Accounts exported to CSV.");
  };

  const columns = [
    {
      accessorKey: "accountCode",
      header: "Code & Account",
      cell: ({ row }) => {
        const acc = row.original;
        const typeConf = TYPE_CONFIG[acc.accountType] || TYPE_CONFIG.ASSET;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border shrink-0 ${typeConf.color}`}>
              <typeConf.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => handleOpenView(acc)}
                  className="font-mono font-bold text-xs text-aspino-primary cursor-pointer hover:underline"
                >
                  {acc.accountCode}
                </span>
                {acc.isBankAccount && (
                  <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-blue-50/50 text-blue-700">
                    <Building2 className="h-2.5 w-2.5 mr-1" />
                    Bank
                  </Badge>
                )}
              </div>
              <p
                onClick={() => handleOpenView(acc)}
                className="font-bold text-sm hover:text-aspino-primary cursor-pointer transition-colors"
              >
                {acc.accountName}
              </p>
              <p className="text-xs text-muted-foreground">{acc.subGroup || acc.accountGroup}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "accountType",
      header: "Group & Type",
      cell: ({ row }) => {
        const acc = row.original;
        const typeConf = TYPE_CONFIG[acc.accountType] || TYPE_CONFIG.ASSET;
        return (
          <div className="space-y-1">
            <Badge variant="outline" className={`font-bold text-xs px-2.5 py-0.5 border ${typeConf.color}`}>
              {typeConf.label}
            </Badge>
            <p className="text-xs text-muted-foreground">{acc.accountGroup}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "normalBalance",
      header: "Normal Bal.",
      cell: ({ row }) => {
        const isDr = row.original.normalBalance === "DEBIT";
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-mono font-bold ${
              isDr
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-purple-50 text-purple-700 border-purple-200"
            }`}
          >
            {isDr ? "Dr (Debit)" : "Cr (Credit)"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "currentBalance",
      header: "Current Balance",
      cell: ({ row }) => {
        const bal = row.original.currentBalance ?? row.original.openingBalance ?? 0;
        return (
          <span className="font-mono font-bold text-sm text-foreground">
            {formatCurrency(bal)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "View",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-aspino-primary rounded-xl"
          onClick={() => handleOpenView(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts Directory"
        subtitle="Departmental reference directory of General Ledger accounts and bank heads."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl gap-1.5 text-xs h-9 font-bold"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(fetchAccounts());
              toast.success("Accounts refreshed.");
            }}
            className="rounded-xl gap-1.5 text-xs h-9 font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <Card className="rounded-3xl border shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-5 pb-4 border-b space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Landmark className="h-5 w-5 text-aspino-primary" />
                Ledger Accounts List
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Showing {filteredAccounts.length} active General Ledger accounts.
              </CardDescription>
            </div>

            <Tabs
              value={typeFilter}
              onValueChange={setTypeFilter}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-10 p-1 rounded-2xl bg-muted/80">
                <TabsTrigger value="ALL" className="text-xs font-bold rounded-xl px-3">All</TabsTrigger>
                <TabsTrigger value="ASSET" className="text-xs font-bold rounded-xl px-3">Assets</TabsTrigger>
                <TabsTrigger value="LIABILITY" className="text-xs font-bold rounded-xl px-3">Liabilities</TabsTrigger>
                <TabsTrigger value="EQUITY" className="text-xs font-bold rounded-xl px-3">Equity</TabsTrigger>
                <TabsTrigger value="REVENUE" className="text-xs font-bold rounded-xl px-3">Revenue</TabsTrigger>
                <TabsTrigger value="EXPENSE" className="text-xs font-bold rounded-xl px-3">Expenses</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search account code, name or group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-muted/50 border-border"
              />
            </div>
            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/50 border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Accounts</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs">Active Only</SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredAccounts}
            loading={loading}
            emptyMessage="No accounts found."
          />
        </CardContent>
      </Card>

      {/* ─── VIEW ACCOUNT OVERVIEW MODAL ────────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl xl:max-w-5xl w-[96vw] max-h-[92vh] p-0 gap-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {selectedAccount && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Header Gradient Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
                <div className="absolute right-8 top-3 opacity-10">
                  <Landmark className="h-28 w-28" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner shrink-0">
                      <Landmark className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {selectedAccount.accountName}
                        </h3>
                        <span className="font-mono text-xs font-bold text-sky-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-lg">
                          {selectedAccount.accountCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Group:{" "}
                        <span className="font-semibold text-slate-100">
                          {selectedAccount.accountGroup}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                        TYPE_CONFIG[selectedAccount.accountType]?.badgeGradient || "bg-sky-500/20 text-sky-300"
                      }`}
                    >
                      {selectedAccount.accountType}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Content Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Scale className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Financial Balance
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Current Balance</span>
                        <span className="font-mono font-black text-lg text-foreground mt-0.5 block">
                          {formatCurrency(selectedAccount.currentBalance ?? selectedAccount.openingBalance ?? 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Normal Balance</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedAccount.normalBalance || "DEBIT"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Banking Details
                      </h4>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      <span className="text-xs text-muted-foreground font-medium">Bank Status:</span>
                      <p className="font-bold text-foreground">
                        {selectedAccount.isBankAccount
                          ? `${selectedAccount.bankName || "Linked"} (${selectedAccount.accountNumber || "—"})`
                          : "Non-Banking General Ledger"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedAccount.description && (
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-1.5 shadow-sm text-xs">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">
                      Description & Notes
                    </span>
                    <p className="p-3 rounded-xl border bg-card text-foreground leading-relaxed">
                      {selectedAccount.description}
                    </p>
                  </div>
                )}
              </div>

              {/* View Dialog Footer */}
              <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end w-full">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="h-10 text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
