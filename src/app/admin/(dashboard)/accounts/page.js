"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
} from "@/redux/slices/accountsSlice";
import { generateAccountCode } from "@/lib/code-generator";
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
import { Switch } from "@/components/ui/switch";
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
  Landmark,
  Edit,
  Trash2,
  Eye,
  Building2,
  FileText,
  Search,
  CheckCircle2,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  Coins,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  IndianRupee,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePermissions, RouteGuard } from "@/context/PermissionContext";

// Standard Chart of Accounts Groupings
const ACCOUNT_GROUPS = {
  ASSET: [
    "Cash & Cash Equivalents",
    "Current Assets",
    "Accounts Receivable",
    "Inventory",
    "Prepaid Expenses",
    "Fixed Assets",
    "Property, Plant & Equipment",
    "Intangible Assets",
    "Other Assets",
  ],
  LIABILITY: [
    "Current Liabilities",
    "Accounts Payable",
    "Short Term Debt",
    "Accrued Liabilities",
    "Taxes Payable",
    "Long Term Debt",
    "Other Liabilities",
  ],
  EQUITY: [
    "Common Stock",
    "Retained Earnings",
    "Owner Capital",
    "Capital Reserves",
  ],
  REVENUE: [
    "Operating Revenue",
    "Sales Revenue",
    "Service Revenue",
    "Interest Income",
    "Other Income",
  ],
  EXPENSE: [
    "Cost of Goods Sold",
    "Operating Expenses",
    "Salaries & Wages",
    "Rent & Utilities",
    "Depreciation & Amortization",
    "Interest Expense",
    "Tax Expense",
    "Administrative Expenses",
  ],
};

const TYPE_CONFIG = {
  ASSET: {
    label: "Asset",
    color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    badgeGradient: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    icon: Wallet,
    normal: "DEBIT",
  },
  LIABILITY: {
    label: "Liability",
    color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    badgeGradient: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Scale,
    normal: "CREDIT",
  },
  EQUITY: {
    label: "Equity",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    badgeGradient: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: Coins,
    normal: "CREDIT",
  },
  REVENUE: {
    label: "Revenue",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    badgeGradient: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: TrendingUp,
    normal: "CREDIT",
  },
  EXPENSE: {
    label: "Expense",
    color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    badgeGradient: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: TrendingDown,
    normal: "DEBIT",
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_BANKS = [
  { id: "bank-1", name: "State Bank of India" },
  { id: "bank-2", name: "HDFC Bank" },
  { id: "bank-3", name: "ICICI Bank" },
  { id: "bank-4", name: "Axis Bank" },
  { id: "bank-5", name: "Punjab National Bank" },
  { id: "bank-6", name: "Bank of Baroda" },
  { id: "bank-7", name: "Kotak Mahindra Bank" },
  { id: "bank-8", name: "Canara Bank" },
  { id: "bank-9", name: "Union Bank of India" },
];

function AccountsContent() {
  const { can } = usePermissions();
  const dispatch = useDispatch();
  const { accounts = [], loading, submitting } = useSelector((state) => state.accounts || {});

  // Banks list from Bank table
  const [banks, setBanks] = useState(DEFAULT_BANKS);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bankOnlyFilter, setBankOnlyFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form State
  const initialFormState = {
    accountCode: "",
    accountName: "",
    accountType: "ASSET",
    accountGroup: "Cash & Cash Equivalents",
    subGroup: "",
    currency: "INR",
    openingBalance: "",
    normalBalance: "DEBIT",
    isBankAccount: false,
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    taxApplicable: false,
    hsnSacCode: "",
    description: "",
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Banks from NestJS backend Bank table
  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bank`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const active = list.filter((b) => b?.isActive !== false);
        if (active.length > 0) {
          setBanks(active);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch banks, using defaults", err);
    }
    setBanks(DEFAULT_BANKS);
  };

  useEffect(() => {
    dispatch(fetchAccounts());
    fetchBanks();
  }, [dispatch]);

  // Dynamic available groups based on selected type
  const availableGroups = useMemo(() => {
    if (formData.accountType && ACCOUNT_GROUPS[formData.accountType]) {
      return ACCOUNT_GROUPS[formData.accountType];
    }
    return ACCOUNT_GROUPS.ASSET;
  }, [formData.accountType]);

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    let totalAccounts = accounts.length;
    let activeAccounts = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let bankAccountsCount = 0;

    accounts.forEach((acc) => {
      if (acc.isActive) activeAccounts++;
      if (acc.isBankAccount) bankAccountsCount++;

      const bal = Number(acc.currentBalance ?? acc.openingBalance ?? 0);
      switch (acc.accountType) {
        case "ASSET":
          totalAssets += bal;
          break;
        case "LIABILITY":
          totalLiabilities += bal;
          break;
        case "EQUITY":
          totalEquity += bal;
          break;
        case "REVENUE":
          totalRevenue += bal;
          break;
        case "EXPENSE":
          totalExpenses += bal;
          break;
        default:
          break;
      }
    });

    const netProfit = totalRevenue - totalExpenses;

    return {
      totalAccounts,
      activeAccounts,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netProfit,
      bankAccountsCount,
    };
  }, [accounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (typeFilter !== "ALL" && acc.accountType !== typeFilter) return false;
      if (groupFilter !== "ALL" && acc.accountGroup !== groupFilter) return false;
      if (statusFilter === "ACTIVE" && !acc.isActive) return false;
      if (statusFilter === "INACTIVE" && acc.isActive) return false;
      if (bankOnlyFilter && !acc.isBankAccount) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (acc.accountCode || "").toLowerCase();
        const name = (acc.accountName || "").toLowerCase();
        const group = (acc.accountGroup || "").toLowerCase();
        const sub = (acc.subGroup || "").toLowerCase();
        const desc = (acc.description || "").toLowerCase();
        const bank = (acc.bankName || "").toLowerCase();
        return (
          code.includes(q) ||
          name.includes(q) ||
          group.includes(q) ||
          sub.includes(q) ||
          desc.includes(q) ||
          bank.includes(q)
        );
      }

      return true;
    });
  }, [accounts, typeFilter, groupFilter, statusFilter, bankOnlyFilter, search]);

  // Form Handlers
  const handleOpenCreate = () => {
    setEditingAccount(null);
    const defType = "ASSET";
    const defGroup = ACCOUNT_GROUPS.ASSET[0];
    const generated = generateAccountCode("", defType, defGroup);
    setFormData({
      ...initialFormState,
      accountCode: generated,
      accountType: defType,
      accountGroup: defGroup,
      normalBalance: "DEBIT",
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormData({
      accountCode: acc.accountCode || "",
      accountName: acc.accountName || "",
      accountType: acc.accountType || "ASSET",
      accountGroup: acc.accountGroup || ACCOUNT_GROUPS[acc.accountType || "ASSET"][0],
      subGroup: acc.subGroup || "",
      currency: acc.currency || "INR",
      openingBalance: acc.openingBalance || "",
      normalBalance: acc.normalBalance || (TYPE_CONFIG[acc.accountType]?.normal || "DEBIT"),
      isBankAccount: Boolean(acc.isBankAccount),
      bankName: acc.bankName || "",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      branch: acc.branch || "",
      taxApplicable: Boolean(acc.taxApplicable),
      hsnSacCode: acc.hsnSacCode || "",
      description: acc.description || "",
      isActive: acc.isActive !== false,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleOpenView = (acc) => {
    setSelectedAccount(acc);
    setViewDialogOpen(true);
  };

  const handleTypeChange = (newType) => {
    const groups = ACCOUNT_GROUPS[newType] || [];
    const newGroup = groups[0] || "";
    const normal = TYPE_CONFIG[newType]?.normal || "DEBIT";
    const newCode = generateAccountCode(formData.accountName, newType, newGroup);

    setFormData((prev) => ({
      ...prev,
      accountType: newType,
      accountGroup: newGroup,
      normalBalance: normal,
      accountCode: newCode,
    }));
    if (formErrors.accountType) {
      setFormErrors((prev) => ({ ...prev, accountType: null }));
    }
  };

  const handleNameBlur = () => {
    if (formData.accountName && !editingAccount) {
      const generated = generateAccountCode(
        formData.accountName,
        formData.accountType,
        formData.accountGroup
      );
      if (generated) {
        setFormData((prev) => ({ ...prev, accountCode: generated }));
      }
    }
  };

  const handleAutoGenerateCode = () => {
    const code = generateAccountCode(
      formData.accountName,
      formData.accountType,
      formData.accountGroup
    );
    setFormData((prev) => ({ ...prev, accountCode: code }));
    if (formErrors.accountCode) {
      setFormErrors((prev) => ({ ...prev, accountCode: null }));
    }
    toast.success(`Generated account code: ${code}`);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.accountCode.trim()) {
      errors.accountCode = "Account Code is required.";
    }
    if (!formData.accountName.trim()) {
      errors.accountName = "Account Name is required.";
    }
    if (!formData.accountType) {
      errors.accountType = "Account Type is required.";
    }
    if (!formData.accountGroup) {
      errors.accountGroup = "Account Group is required.";
    }
    if (formData.isBankAccount && !formData.bankName.trim()) {
      errors.bankName = "Bank Name is required for Bank accounts.";
    }
    if (formData.openingBalance !== "" && (isNaN(Number(formData.openingBalance)) || Number(formData.openingBalance) < 0)) {
      errors.openingBalance = "Opening Balance cannot be negative.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    try {
      if (editingAccount) {
        await dispatch(
          updateAccount({
            id: editingAccount.id,
            accountData: {
              ...formData,
              openingBalance: Number(formData.openingBalance || 0),
            },
          })
        ).unwrap();
        toast.success(`Account "${formData.accountName}" updated successfully.`);
      } else {
        await dispatch(
          createAccount({
            ...formData,
            openingBalance: Number(formData.openingBalance || 0),
          })
        ).unwrap();
        toast.success(`Account "${formData.accountName}" created successfully.`);
      }
      setFormDialogOpen(false);
    } catch (err) {
      toast.error(err?.message || "Operation failed. Please try again.");
    }
  };

  const handleDeletePrompt = (acc) => {
    setAccountToDelete(acc);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    try {
      await dispatch(deleteAccount(accountToDelete.id)).unwrap();
      toast.success(`Account "${accountToDelete.accountName}" deleted.`);
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete account.");
    }
  };

  const handleToggleStatus = (acc) => {
    dispatch(toggleAccountStatus(acc.id));
    toast.success(
      `Account ${acc.accountCode} marked as ${!acc.isActive ? "Active" : "Inactive"}`
    );
  };

  // Export CSV Handler
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
      "Opening Balance",
      "Current Balance",
      "Normal Balance",
      "Bank Account",
      "Bank Name",
      "Account Number",
      "IFSC",
      "Status",
      "Description",
    ];

    const rows = filteredAccounts.map((a) => [
      `"${a.accountCode}"`,
      `"${a.accountName}"`,
      `"${a.accountType}"`,
      `"${a.accountGroup || ""}"`,
      `"${a.subGroup || ""}"`,
      `"${a.currency || "INR"}"`,
      a.openingBalance || 0,
      a.currentBalance || 0,
      `"${a.normalBalance || "DEBIT"}"`,
      a.isBankAccount ? "Yes" : "No",
      `"${a.bankName || ""}"`,
      `"${a.accountNumber || ""}"`,
      `"${a.ifscCode || ""}"`,
      a.isActive ? "Active" : "Inactive",
      `"${(a.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aspino_Chart_of_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Chart of Accounts exported to CSV.");
  };

  // Table Columns Definition
  const columns = [
    {
      accessorKey: "accountCode",
      header: "Code & Account",
      cell: ({ row }) => {
        const acc = row.original;
        const typeConf = TYPE_CONFIG[acc.accountType] || TYPE_CONFIG.ASSET;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 border ${typeConf.color}`}
            >
              <typeConf.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  onClick={() => handleOpenView(acc)}
                  className="font-mono font-bold text-xs cursor-pointer hover:underline text-aspino-primary"
                >
                  {acc.accountCode}
                </span>
                {acc.isBankAccount && (
                  <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200">
                    <Building2 className="h-2.5 w-2.5 mr-1" />
                    Bank
                  </Badge>
                )}
                {acc.taxApplicable && (
                  <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 bg-amber-50/50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200">
                    <Percent className="h-2.5 w-2.5 mr-0.5" />
                    GST
                  </Badge>
                )}
              </div>
              <p
                onClick={() => handleOpenView(acc)}
                className="font-bold text-sm text-foreground hover:text-aspino-primary cursor-pointer transition-colors line-clamp-1"
              >
                {acc.accountName}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {acc.subGroup || acc.accountGroup}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "accountType",
      header: "Classification",
      cell: ({ row }) => {
        const acc = row.original;
        const typeConf = TYPE_CONFIG[acc.accountType] || TYPE_CONFIG.ASSET;
        return (
          <div className="space-y-1">
            <Badge variant="outline" className={`font-bold text-xs px-2.5 py-0.5 border ${typeConf.color}`}>
              {typeConf.label}
            </Badge>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {acc.accountGroup}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "normalBalance",
      header: "Normal Bal.",
      cell: ({ row }) => {
        const normal = row.original.normalBalance || "DEBIT";
        const isDr = normal === "DEBIT";
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-mono font-bold ${
              isDr
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400"
                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400"
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
        const acc = row.original;
        const bal = acc.currentBalance ?? acc.openingBalance ?? 0;
        const isPositive = bal >= 0;
        return (
          <div className="space-y-0.5">
            <span className={`font-mono font-bold text-sm ${isPositive ? "text-foreground" : "text-destructive"}`}>
              {formatCurrency(bal)}
            </span>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Opening:</span>
              <span className="font-mono">{formatCurrency(acc.openingBalance || 0)}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const acc = row.original;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={acc.isActive}
              onCheckedChange={() => handleToggleStatus(acc)}
              className="data-[state=checked]:bg-aspino-primary"
            />
            <span
              className={`text-xs font-semibold ${
                acc.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {acc.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const acc = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-aspino-primary rounded-xl"
              onClick={() => handleOpenView(acc)}
              title="View Account Overview"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {can("update", "accounts") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-600 rounded-xl"
                onClick={() => handleOpenEdit(acc)}
                title="Edit Account"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {can("delete", "accounts") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl"
                onClick={() => handleDeletePrompt(acc)}
                title="Delete Account"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Chart of Accounts Master"
        subtitle="Maintain General Ledger (GL) classifications, asset portfolios, liability debt, revenue streams, and bank ledger integrations."
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
              dispatch(fetchAccounts());
              toast.success("Account records refreshed.");
            }}
            className="rounded-xl gap-1.5 text-xs h-9 font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {can("create", "accounts") && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5 text-xs h-9"
            >
              <Plus className="h-4 w-4" />
              Add GL Account
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-sky-950/20 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Assets (Dr)
              </span>
              <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-sky-950 dark:text-sky-100">
                {formatCurrency(metrics.totalAssets)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                <Building2 className="h-3.5 w-3.5 text-sky-500" />
                <span>{metrics.bankAccountsCount} Bank accounts linked</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Liabilities & Equity */}
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-purple-950/20 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Liabilities & Debt (Cr)
              </span>
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <Scale className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-purple-950 dark:text-purple-100">
                {formatCurrency(metrics.totalLiabilities)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Equity Reserves: <span className="font-mono font-bold text-foreground">{formatCurrency(metrics.totalEquity)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Operating Revenue */}
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Operating Revenue
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-950 dark:text-emerald-100">
                {formatCurrency(metrics.totalRevenue)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Pharma formulations & job work sales</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses & Net Indicator */}
        <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Expenses (COGS & Opex)
              </span>
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono tracking-tight text-rose-950 dark:text-rose-100">
                {formatCurrency(metrics.totalExpenses)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between font-medium">
                <span>Net Margin:</span>
                <span
                  className={`font-mono font-extrabold ${
                    metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatCurrency(metrics.netProfit)}
                </span>
              </p>
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
                <Landmark className="h-5 w-5 text-aspino-primary" />
                Financial Ledger & Accounts Directory
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Showing {filteredAccounts.length} of {accounts.length} GL accounts across all asset, liability, revenue and expense heads.
              </CardDescription>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-2">
              <Tabs
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setGroupFilter("ALL");
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto"
              >
                <TabsList className="h-10 p-1 rounded-2xl bg-muted/80">
                  <TabsTrigger value="ALL" className="text-xs font-bold rounded-xl px-3">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="ASSET" className="text-xs font-bold rounded-xl px-3">
                    Assets
                  </TabsTrigger>
                  <TabsTrigger value="LIABILITY" className="text-xs font-bold rounded-xl px-3">
                    Liabilities
                  </TabsTrigger>
                  <TabsTrigger value="EQUITY" className="text-xs font-bold rounded-xl px-3">
                    Equity
                  </TabsTrigger>
                  <TabsTrigger value="REVENUE" className="text-xs font-bold rounded-xl px-3">
                    Revenue
                  </TabsTrigger>
                  <TabsTrigger value="EXPENSE" className="text-xs font-bold rounded-xl px-3">
                    Expenses
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Secondary Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search account code, name, bank or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-muted/50 border-border"
              />
            </div>

            {/* Group Filter */}
            <div className="w-52">
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/50 border-border">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL">All Account Groups</SelectItem>
                  {Object.entries(ACCOUNT_GROUPS).flatMap(([type, groups]) =>
                    typeFilter === "ALL" || typeFilter === type
                      ? groups.map((grp) => (
                          <SelectItem key={`${type}-${grp}`} value={grp} className="text-xs">
                            {grp}
                          </SelectItem>
                        ))
                      : []
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-muted/50 border-border">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Status</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs">Active Only</SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Accounts Only Toggle */}
            <Button
              variant={bankOnlyFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setBankOnlyFilter(!bankOnlyFilter)}
              className={`rounded-xl text-xs h-10 font-bold gap-1.5 ${
                bankOnlyFilter ? "bg-aspino-secondary text-white" : ""
              }`}
            >
              <Building2 className="h-4 w-4" />
              Bank Accounts Only
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredAccounts}
            loading={loading}
            emptyMessage="No financial accounts match your filter criteria."
          />
        </CardContent>
      </Card>

      {/* ─── CREATE / EDIT ACCOUNT DIALOG (SIGNATURE 2-COLUMN WIDE LANDSCAPE LAYOUT) ──────────────── */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Top Header Gradient Banner with Watermark & Glass Badges */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-3 opacity-10">
              <Landmark className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {editingAccount
                      ? `Modify GL Account: ${editingAccount.accountName}`
                      : "Register New General Ledger Account"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Configure accounting classification, normal balance rules, bank disbursement linkages, and GST tax mapping.
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                    TYPE_CONFIG[formData.accountType]?.badgeGradient || "bg-sky-500/20 text-sky-300 border-sky-500/30"
                  }`}
                >
                  {TYPE_CONFIG[formData.accountType]?.label || "Asset"} Category
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                    formData.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/10 text-slate-300 border-white/10"
                  }`}
                >
                  {formData.isActive ? "Status: Active" : "Status: Inactive"}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleFormSubmit}
            noValidate
            autoComplete="off"
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
              {/* 2-COLUMN WIDE LANDSCAPE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* LEFT COLUMN: Identification & Classification */}
                <div className="space-y-4">
                  {/* Section 1: Classification & Ledger Identity */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Landmark className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        1. Classification & Ledger Identity
                      </h4>
                    </div>

                    {/* Account Type & Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="accountType" className="text-xs sm:text-sm font-bold text-foreground">
                          Account Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.accountType}
                          onValueChange={handleTypeChange}
                        >
                          <SelectTrigger
                            id="accountType"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-bold ${
                              formErrors.accountType ? "border-red-500" : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="ASSET" className="text-xs sm:text-sm">
                              ASSET (Assets & Bank)
                            </SelectItem>
                            <SelectItem value="LIABILITY" className="text-xs sm:text-sm">
                              LIABILITY (Payables & Debt)
                            </SelectItem>
                            <SelectItem value="EQUITY" className="text-xs sm:text-sm">
                              EQUITY (Capital & Reserves)
                            </SelectItem>
                            <SelectItem value="REVENUE" className="text-xs sm:text-sm">
                              REVENUE (Income & Sales)
                            </SelectItem>
                            <SelectItem value="EXPENSE" className="text-xs sm:text-sm">
                              EXPENSE (COGS & Opex)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.accountType && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {formErrors.accountType}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="accountGroup" className="text-xs sm:text-sm font-bold text-foreground">
                          Account Group <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.accountGroup}
                          onValueChange={(val) => {
                            setFormData((prev) => ({ ...prev, accountGroup: val }));
                            if (formErrors.accountGroup) {
                              setFormErrors((prev) => ({ ...prev, accountGroup: null }));
                            }
                          }}
                        >
                          <SelectTrigger
                            id="accountGroup"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              formErrors.accountGroup ? "border-red-500" : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select Group" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {availableGroups.map((grp) => (
                              <SelectItem key={grp} value={grp} className="text-xs sm:text-sm">
                                {grp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.accountGroup && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {formErrors.accountGroup}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Account Code & Auto-derive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="accountCode" className="text-xs sm:text-sm font-bold text-foreground">
                            Account Code <span className="text-red-500">*</span>
                          </Label>
                          <button
                            type="button"
                            onClick={handleAutoGenerateCode}
                            className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                            title="Auto-derive code from account name & type"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Auto-derive
                          </button>
                        </div>
                        <Input
                          id="accountCode"
                          placeholder="e.g. GL-AST-1010"
                          value={formData.accountCode}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              accountCode: e.target.value.toUpperCase(),
                            }));
                            if (formErrors.accountCode) {
                              setFormErrors((prev) => ({ ...prev, accountCode: null }));
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold ${
                            formErrors.accountCode
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                        {formErrors.accountCode && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {formErrors.accountCode}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="accountName" className="text-xs sm:text-sm font-bold text-foreground">
                          Account Ledger Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="accountName"
                          placeholder="e.g. HDFC Bank - Operations Current A/C"
                          value={formData.accountName}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, accountName: e.target.value }));
                            if (formErrors.accountName) {
                              setFormErrors((prev) => ({ ...prev, accountName: null }));
                            }
                          }}
                          onBlur={handleNameBlur}
                          className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                            formErrors.accountName
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                        {formErrors.accountName && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {formErrors.accountName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Sub-Group */}
                    <div className="space-y-1.5">
                      <Label htmlFor="subGroup" className="text-xs sm:text-sm font-bold text-foreground">
                        Sub-Group / Ledger Tag (Optional)
                      </Label>
                      <Input
                        id="subGroup"
                        placeholder="e.g. Bank Accounts, Liquid Cash, Direct Formulation Sales"
                        value={formData.subGroup}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, subGroup: e.target.value }))
                        }
                        className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Section 2: Financial Balances & Currency */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Scale className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        2. Financial Balances & Currency
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="openingBalance" className="text-xs sm:text-sm font-bold text-foreground">
                          Opening Balance (₹)
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                          <Input
                            id="openingBalance"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.openingBalance}
                            onKeyDown={(e) => {
                              if (["-", "+", "e", "E"].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  openingBalance: val,
                                }));
                                if (formErrors.openingBalance) {
                                  setFormErrors((prev) => ({ ...prev, openingBalance: null }));
                                }
                              }
                            }}
                            className={`text-xs sm:text-sm h-11 pl-9 rounded-xl bg-muted/50 font-mono font-bold ${
                              formErrors.openingBalance
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-border focus-visible:ring-sky-500"
                            }`}
                          />
                        </div>
                        {formErrors.openingBalance && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {formErrors.openingBalance}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="normalBalance" className="text-xs sm:text-sm font-bold text-foreground">
                          Normal Balance Type
                        </Label>
                        <Select
                          value={formData.normalBalance}
                          onValueChange={(val) => setFormData((prev) => ({ ...prev, normalBalance: val }))}
                        >
                          <SelectTrigger
                            id="normalBalance"
                            className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border font-mono font-bold"
                          >
                            <SelectValue placeholder="Select Balance Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEBIT" className="text-xs sm:text-sm font-mono font-bold">
                              DEBIT (Dr)
                            </SelectItem>
                            <SelectItem value="CREDIT" className="text-xs sm:text-sm font-mono font-bold">
                              CREDIT (Cr)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="currency" className="text-xs sm:text-sm font-bold text-foreground">
                          Ledger Base Currency
                        </Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(val) => setFormData((prev) => ({ ...prev, currency: val }))}
                        >
                          <SelectTrigger
                            id="currency"
                            className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border font-mono"
                          >
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR" className="text-xs sm:text-sm">INR (₹) — Indian Rupee</SelectItem>
                            <SelectItem value="USD" className="text-xs sm:text-sm">USD ($) — US Dollar</SelectItem>
                            <SelectItem value="EUR" className="text-xs sm:text-sm">EUR (€) — Euro</SelectItem>
                            <SelectItem value="GBP" className="text-xs sm:text-sm">GBP (£) — British Pound</SelectItem>
                            <SelectItem value="AED" className="text-xs sm:text-sm">AED — UAE Dirham</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Banking, Tax & Remarks */}
                <div className="space-y-4">
                  {/* Section 3: Banking & Disbursement Integration */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-sky-600" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          3. Banking & Disbursement Integration
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Is Bank Account?</span>
                        <Switch
                          checked={formData.isBankAccount}
                          onCheckedChange={(val) =>
                            setFormData((prev) => ({ ...prev, isBankAccount: val }))
                          }
                          className="data-[state=checked]:bg-aspino-primary"
                        />
                      </div>
                    </div>

                    {formData.isBankAccount ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <Label htmlFor="bankName" className="text-xs sm:text-sm font-bold text-foreground">
                            Bank Name <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.bankName}
                            onValueChange={(val) => {
                              setFormData((prev) => ({ ...prev, bankName: val }));
                              if (formErrors.bankName) {
                                setFormErrors((prev) => ({ ...prev, bankName: null }));
                              }
                            }}
                          >
                            <SelectTrigger
                              id="bankName"
                              className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                                formErrors.bankName ? "border-red-500" : "border-border"
                              }`}
                            >
                              <SelectValue placeholder="Select Bank from Bank Master" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {banks && banks.length > 0 ? (
                                banks.map((b) => (
                                  <SelectItem key={b.id || b.name} value={b.name} className="text-xs sm:text-sm">
                                    <span className="flex items-center gap-2">
                                      <Building2 className="h-3.5 w-3.5 text-aspino-primary" />
                                      {b.name}
                                    </span>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled className="text-xs text-muted-foreground">
                                  No active banks available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formErrors.bankName && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {formErrors.bankName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="accountNumber" className="text-xs sm:text-sm font-bold text-foreground">
                            Account Number
                          </Label>
                          <Input
                            id="accountNumber"
                            placeholder="e.g. 50200084729103"
                            value={formData.accountNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                accountNumber: e.target.value,
                              }))
                            }
                            className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold border-border focus-visible:ring-sky-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="ifscCode" className="text-xs sm:text-sm font-bold text-foreground">
                            IFSC Code
                          </Label>
                          <Input
                            id="ifscCode"
                            placeholder="e.g. HDFC0000123"
                            value={formData.ifscCode}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                ifscCode: e.target.value.toUpperCase(),
                              }))
                            }
                            className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold border-border focus-visible:ring-sky-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="branch" className="text-xs sm:text-sm font-bold text-foreground">
                            Branch Location
                          </Label>
                          <Input
                            id="branch"
                            placeholder="e.g. Nariman Point, Mumbai"
                            value={formData.branch}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, branch: e.target.value }))
                            }
                            className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-sky-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-background/50 border border-dashed border-border text-center text-xs text-muted-foreground">
                        Toggle &ldquo;Is Bank Account&rdquo; above to link institutional banking, IFSC and account numbers.
                      </div>
                    )}
                  </div>

                  {/* Section 4: Tax, GST & Accounting Guidelines */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-amber-500" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          4. Tax & Accounting Notes
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">GST Applicable?</span>
                        <Switch
                          checked={formData.taxApplicable}
                          onCheckedChange={(val) =>
                            setFormData((prev) => ({ ...prev, taxApplicable: val }))
                          }
                          className="data-[state=checked]:bg-aspino-primary"
                        />
                      </div>
                    </div>

                    {formData.taxApplicable && (
                      <div className="space-y-1.5">
                        <Label htmlFor="hsnSacCode" className="text-xs sm:text-sm font-bold text-foreground">
                          HSN / SAC Tax Code
                        </Label>
                        <Input
                          id="hsnSacCode"
                          placeholder="e.g. 3004, 2936, or 9983"
                          value={formData.hsnSacCode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              hsnSacCode: e.target.value.toUpperCase(),
                            }))
                          }
                          className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold border-border focus-visible:ring-sky-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs sm:text-sm font-bold text-foreground">
                        Operational Description / Internal Notes
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Enter accounting instructions, ledger purpose, journal restrictions..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="text-xs sm:text-sm rounded-xl bg-muted/50 border-border focus-visible:ring-sky-500 min-h-[75px]"
                      />
                    </div>
                  </div>

                  {/* Section 5: Active Status Card */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="active-switch" className="text-xs sm:text-sm font-bold text-foreground cursor-pointer">
                        Active Account Status
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {formData.isActive ? "Active (Usable in passes & journal entries)" : "Inactive"}
                      </p>
                    </div>
                    <Switch
                      id="active-switch"
                      checked={formData.isActive}
                      onCheckedChange={(val) =>
                        setFormData((prev) => ({ ...prev, isActive: val }))
                      }
                      className="data-[state=checked]:bg-aspino-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Modal Bottom Action Footer */}
            <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="h-10 text-xs sm:text-sm rounded-xl font-bold px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {submitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingAccount ? "Save Changes" : "Create GL Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── VIEW ACCOUNT OVERVIEW MODAL (WIDE 2-COLUMN LANDSCAPE LAYOUT) ──────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-5xl xl:max-w-6xl w-[96vw] max-h-[92vh] p-0 gap-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
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
                        Classification:{" "}
                        <span className="font-semibold text-slate-100">
                          {selectedAccount.accountGroup} &bull; {selectedAccount.subGroup || "General Ledger"}
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
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                        selectedAccount.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-white/10 text-slate-300 border-white/10"
                      }`}
                    >
                      {selectedAccount.isActive ? "Status: Active" : "Status: Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Content Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Balance & Valuation */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Scale className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Financial Balance & Currency
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
                        <span className="text-xs text-muted-foreground block font-medium">Opening Balance</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {formatCurrency(selectedAccount.openingBalance || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Normal Balance</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedAccount.normalBalance || "DEBIT"} ({selectedAccount.normalBalance === "DEBIT" ? "Dr" : "Cr"})
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Ledger Currency</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedAccount.currency || "INR"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Banking & Tax Credentials */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Banking & Tax Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Bank Account</span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {selectedAccount.isBankAccount ? selectedAccount.bankName || "Linked" : "No (GL Ledger)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Account No / IFSC</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedAccount.accountNumber ? `${selectedAccount.accountNumber} (${selectedAccount.ifscCode || "—"})` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">GST Applicable</span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {selectedAccount.taxApplicable ? `Yes (${selectedAccount.hsnSacCode || "Applicable"})` : "Exempt / No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Branch Location</span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {selectedAccount.branch || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedAccount.description && (
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-1.5 shadow-sm text-xs">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">
                      Accounting Notes & Description
                    </span>
                    <p className="p-3 rounded-xl border bg-card text-foreground leading-relaxed">
                      {selectedAccount.description}
                    </p>
                  </div>
                )}
              </div>

              {/* View Dialog Footer */}
              <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenEdit(selectedAccount);
                  }}
                  className="h-10 text-xs sm:text-sm rounded-xl font-bold px-5 gap-1.5"
                >
                  <Edit className="h-4 w-4" /> Edit Account
                </Button>
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

      {/* ─── DELETE CONFIRMATION MODAL ───────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete General Ledger Account"
        description={`Are you sure you want to delete account "${accountToDelete?.accountCode} - ${accountToDelete?.accountName}"? This action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <RouteGuard permissionKey="accounts">
      <AccountsContent />
    </RouteGuard>
  );
}

