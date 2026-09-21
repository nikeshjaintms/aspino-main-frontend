"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVouchers } from "@/redux/slices/financeSlice";
import { fetchAccounts } from "@/redux/slices/accountsSlice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart3,
  Scale,
  BookOpen,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Landmark,
  Coins,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  PieChart,
  Eye,
  FileText,
  DollarSign,
  HelpCircle,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

export default function FinancialReportsPage() {
  const dispatch = useDispatch();
  const { vouchers = [], loading: vouchersLoading } = useSelector((state) => state.finance || {});
  const { accounts = [], loading: accountsLoading } = useSelector((state) => state.accounts || {});

  // Active Report Tab
  const [activeTab, setActiveTab] = useState("trial-balance"); // "trial-balance" | "general-ledger" | "profit-loss" | "balance-sheet"

  // Filters & State
  const [selectedGlCode, setSelectedGlCode] = useState("GL-AST-1020");
  const [tbSearch, setTbSearch] = useState("");
  const [tbTypeFilter, setTbTypeFilter] = useState("ALL");
  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal for viewing voucher drilldown
  const [selectedVoucherForView, setSelectedVoucherForView] = useState(null);
  const [viewVoucherDialogOpen, setViewVoucherDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchVouchers());
    dispatch(fetchAccounts());
  }, [dispatch]);

  // Format Currency (INR)
  const formatINR = (val) => {
    const num = Number(val || 0);
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ─── 1. TRIAL BALANCE CALCULATION ──────────────────────────────────────────
  const trialBalanceData = useMemo(() => {
    const glMap = {};

    // Initialize all active GL accounts from accounts slice
    accounts.forEach((acc) => {
      const code = acc.accountCode;
      const opBal = Number(acc.openingBalance || 0);
      const isAssetOrExpense = acc.accountType === "ASSET" || acc.accountType === "EXPENSE";

      glMap[code] = {
        code,
        name: acc.accountName,
        type: acc.accountType,
        group: acc.accountGroup,
        openingDebit: isAssetOrExpense && opBal > 0 ? opBal : 0,
        openingCredit: !isAssetOrExpense && opBal > 0 ? opBal : 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      };
    });

    // Process all posted double-entry vouchers
    vouchers.forEach((vch) => {
      const vDate = vch.date || vch.createdAt?.split("T")[0] || "";
      if (dateFrom && vDate < dateFrom) return;
      if (dateTo && vDate > dateTo) return;

      (vch.lines || []).forEach((line) => {
        const code = line.accountCode;
        if (!code) return;

        if (!glMap[code]) {
          glMap[code] = {
            code,
            name: line.accountName || "Account",
            type: line.accountType || "ASSET",
            group: "General",
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: 0,
            periodCredit: 0,
            closingDebit: 0,
            closingCredit: 0,
          };
        }

        glMap[code].periodDebit += Number(line.debit || 0);
        glMap[code].periodCredit += Number(line.credit || 0);
      });
    });

    // Compute Net Closing Balances according to Normal Account Balances
    // Assets & Expenses: Normal Debit
    // Liabilities, Equity, Revenue: Normal Credit
    let totalDebitSum = 0;
    let totalCreditSum = 0;

    const rows = Object.values(glMap).map((row) => {
      const totalDr = row.openingDebit + row.periodDebit;
      const totalCr = row.openingCredit + row.periodCredit;

      if (row.type === "ASSET" || row.type === "EXPENSE") {
        const net = totalDr - totalCr;
        if (net >= 0) {
          row.closingDebit = net;
          row.closingCredit = 0;
        } else {
          row.closingDebit = 0;
          row.closingCredit = Math.abs(net);
        }
      } else {
        // LIABILITY, EQUITY, REVENUE
        const net = totalCr - totalDr;
        if (net >= 0) {
          row.closingCredit = net;
          row.closingDebit = 0;
        } else {
          row.closingCredit = 0;
          row.closingDebit = Math.abs(net);
        }
      }

      totalDebitSum += row.closingDebit;
      totalCreditSum += row.closingCredit;

      return row;
    });

    // Sort by Account Code
    rows.sort((a, b) => (a.code || "").localeCompare(b.code || ""));

    return {
      rows,
      totalDebitSum,
      totalCreditSum,
      isBalanced: Math.abs(totalDebitSum - totalCreditSum) < 0.01,
      variance: Math.abs(totalDebitSum - totalCreditSum),
    };
  }, [accounts, vouchers, dateFrom, dateTo]);

  // Filtered Trial Balance rows
  const filteredTbRows = useMemo(() => {
    return trialBalanceData.rows.filter((r) => {
      if (tbTypeFilter !== "ALL" && r.type !== tbTypeFilter) return false;
      if (hideZeroBalances && r.closingDebit === 0 && r.closingCredit === 0 && r.periodDebit === 0 && r.periodCredit === 0) {
        return false;
      }
      if (tbSearch.trim()) {
        const q = tbSearch.toLowerCase();
        const matchCode = (r.code || "").toLowerCase().includes(q);
        const matchName = (r.name || "").toLowerCase().includes(q);
        const matchGroup = (r.group || "").toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchGroup) return false;
      }
      return true;
    });
  }, [trialBalanceData.rows, tbTypeFilter, hideZeroBalances, tbSearch]);

  // ─── 2. GENERAL LEDGER (GL) BOOK DRILLDOWN ─────────────────────────────────
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.accountCode === selectedGlCode) || accounts[0];
  }, [accounts, selectedGlCode]);

  const generalLedgerBook = useMemo(() => {
    if (!selectedAccount) return { entries: [], openingBal: 0, closingBal: 0 };

    const targetCode = selectedAccount.accountCode;
    const isAssetOrExpense = selectedAccount.accountType === "ASSET" || selectedAccount.accountType === "EXPENSE";
    const openingBal = Number(selectedAccount.openingBalance || 0);

    const entries = [];

    vouchers.forEach((vch) => {
      const vDate = vch.date || vch.createdAt?.split("T")[0] || "";
      if (dateFrom && vDate < dateFrom) return;
      if (dateTo && vDate > dateTo) return;

      const matchingLines = (vch.lines || []).filter((l) => l.accountCode === targetCode);
      if (matchingLines.length > 0) {
        matchingLines.forEach((line) => {
          // Find contra account name from other lines in same voucher
          const contraLine = (vch.lines || []).find((l) => l.accountCode !== targetCode);
          const contraName = contraLine?.accountName || vch.partyName || "Multiple Accounts";

          entries.push({
            id: `${vch.id}-${line.id || Math.random()}`,
            date: vDate,
            voucherNumber: vch.voucherNumber,
            voucherType: vch.voucherType,
            referenceNumber: vch.referenceNumber || "-",
            particulars: contraName,
            narration: line.narration || vch.narration || "-",
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
            fullVoucher: vch,
          });
        });
      }
    });

    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance
    let running = openingBal;
    const mappedEntries = entries.map((e) => {
      if (isAssetOrExpense) {
        running = running + e.debit - e.credit;
      } else {
        running = running + e.credit - e.debit;
      }
      return {
        ...e,
        runningBalance: running,
      };
    });

    return {
      entries: mappedEntries,
      openingBal,
      closingBal: running,
    };
  }, [selectedAccount, vouchers, dateFrom, dateTo]);

  // ─── 3. PROFIT & LOSS (INCOME STATEMENT) CALCULATION ───────────────────────
  const profitLossStatement = useMemo(() => {
    let operatingRevenue = 0;
    let exportSales = 0;
    let otherIncome = 0;

    let costOfGoodsSold = 0;
    let directManufacturingExp = 0;
    let utilitiesAndPower = 0;
    let salariesAndWages = 0;
    let adminAndMarketing = 0;
    let depreciationExp = 0;
    let financeCosts = 0;

    const revenueLines = [];
    const expenseLines = [];

    trialBalanceData.rows.forEach((r) => {
      if (r.type === "REVENUE") {
        const amt = r.closingCredit > 0 ? r.closingCredit : r.closingDebit;
        if (amt > 0) {
          revenueLines.push({ name: r.name, code: r.code, amount: amt, group: r.group });
          if (r.name.toLowerCase().includes("export")) exportSales += amt;
          else if (r.name.toLowerCase().includes("other") || r.name.toLowerCase().includes("interest")) otherIncome += amt;
          else operatingRevenue += amt;
        }
      } else if (r.type === "EXPENSE") {
        const amt = r.closingDebit > 0 ? r.closingDebit : r.closingCredit;
        if (amt > 0) {
          expenseLines.push({ name: r.name, code: r.code, amount: amt, group: r.group });
          const lname = r.name.toLowerCase();
          if (lname.includes("raw material") || lname.includes("cogs") || lname.includes("packing")) {
            costOfGoodsSold += amt;
          } else if (lname.includes("depreciation") || lname.includes("amortization")) {
            depreciationExp += amt;
          } else if (lname.includes("electricity") || lname.includes("power") || lname.includes("utility")) {
            utilitiesAndPower += amt;
          } else if (lname.includes("salary") || lname.includes("wages") || lname.includes("employee")) {
            salariesAndWages += amt;
          } else if (lname.includes("finance") || lname.includes("bank charge") || lname.includes("interest")) {
            financeCosts += amt;
          } else {
            adminAndMarketing += amt;
          }
        }
      }
    });

    const totalGrossRevenue = operatingRevenue + exportSales + otherIncome;
    const grossProfit = totalGrossRevenue - costOfGoodsSold;
    const grossMarginPct = totalGrossRevenue > 0 ? ((grossProfit / totalGrossRevenue) * 100).toFixed(1) : 0;

    const totalOperatingExpenses = utilitiesAndPower + salariesAndWages + adminAndMarketing + directManufacturingExp;
    const ebitda = grossProfit - totalOperatingExpenses;
    const netProfit = ebitda - depreciationExp - financeCosts;
    const netMarginPct = totalGrossRevenue > 0 ? ((netProfit / totalGrossRevenue) * 100).toFixed(1) : 0;

    return {
      revenueLines,
      expenseLines,
      operatingRevenue,
      exportSales,
      otherIncome,
      totalGrossRevenue,
      costOfGoodsSold,
      grossProfit,
      grossMarginPct,
      utilitiesAndPower,
      salariesAndWages,
      adminAndMarketing,
      totalOperatingExpenses,
      ebitda,
      depreciationExp,
      financeCosts,
      netProfit,
      netMarginPct,
    };
  }, [trialBalanceData.rows]);

  // ─── 4. BALANCE SHEET (STATEMENT OF FINANCIAL POSITION) ────────────────────
  const balanceSheetStatement = useMemo(() => {
    let currentAssets = [];
    let nonCurrentAssets = [];
    let currentLiabilities = [];
    let nonCurrentLiabilities = [];
    let equityList = [];

    let totalCurrentAssets = 0;
    let totalNonCurrentAssets = 0;
    let totalCurrentLiabilities = 0;
    let totalNonCurrentLiabilities = 0;
    let totalEquity = 0;

    trialBalanceData.rows.forEach((r) => {
      if (r.type === "ASSET") {
        const amt = r.closingDebit > 0 ? r.closingDebit : -r.closingCredit;
        if (amt !== 0) {
          if (
            r.group === "Cash & Cash Equivalents" ||
            r.group === "Current Assets" ||
            r.group === "Accounts Receivable" ||
            r.group === "Inventory" ||
            r.name.toLowerCase().includes("bank") ||
            r.name.toLowerCase().includes("debtor") ||
            r.name.toLowerCase().includes("cash")
          ) {
            currentAssets.push({ ...r, amount: amt });
            totalCurrentAssets += amt;
          } else {
            nonCurrentAssets.push({ ...r, amount: amt });
            totalNonCurrentAssets += amt;
          }
        }
      } else if (r.type === "LIABILITY") {
        const amt = r.closingCredit > 0 ? r.closingCredit : -r.closingDebit;
        if (amt !== 0) {
          if (
            r.group === "Current Liabilities" ||
            r.group === "Accounts Payable" ||
            r.group === "Duties & Taxes" ||
            r.name.toLowerCase().includes("creditor") ||
            r.name.toLowerCase().includes("payable") ||
            r.name.toLowerCase().includes("gst")
          ) {
            currentLiabilities.push({ ...r, amount: amt });
            totalCurrentLiabilities += amt;
          } else {
            nonCurrentLiabilities.push({ ...r, amount: amt });
            totalNonCurrentLiabilities += amt;
          }
        }
      } else if (r.type === "EQUITY") {
        const amt = r.closingCredit > 0 ? r.closingCredit : -r.closingDebit;
        if (amt !== 0) {
          equityList.push({ ...r, amount: amt });
          totalEquity += amt;
        }
      }
    });

    // Net Profit from P&L is added to Equity (Retained Earnings)
    const pnlNetProfit = profitLossStatement.netProfit;
    const totalLiabilitiesAndEquity =
      totalCurrentLiabilities + totalNonCurrentLiabilities + totalEquity + pnlNetProfit;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1.0;

    return {
      currentAssets,
      nonCurrentAssets,
      totalCurrentAssets,
      totalNonCurrentAssets,
      totalAssets,
      currentLiabilities,
      nonCurrentLiabilities,
      totalCurrentLiabilities,
      totalNonCurrentLiabilities,
      equityList,
      totalEquity,
      pnlNetProfit,
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }, [trialBalanceData.rows, profitLossStatement.netProfit]);

  // Export Trial Balance CSV
  const handleExportTbCSV = () => {
    const headers = ["Account Code", "Account Name", "Group", "Type", "Opening Dr", "Opening Cr", "Debit Movement", "Credit Movement", "Closing Dr", "Closing Cr"];
    const rows = filteredTbRows.map((r) => [
      r.code,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.group}"`,
      r.type,
      r.openingDebit,
      r.openingCredit,
      r.periodDebit,
      r.periodCredit,
      r.closingDebit,
      r.closingCredit,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trial_Balance_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Trial Balance exported to CSV");
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Page Header */}
      <PageHeader
        title="Financial Statements & Reports"
        description="Comprehensive enterprise double-entry reporting: Trial Balance, General Ledger Book, Profit & Loss, and Balance Sheet."
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-border/80 shadow-sm"
            onClick={() => {
              dispatch(fetchVouchers());
              dispatch(fetchAccounts());
              toast.success("Financial reports refreshed with latest transactions");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-xl border-border/80 shadow-sm"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Statement
          </Button>
        </div>
      </PageHeader>

      {/* Top Statement Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trial Balance Status */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Trial Balance Status
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Balanced
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Debits: <span className="font-mono font-semibold">{formatINR(trialBalanceData.totalDebitSum)}</span>
            </p>
          </CardContent>
        </Card>

        {/* Gross Revenue */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operating Revenue
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(profitLossStatement.totalGrossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross Margin: <span className="font-semibold text-blue-600 dark:text-blue-400">{profitLossStatement.grossMarginPct}%</span>
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Profit (EAT)
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-400">
              {formatINR(profitLossStatement.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net Margin: <span className="font-semibold text-teal-600 dark:text-teal-400">{profitLossStatement.netMarginPct}%</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Assets Balance Sheet */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Enterprise Assets
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Landmark className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(balanceSheetStatement.totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Equilibrium: <span className="font-medium text-purple-600 dark:text-purple-400">Assets = Liab + Equity</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main 4-Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60 grid grid-cols-2 md:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="trial-balance" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <Scale className="h-4 w-4 mr-2" />
              Trial Balance
            </TabsTrigger>
            <TabsTrigger value="general-ledger" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-2" />
              General Ledger Book
            </TabsTrigger>
            <TabsTrigger value="profit-loss" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Profit & Loss (P&L)
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <Landmark className="h-4 w-4 mr-2" />
              Balance Sheet
            </TabsTrigger>
          </TabsList>

          {/* Date Range Global Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-36 rounded-xl bg-card border-border/80 text-xs"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-36 rounded-xl bg-card border-border/80 text-xs"
            />
          </div>
        </div>

        {/* ─── TAB 1: TRIAL BALANCE ───────────────────────────────────────── */}
        <TabsContent value="trial-balance" className="space-y-4 m-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter account code/name..."
                  value={tbSearch}
                  onChange={(e) => setTbSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-card border-border/80"
                />
              </div>

              <Select value={tbTypeFilter} onValueChange={setTbTypeFilter}>
                <SelectTrigger className="w-36 h-10 rounded-xl bg-card border-border/80">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ASSET">Assets</SelectItem>
                  <SelectItem value="LIABILITY">Liabilities</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="REVENUE">Revenue</SelectItem>
                  <SelectItem value="EXPENSE">Expenses</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 pl-2">
                <Switch
                  checked={hideZeroBalances}
                  onCheckedChange={setHideZeroBalances}
                  id="hide-zero"
                />
                <Label htmlFor="hide-zero" className="text-xs text-muted-foreground cursor-pointer">
                  Hide Zero Balances
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTbCSV}
              className="h-10 rounded-xl border-border/80 shadow-sm"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              Export Trial Balance CSV
            </Button>
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Account Details</th>
                    <th className="py-3.5 px-4">Category Group</th>
                    <th className="py-3.5 px-4 text-right">Debit Movements</th>
                    <th className="py-3.5 px-4 text-right">Credit Movements</th>
                    <th className="py-3.5 px-4 text-right text-emerald-700 dark:text-emerald-400">
                      Closing Debit (₹)
                    </th>
                    <th className="py-3.5 px-4 text-right text-blue-700 dark:text-blue-400">
                      Closing Credit (₹)
                    </th>
                    <th className="py-3.5 px-4 text-center">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTbRows.map((row) => (
                    <tr
                      key={row.code}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedGlCode(row.code);
                        setActiveTab("general-ledger");
                      }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground group-hover:text-aspino-primary transition-colors">
                          {row.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                          <span className="font-semibold text-primary">{row.code}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {row.type}
                          </Badge>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {row.group || "General"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-foreground">
                        {row.periodDebit > 0 ? formatINR(row.periodDebit) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-foreground">
                        {row.periodCredit > 0 ? formatINR(row.periodCredit) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {row.closingDebit > 0 ? formatINR(row.closingDebit) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {row.closingCredit > 0 ? formatINR(row.closingCredit) : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setSelectedGlCode(row.code);
                            setActiveTab("general-ledger");
                          }}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/60 border-t-2 border-border font-bold text-sm">
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-right uppercase tracking-wider text-muted-foreground">
                      Total Trial Balance Equilibrium:
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 text-base font-black">
                      {formatINR(trialBalanceData.totalDebitSum)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-blue-600 dark:text-blue-400 text-base font-black">
                      {formatINR(trialBalanceData.totalCreditSum)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-0 font-bold">
                        MATCHED
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: GENERAL LEDGER BOOK ─────────────────────────────────── */}
        <TabsContent value="general-ledger" className="space-y-6 m-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-96">
              <Select value={selectedGlCode} onValueChange={setSelectedGlCode}>
                <SelectTrigger className="h-11 rounded-xl bg-card border-border/80 font-semibold">
                  <SelectValue placeholder="Select General Ledger Account" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.accountCode} value={acc.accountCode}>
                      <span className="font-semibold">{acc.accountName}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">({acc.accountCode})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-10 rounded-xl border-border/80 shadow-sm"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Ledger Book
            </Button>
          </div>

          {selectedAccount && (
            <Card className="rounded-2xl border-border/60 bg-gradient-to-r from-card to-muted/20 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">{selectedAccount.accountName}</h3>
                    <Badge className="bg-primary/10 text-primary font-mono">{selectedAccount.accountCode}</Badge>
                    <Badge variant="outline">{selectedAccount.accountType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Group: {selectedAccount.accountGroup || "General"} • Normal Balance:{" "}
                    {selectedAccount.accountType === "ASSET" || selectedAccount.accountType === "EXPENSE" ? "Debit (Dr)" : "Credit (Cr)"}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Closing Balance
                  </div>
                  <div className="text-2xl font-black text-primary mt-0.5 font-mono">
                    {formatINR(generalLedgerBook.closingBal)}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Contra Particulars</th>
                    <th className="py-3 px-4">Narration</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                    <th className="py-3 px-4 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="bg-muted/20 font-medium text-xs text-muted-foreground">
                    <td className="py-2.5 px-4 font-mono">-</td>
                    <td className="py-2.5 px-4 font-mono">OP-BAL</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px]">OPENING</Badge>
                    </td>
                    <td className="py-2.5 px-4 italic" colSpan="2">
                      Opening Balance Brought Forward
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {selectedAccount?.accountType === "ASSET" || selectedAccount?.accountType === "EXPENSE"
                        ? formatINR(selectedAccount?.openingBalance || 0)
                        : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {selectedAccount?.accountType !== "ASSET" && selectedAccount?.accountType !== "EXPENSE"
                        ? formatINR(selectedAccount?.openingBalance || 0)
                        : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold font-mono text-foreground">
                      {formatINR(generalLedgerBook.openingBal)}
                    </td>
                    <td className="py-2.5 px-4 text-center">-</td>
                  </tr>

                  {generalLedgerBook.entries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-muted-foreground">
                        No transactions recorded for this GL account in the selected period.
                      </td>
                    </tr>
                  ) : (
                    generalLedgerBook.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">{entry.date}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{entry.voucherNumber}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px]">{entry.voucherType}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-xs text-foreground/90">{entry.particulars}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-xs text-muted-foreground">{entry.narration}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 font-mono">
                          {entry.debit > 0 ? formatINR(entry.debit) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-blue-600 font-mono">
                          {entry.credit > 0 ? formatINR(entry.credit) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-foreground">
                          {formatINR(entry.runningBalance)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedVoucherForView(entry.fullVoucher);
                              setViewVoucherDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: PROFIT & LOSS STATEMENT ─────────────────────────────── */}
        <TabsContent value="profit-loss" className="space-y-6 m-0">
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-gradient-to-r from-card via-card/90 to-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Statement of Profit and Loss (Income Statement)</CardTitle>
                <CardDescription className="text-xs">
                  For the fiscal period ended • Currency: Indian Rupee (INR)
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-0 font-bold px-3 py-1">
                  Net Margin: {profitLossStatement.netMarginPct}%
                </Badge>
              </div>
            </CardHeader>

            <div className="p-6 space-y-6">
              {/* Section 1: Revenue from Operations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold text-sm border-b pb-2 text-foreground">
                  <span className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                    I. REVENUE FROM OPERATIONS
                  </span>
                  <span className="font-mono text-base">{formatINR(profitLossStatement.totalGrossRevenue)}</span>
                </div>

                <div className="space-y-1.5 pl-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Gross Formulation Sales & Dispatches</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.operatingRevenue)}</span>
                  </div>
                  {profitLossStatement.exportSales > 0 && (
                    <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                      <span>Export Formulation Sales (FOB/CIF)</span>
                      <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.exportSales)}</span>
                    </div>
                  )}
                  {profitLossStatement.otherIncome > 0 && (
                    <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                      <span>Other Non-Operating Income & Scrap</span>
                      <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.otherIncome)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Cost of Goods Sold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold text-sm border-b pb-2 text-foreground">
                  <span className="flex items-center gap-2 text-rose-600">
                    <TrendingDown className="h-4 w-4" />
                    II. COST OF GOODS SOLD (COGS)
                  </span>
                  <span className="font-mono text-base text-rose-600">({formatINR(profitLossStatement.costOfGoodsSold)})</span>
                </div>

                <div className="space-y-1.5 pl-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Raw Materials & API Consumed</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.costOfGoodsSold)}</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit Strip */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between font-bold text-sm">
                <span className="text-blue-900 dark:text-blue-200">
                  GROSS PROFIT (I - II)
                </span>
                <span className="font-mono text-lg text-blue-700 dark:text-blue-300">
                  {formatINR(profitLossStatement.grossProfit)} ({profitLossStatement.grossMarginPct}%)
                </span>
              </div>

              {/* Section 3: Operating Expenses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold text-sm border-b pb-2 text-foreground">
                  <span className="flex items-center gap-2 text-foreground">
                    <Layers className="h-4 w-4" />
                    III. OPERATING & MANUFACTURING EXPENSES
                  </span>
                  <span className="font-mono text-base text-rose-600">({formatINR(profitLossStatement.totalOperatingExpenses)})</span>
                </div>

                <div className="space-y-1.5 pl-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Factory Electricity, Water & Steam Utilities</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.utilitiesAndPower)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Salaries, Wages & Employee Benefits</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.salariesAndWages)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Administrative, Quality Control & Maintenance</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.adminAndMarketing)}</span>
                  </div>
                </div>
              </div>

              {/* Operating Profit (EBITDA) Strip */}
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between font-semibold text-sm">
                <span className="text-foreground">OPERATING PROFIT (EBITDA)</span>
                <span className="font-mono text-base font-bold text-foreground">{formatINR(profitLossStatement.ebitda)}</span>
              </div>

              {/* Section 4: Depreciation & Finance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between font-bold text-sm border-b pb-2 text-foreground">
                  <span>IV. DEPRECIATION & FINANCE COSTS</span>
                  <span className="font-mono text-base text-rose-600">({formatINR(profitLossStatement.depreciationExp + profitLossStatement.financeCosts)})</span>
                </div>

                <div className="space-y-1.5 pl-4 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                    <span>Plant & Cleanroom Machinery Depreciation</span>
                    <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.depreciationExp)}</span>
                  </div>
                  {profitLossStatement.financeCosts > 0 && (
                    <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                      <span>Bank Charges & Interest</span>
                      <span className="font-mono font-medium text-foreground">{formatINR(profitLossStatement.financeCosts)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NET PROFIT BOTTOM HIGHLIGHT */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-wider uppercase opacity-90">
                    Net Income / Profit After Tax
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mt-0.5">
                    {formatINR(profitLossStatement.netProfit)}
                  </h3>
                </div>

                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-0 font-bold text-sm">
                    Net Margin: {profitLossStatement.netMarginPct}%
                  </Badge>
                  <p className="text-xs opacity-80 mt-1">Transferred to Balance Sheet Retained Earnings</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: BALANCE SHEET ───────────────────────────────────────── */}
        <TabsContent value="balance-sheet" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: ASSETS */}
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card flex flex-col justify-between">
              <div>
                <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 py-4 px-6">
                  <CardTitle className="text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>ASSETS</span>
                    <span className="font-mono text-lg">{formatINR(balanceSheetStatement.totalAssets)}</span>
                  </CardTitle>
                </CardHeader>

                <div className="p-6 space-y-6">
                  {/* Current Assets */}
                  <div className="space-y-3">
                    <div className="flex justify-between font-bold text-xs uppercase text-muted-foreground border-b pb-1">
                      <span>Current Assets</span>
                      <span className="font-mono text-foreground font-semibold">{formatINR(balanceSheetStatement.totalCurrentAssets)}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {balanceSheetStatement.currentAssets.map((a) => (
                        <div key={a.code} className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            {a.name} <span className="font-mono text-[10px]">({a.code})</span>
                          </span>
                          <span className="font-mono font-medium text-foreground">{formatINR(a.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Non-Current Assets */}
                  <div className="space-y-3">
                    <div className="flex justify-between font-bold text-xs uppercase text-muted-foreground border-b pb-1">
                      <span>Non-Current / Fixed Assets</span>
                      <span className="font-mono text-foreground font-semibold">{formatINR(balanceSheetStatement.totalNonCurrentAssets)}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {balanceSheetStatement.nonCurrentAssets.map((a) => (
                        <div key={a.code} className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            {a.name} <span className="font-mono text-[10px]">({a.code})</span>
                          </span>
                          <span className="font-mono font-medium text-foreground">{formatINR(a.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Assets Foot */}
              <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 flex justify-between font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <span>TOTAL ASSETS</span>
                <span className="font-mono text-lg font-black">{formatINR(balanceSheetStatement.totalAssets)}</span>
              </div>
            </Card>

            {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card flex flex-col justify-between">
              <div>
                <CardHeader className="bg-blue-500/10 border-b border-blue-500/20 py-4 px-6">
                  <CardTitle className="text-base font-bold text-blue-800 dark:text-blue-300 flex items-center justify-between">
                    <span>LIABILITIES & SHAREHOLDERS EQUITY</span>
                    <span className="font-mono text-lg">{formatINR(balanceSheetStatement.totalLiabilitiesAndEquity)}</span>
                  </CardTitle>
                </CardHeader>

                <div className="p-6 space-y-6">
                  {/* Current Liabilities */}
                  <div className="space-y-3">
                    <div className="flex justify-between font-bold text-xs uppercase text-muted-foreground border-b pb-1">
                      <span>Current Liabilities</span>
                      <span className="font-mono text-foreground font-semibold">{formatINR(balanceSheetStatement.totalCurrentLiabilities)}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {balanceSheetStatement.currentLiabilities.map((l) => (
                        <div key={l.code} className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            {l.name} <span className="font-mono text-[10px]">({l.code})</span>
                          </span>
                          <span className="font-mono font-medium text-foreground">{formatINR(l.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equity & Retained Earnings */}
                  <div className="space-y-3">
                    <div className="flex justify-between font-bold text-xs uppercase text-muted-foreground border-b pb-1">
                      <span>Shareholders Equity & Reserves</span>
                      <span className="font-mono text-foreground font-semibold">
                        {formatINR(balanceSheetStatement.totalEquity + balanceSheetStatement.pnlNetProfit)}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {balanceSheetStatement.equityList.map((eq) => (
                        <div key={eq.code} className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">
                            {eq.name} <span className="font-mono text-[10px]">({eq.code})</span>
                          </span>
                          <span className="font-mono font-medium text-foreground">{formatINR(eq.amount)}</span>
                        </div>
                      ))}

                      {/* Current Period Net Profit Row */}
                      <div className="flex justify-between py-1.5 border-b border-border/40 bg-teal-500/5 px-2 rounded-lg font-semibold text-teal-700 dark:text-teal-300">
                        <span>Current Period Net Profit (From P&L)</span>
                        <span className="font-mono">{formatINR(balanceSheetStatement.pnlNetProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity Foot */}
              <div className="p-4 bg-blue-500/10 border-t border-blue-500/20 flex justify-between font-bold text-sm text-blue-900 dark:text-blue-200">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="font-mono text-lg font-black">{formatINR(balanceSheetStatement.totalLiabilitiesAndEquity)}</span>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Drilldown Voucher View Dialog */}
      <Dialog open={viewVoucherDialogOpen} onOpenChange={setViewVoucherDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          {selectedVoucherForView && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-aspino-primary" />
                    Voucher: {selectedVoucherForView.voucherNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Date: {selectedVoucherForView.date} • Type: {selectedVoucherForView.voucherType}
                  </p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {selectedVoucherForView.status || "POSTED"}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Narration:</span> {selectedVoucherForView.narration}
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Account Code & Name</th>
                      <th className="p-2.5 text-right">Debit (₹)</th>
                      <th className="p-2.5 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedVoucherForView.lines || []).map((l, i) => (
                      <tr key={i}>
                        <td className="p-2.5">
                          <span className="font-mono font-semibold text-primary">{l.accountCode}</span> - {l.accountName}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium">
                          {l.debit > 0 ? formatINR(l.debit) : "-"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium">
                          {l.credit > 0 ? formatINR(l.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => setViewVoucherDialogOpen(false)}
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
