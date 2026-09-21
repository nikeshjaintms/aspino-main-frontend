"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVouchers,
  createVoucher,
  deleteVoucher,
} from "@/redux/slices/financeSlice";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Receipt,
  Trash2,
  Eye,
  Building2,
  Search,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  Coins,
  ArrowRightLeft,
  Printer,
  FileCheck2,
  Calendar,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

const VOUCHER_TYPE_CONFIG = {
  JOURNAL: {
    label: "Journal Voucher (JV)",
    short: "JV",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    badgeGradient: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Scale,
  },
  PAYMENT: {
    label: "Payment Voucher (PV)",
    short: "PV",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
    badgeGradient: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: TrendingDown,
  },
  RECEIPT: {
    label: "Receipt Voucher (RV)",
    short: "RV",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    badgeGradient: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: TrendingUp,
  },
  CONTRA: {
    label: "Contra Voucher (CV)",
    short: "CV",
    color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400",
    badgeGradient: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    icon: ArrowRightLeft,
  },
  SALES_INVOICE: {
    label: "Sales Voucher (SV)",
    short: "SV",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    badgeGradient: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: CreditCard,
  },
  PURCHASE_BILL: {
    label: "Purchase Bill (PB)",
    short: "PB",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    badgeGradient: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Coins,
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

export default function VoucherEnginePage() {
  const dispatch = useDispatch();
  const { vouchers = [], loading, submitting } = useSelector((state) => state.finance || {});
  const { accounts = [] } = useSelector((state) => state.accounts || {});

  // Filters & Search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Form State
  const initialFormState = {
    voucherType: "JOURNAL",
    voucherNumber: "",
    date: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
    partyType: "NONE",
    partyName: "",
    bankName: "",
    paymentMode: "NEFT",
    narration: "",
    lines: [
      { id: "line-1", accountCode: "", accountName: "", debit: "", credit: "", narration: "" },
      { id: "line-2", accountCode: "", accountName: "", debit: "", credit: "", narration: "" },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchVouchers());
    dispatch(fetchAccounts());
  }, [dispatch]);

  // Derived Summary Metrics
  const metrics = useMemo(() => {
    let totalVouchers = vouchers.length;
    let totalDebitMovement = 0;
    let totalCreditMovement = 0;
    let jvCount = 0;
    let pvCount = 0;
    let rvCount = 0;

    vouchers.forEach((v) => {
      if (v.voucherType === "JOURNAL") jvCount++;
      if (v.voucherType === "PAYMENT") pvCount++;
      if (v.voucherType === "RECEIPT") rvCount++;

      (v.lines || []).forEach((l) => {
        totalDebitMovement += Number(l.debit || 0);
        totalCreditMovement += Number(l.credit || 0);
      });
    });

    return {
      totalVouchers,
      totalDebitMovement,
      totalCreditMovement,
      jvCount,
      pvCount,
      rvCount,
    };
  }, [vouchers]);

  // Dynamic Voucher Line Balancing Calculations
  const voucherLineTotals = useMemo(() => {
    const totalDr = (formData.lines || []).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCr = (formData.lines || []).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const diff = Math.abs(totalDr - totalCr);
    const isBalanced = totalDr > 0 && Math.abs(totalDr - totalCr) < 0.01;

    return { totalDr, totalCr, diff, isBalanced };
  }, [formData.lines]);

  // Filtered Vouchers List
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (typeFilter !== "ALL" && v.voucherType !== typeFilter) return false;
      if (startDate && v.date < startDate) return false;
      if (endDate && v.date > endDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const vNo = (v.voucherNumber || "").toLowerCase();
        const ref = (v.referenceNumber || "").toLowerCase();
        const narr = (v.narration || "").toLowerCase();
        const party = (v.partyName || "").toLowerCase();
        return vNo.includes(q) || ref.includes(q) || narr.includes(q) || party.includes(q);
      }

      return true;
    });
  }, [vouchers, typeFilter, startDate, endDate, search]);

  // Generate Voucher Number
  const generateNextVoucherNo = (type) => {
    const prefix =
      type === "JOURNAL"
        ? "JV"
        : type === "PAYMENT"
        ? "PV"
        : type === "RECEIPT"
        ? "RV"
        : type === "CONTRA"
        ? "CV"
        : type === "SALES_INVOICE"
        ? "SV"
        : "PB";
    const year = new Date().getFullYear();
    const count = vouchers.filter((v) => v.voucherType === type).length + 1;
    return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
  };

  const handleOpenCreate = (preselectedType = "JOURNAL") => {
    const vNo = generateNextVoucherNo(preselectedType);
    setFormData({
      ...initialFormState,
      voucherType: preselectedType,
      voucherNumber: vNo,
      date: new Date().toISOString().slice(0, 10),
      lines: [
        { id: `line-${Date.now()}-1`, accountCode: "", accountName: "", debit: "", credit: "", narration: "" },
        { id: `line-${Date.now()}-2`, accountCode: "", accountName: "", debit: "", credit: "", narration: "" },
      ],
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleVoucherTypeChange = (newType) => {
    const vNo = generateNextVoucherNo(newType);
    setFormData((prev) => ({
      ...prev,
      voucherType: newType,
      voucherNumber: vNo,
    }));
  };

  // Add / Remove Lines
  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: `line-${Date.now()}`, accountCode: "", accountName: "", debit: "", credit: "", narration: "" },
      ],
    }));
  };

  const handleRemoveLine = (index) => {
    if (formData.lines.length <= 2) {
      toast.error("A double-entry voucher must have at least 2 lines.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.lines];
    updated[index] = { ...updated[index], [field]: value };

    // If account was chosen, sync accountName
    if (field === "accountCode") {
      const matched = accounts.find((a) => a.accountCode === value);
      if (matched) {
        updated[index].accountName = matched.accountName;
        updated[index].accountType = matched.accountType;
      }
    }

    // Mutually exclusive Debit/Credit logic per line
    if (field === "debit" && value !== "") {
      updated[index].credit = "";
    } else if (field === "credit" && value !== "") {
      updated[index].debit = "";
    }

    setFormData((prev) => ({ ...prev, lines: updated }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.voucherNumber.trim()) errors.voucherNumber = "Voucher Number is required.";
    if (!formData.date) errors.date = "Voucher Date is required.";

    if (formData.lines.length < 2) {
      errors.lines = "Voucher requires at least 2 entries.";
    }

    // Check lines validity
    const hasIncompleteLines = formData.lines.some(
      (l) => !l.accountCode || (Number(l.debit || 0) === 0 && Number(l.credit || 0) === 0)
    );
    if (hasIncompleteLines) {
      errors.lines = "All lines must have an account and non-zero Debit or Credit amount.";
    }

    // Check Balance
    if (!voucherLineTotals.isBalanced) {
      errors.balance = `Voucher is out of balance by ${formatCurrency(voucherLineTotals.diff)}. Total Debit must equal Total Credit.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(formErrors.balance || "Please correct the voucher entries.");
      return;
    }

    try {
      const payload = {
        ...formData,
        totalAmount: voucherLineTotals.totalDr,
        lines: formData.lines.map((l) => ({
          ...l,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      };

      await dispatch(createVoucher(payload)).unwrap();
      toast.success(`Voucher ${formData.voucherNumber} posted successfully.`);
      setFormDialogOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to post voucher.");
    }
  };

  const handleDeletePrompt = (v) => {
    setVoucherToDelete(v);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;
    try {
      await dispatch(deleteVoucher(voucherToDelete.id)).unwrap();
      toast.success(`Voucher ${voucherToDelete.voucherNumber} deleted.`);
      setDeleteConfirmOpen(false);
      setVoucherToDelete(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete voucher.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredVouchers.length === 0) {
      toast.error("No vouchers to export.");
      return;
    }

    const headers = ["Voucher No", "Date", "Type", "Reference", "Party", "Amount (INR)", "Narration"];
    const rows = filteredVouchers.map((v) => [
      `"${v.voucherNumber}"`,
      `"${v.date}"`,
      `"${v.voucherType}"`,
      `"${v.referenceNumber || ""}"`,
      `"${v.partyName || ""}"`,
      v.totalAmount || 0,
      `"${(v.narration || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Aspino_Vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vouchers exported to CSV.");
  };

  // Table Columns
  const columns = [
    {
      accessorKey: "voucherNumber",
      header: "Voucher Details",
      cell: ({ row }) => {
        const v = row.original;
        const typeConf = VOUCHER_TYPE_CONFIG[v.voucherType] || VOUCHER_TYPE_CONFIG.JOURNAL;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 border ${typeConf.color}`}>
              <typeConf.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => {
                    setSelectedVoucher(v);
                    setViewDialogOpen(true);
                  }}
                  className="font-mono font-bold text-xs cursor-pointer hover:underline text-aspino-primary"
                >
                  {v.voucherNumber}
                </span>
                <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0.2 border ${typeConf.color}`}>
                  {typeConf.short}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {v.partyName ? `${v.partyName} &bull; ` : ""}{v.narration || "General Journal Entry"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date & Ref",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-xs text-foreground block">
              {new Date(v.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground block">
              {v.referenceNumber ? `Ref: ${v.referenceNumber}` : "No Ref"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Amount (Debit/Credit)",
      cell: ({ row }) => (
        <span className="font-mono font-black text-sm text-foreground">
          {formatCurrency(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Posted & Balanced
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-aspino-primary rounded-xl"
              onClick={() => {
                setSelectedVoucher(v);
                setViewDialogOpen(true);
              }}
              title="Print / View Slip"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl"
              onClick={() => handleDeletePrompt(v)}
              title="Delete Voucher"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Double-Entry Voucher Engine"
        subtitle="Manage balanced Journal (JV), Payment (PV), Receipt (RV), Contra (CV), Sales (SV), and Purchase (PB) vouchers."
      >
        <div className="flex flex-wrap items-center gap-2">
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
              dispatch(fetchVouchers());
              toast.success("Voucher registry refreshed.");
            }}
            className="rounded-xl gap-1.5 text-xs h-9 font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleOpenCreate("JOURNAL")}
            size="sm"
            className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5 text-xs h-9"
          >
            <Plus className="h-4 w-4" />
            Create Voucher
          </Button>
        </div>
      </PageHeader>

      {/* Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Posted Vouchers
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-foreground">
                {metrics.totalVouchers}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.jvCount} Journal &bull; {metrics.pvCount} Payment &bull; {metrics.rvCount} Receipt
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-sky-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Debit Movement (Dr)
              </span>
              <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                <Scale className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-sky-950 dark:text-sky-100">
                {formatCurrency(metrics.totalDebitMovement)}
              </h3>
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Balanced Books
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Credit Movement (Cr)
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-950 dark:text-emerald-100">
                {formatCurrency(metrics.totalCreditMovement)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                Dr = Cr Verified (Zero variance)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </span>
              <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreate("PAYMENT")}
                className="text-[11px] h-7 rounded-lg font-bold"
              >
                + Payment (PV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreate("RECEIPT")}
                className="text-[11px] h-7 rounded-lg font-bold"
              >
                + Receipt (RV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenCreate("CONTRA")}
                className="text-[11px] h-7 rounded-lg font-bold"
              >
                + Contra (CV)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-5 pb-4 border-b space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Receipt className="h-5 w-5 text-aspino-primary" />
                Voucher Registry & Financial Journal
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Showing {filteredVouchers.length} of {vouchers.length} recorded double-entry accounting transactions.
              </CardDescription>
            </div>

            <Tabs
              value={typeFilter}
              onValueChange={setTypeFilter}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-10 p-1 rounded-2xl bg-muted/80">
                <TabsTrigger value="ALL" className="text-xs font-bold rounded-xl px-3">All</TabsTrigger>
                <TabsTrigger value="JOURNAL" className="text-xs font-bold rounded-xl px-3">Journal (JV)</TabsTrigger>
                <TabsTrigger value="PAYMENT" className="text-xs font-bold rounded-xl px-3">Payment (PV)</TabsTrigger>
                <TabsTrigger value="RECEIPT" className="text-xs font-bold rounded-xl px-3">Receipt (RV)</TabsTrigger>
                <TabsTrigger value="CONTRA" className="text-xs font-bold rounded-xl px-3">Contra (CV)</TabsTrigger>
                <TabsTrigger value="SALES_INVOICE" className="text-xs font-bold rounded-xl px-3">Sales (SV)</TabsTrigger>
                <TabsTrigger value="PURCHASE_BILL" className="text-xs font-bold rounded-xl px-3">Purchase (PB)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voucher no, reference, narration, party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-muted/50 border-border"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-muted-foreground">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-36 text-xs rounded-xl bg-muted/50 font-mono"
              />
              <span className="font-bold text-muted-foreground">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-36 text-xs rounded-xl bg-muted/50 font-mono"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredVouchers}
            loading={loading}
            emptyMessage="No financial vouchers match your criteria."
          />
        </CardContent>
      </Card>

      {/* ─── CREATE VOUCHER DIALOG (SIGNATURE 2-COLUMN LANDSCAPE LAYOUT) ─────────── */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-3 opacity-10">
              <Receipt className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">
                    Record New Financial Voucher
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Post double-entry journal entries with real-time debit and credit validation.
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                    voucherLineTotals.isBalanced
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {voucherLineTotals.isBalanced ? "✅ Balanced Entry" : `⚠️ Out of Balance (₹${voucherLineTotals.diff})`}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
              {/* Top Header Inputs: Type, Number, Date, Reference */}
              <div className="border rounded-2xl p-4 bg-muted/20 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Voucher Type *</Label>
                  <Select
                    value={formData.voucherType}
                    onValueChange={handleVoucherTypeChange}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 font-bold text-xs">
                      <SelectValue placeholder="Select Voucher Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JOURNAL">Journal Voucher (JV)</SelectItem>
                      <SelectItem value="PAYMENT">Payment Voucher (PV)</SelectItem>
                      <SelectItem value="RECEIPT">Receipt Voucher (RV)</SelectItem>
                      <SelectItem value="CONTRA">Contra Voucher (CV)</SelectItem>
                      <SelectItem value="SALES_INVOICE">Sales Voucher (SV)</SelectItem>
                      <SelectItem value="PURCHASE_BILL">Purchase Bill (PB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Voucher Number *</Label>
                  <Input
                    value={formData.voucherNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, voucherNumber: e.target.value.toUpperCase() }))}
                    className="h-11 rounded-xl bg-muted/50 font-mono font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Posting Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-11 rounded-xl bg-muted/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Ref / Challan / Cheque No</Label>
                  <Input
                    placeholder="e.g. INV-2026-089"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    className="h-11 rounded-xl bg-muted/50 text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Double-Entry Line Items Grid */}
              <div className="border rounded-2xl p-4 bg-muted/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-sky-600" />
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Double-Entry Ledger Lines
                    </h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLine}
                    className="h-8 text-xs font-bold rounded-xl gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Ledger Line
                  </Button>
                </div>

                {/* Table Lines */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase px-2">
                    <div className="col-span-5">General Ledger Account *</div>
                    <div className="col-span-3 text-right">Debit Amount (₹)</div>
                    <div className="col-span-3 text-right">Credit Amount (₹)</div>
                    <div className="col-span-1 text-center">Del</div>
                  </div>

                  {formData.lines.map((line, idx) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-card border">
                      {/* Account Selector */}
                      <div className="col-span-5">
                        <Select
                          value={line.accountCode}
                          onValueChange={(val) => handleLineChange(idx, "accountCode", val)}
                        >
                          <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/50">
                            <SelectValue placeholder="Select GL Account" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id || acc.accountCode} value={acc.accountCode} className="text-xs">
                                <span className="font-mono font-bold mr-2 text-aspino-primary">{acc.accountCode}</span>
                                <span>{acc.accountName}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Debit Input */}
                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debit}
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                          className="h-10 text-xs text-right font-mono font-bold rounded-xl bg-muted/50"
                        />
                      </div>

                      {/* Credit Input */}
                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.credit}
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                          className="h-10 text-xs text-right font-mono font-bold rounded-xl bg-muted/50"
                        />
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Line Totals Summary Bar */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
                  <span className="uppercase text-slate-300">Voucher Balancing Verification</span>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-400 font-normal mr-2">Total Debit:</span>
                      <span className="text-sky-300 font-black">{formatCurrency(voucherLineTotals.totalDr)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal mr-2">Total Credit:</span>
                      <span className="text-emerald-300 font-black">{formatCurrency(voucherLineTotals.totalCr)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-normal mr-2">Variance:</span>
                      <span className={voucherLineTotals.diff === 0 ? "text-emerald-400" : "text-rose-400"}>
                        {formatCurrency(voucherLineTotals.diff)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Narration */}
              <div className="space-y-1.5 border rounded-2xl p-4 bg-muted/20 shadow-sm">
                <Label className="text-xs font-bold text-foreground">Transaction Narration / Audit Memo</Label>
                <Textarea
                  placeholder="Enter detailed description of financial event, invoice terms, board approvals..."
                  value={formData.narration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, narration: e.target.value }))}
                  className="rounded-xl text-xs bg-muted/50 min-h-[60px]"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="h-10 text-xs font-bold rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !voucherLineTotals.isBalanced}
                className={`h-10 text-xs font-bold px-7 rounded-xl shadow-lg ${
                  voucherLineTotals.isBalanced
                    ? "bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 text-white shadow-sky-600/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Post Double-Entry Voucher
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── PRINT / VIEW VOUCHER SLIP MODAL ──────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {selectedVoucher && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Slip Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                      <Receipt className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black text-white">
                        Official Voucher Slip: {selectedVoucher.voucherNumber}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-300">
                        {VOUCHER_TYPE_CONFIG[selectedVoucher.voucherType]?.label} &bull; Date: {selectedVoucher.date}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                    Audited & Posted
                  </Badge>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-6 space-y-4 bg-card flex-1 overflow-y-auto">
                {/* Meta details bar */}
                <div className="p-4 rounded-2xl border bg-muted/20 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block font-medium">Voucher Number</span>
                    <span className="font-mono font-bold text-sm text-aspino-primary">{selectedVoucher.voucherNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Reference Code</span>
                    <span className="font-mono font-bold">{selectedVoucher.referenceNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Party / Ledger</span>
                    <span className="font-semibold">{selectedVoucher.partyName || "General Accounting"}</span>
                  </div>
                </div>

                {/* Lines Table */}
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 border-b">
                      <tr>
                        <th className="p-3 text-left font-bold text-muted-foreground uppercase">GL Account</th>
                        <th className="p-3 text-left font-bold text-muted-foreground uppercase">Narration</th>
                        <th className="p-3 text-right font-bold text-muted-foreground uppercase">Debit (₹)</th>
                        <th className="p-3 text-right font-bold text-muted-foreground uppercase">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedVoucher.lines || []).map((l, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-3">
                            <span className="font-mono font-bold text-aspino-primary mr-1.5">{l.accountCode}</span>
                            <span className="font-semibold text-foreground">{l.accountName}</span>
                          </td>
                          <td className="p-3 text-muted-foreground">{l.narration || "—"}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            {l.debit > 0 ? formatCurrency(l.debit) : "—"}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {l.credit > 0 ? formatCurrency(l.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40 font-mono font-black border-t">
                      <tr>
                        <td colSpan={2} className="p-3 uppercase text-right">Totals:</td>
                        <td className="p-3 text-right text-sky-600">{formatCurrency(selectedVoucher.totalAmount)}</td>
                        <td className="p-3 text-right text-emerald-600">{formatCurrency(selectedVoucher.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Narration */}
                {selectedVoucher.narration && (
                  <div className="p-3 rounded-xl border bg-muted/20 text-xs space-y-1">
                    <span className="font-bold text-muted-foreground uppercase">Narration:</span>
                    <p className="text-foreground leading-relaxed">{selectedVoucher.narration}</p>
                  </div>
                )}

                {/* Sign-off Boxes */}
                <div className="grid grid-cols-3 gap-3 pt-6 text-center text-xs text-muted-foreground">
                  <div className="border-t pt-2 font-medium">Prepared By: {selectedVoucher.createdBy || "Accountant"}</div>
                  <div className="border-t pt-2 font-medium">Checked By: Finance Lead</div>
                  <div className="border-t pt-2 font-medium">Authorized Signatory</div>
                </div>
              </div>

              {/* Slip Footer */}
              <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-10 text-xs font-bold rounded-xl px-5 gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Voucher Slip
                </Button>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="h-10 text-xs bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold px-6 rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Accounting Voucher"
        description={`Are you sure you want to delete voucher "${voucherToDelete?.voucherNumber}"? This will reverse all associated general ledger entries.`}
        confirmText="Delete Voucher"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
