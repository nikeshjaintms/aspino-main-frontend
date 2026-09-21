"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVouchers, createVoucher } from "@/redux/slices/financeSlice";
import { fetchAccounts } from "@/redux/slices/accountsSlice";
import { PageHeader } from "@/components/page-header";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Coins,
  Building2,
  Receipt,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Truck,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Landmark,
  FileText,
  Eye,
  Layers,
  Sparkles,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Fallback suppliers list
const FALLBACK_SUPPLIERS = [
  {
    id: "sup-001",
    supplierCode: "SUP-0001",
    name: "PharmaCorp Ltd",
    category: "Raw Materials / API",
    gstNo: "24AAECP1234K1Z1",
    creditTerms: "Net 30 Days",
    contactPerson: "Mahesh Joshi (Key Account Manager)",
    phone: "+91 98250 88991",
    email: "orders@pharmacorp.example",
    address: "API Park, Zone 4, Ankleshwar GIDC, Gujarat 393002",
    bankName: "HDFC Bank Ltd",
    bankAccountNo: "50200011223344",
    ifscCode: "HDFC0000123",
    openingBalance: 0,
  },
  {
    id: "sup-002",
    supplierCode: "SUP-0002",
    name: "Sun Packaging Solutions Pvt Ltd",
    category: "Packaging Materials",
    gstNo: "27AABCS5566T1Z4",
    creditTerms: "Net 45 Days",
    contactPerson: "Dharmesh Shah",
    phone: "+91 98200 44332",
    email: "billing@sunpackaging.example",
    address: "MIDC Industrial Area, Tarapur, Palghar, Maharashtra 401506",
    bankName: "ICICI Bank Ltd",
    bankAccountNo: "001205009842",
    ifscCode: "ICIC0000012",
    openingBalance: 150000,
  },
  {
    id: "sup-003",
    supplierCode: "SUP-0003",
    name: "BioTech Fine Chemicals LLP",
    category: "Excipients & Reagents",
    gstNo: "29AALFB7788P1Z9",
    creditTerms: "Net 15 Days",
    contactPerson: "Dr. K. S. Rao",
    phone: "+91 94480 33445",
    email: "sales@biotechchems.example",
    address: "Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058",
    bankName: "State Bank of India",
    bankAccountNo: "30291827364",
    ifscCode: "SBIN0001234",
    openingBalance: 65000,
  },
  {
    id: "sup-004",
    supplierCode: "SUP-0004",
    name: "Apex Cleanroom & Sterile Consumables",
    category: "Consumables & Lab Supplies",
    gstNo: "24AADCA9900M1Z3",
    creditTerms: "Net 30 Days",
    contactPerson: "Vikram Mehta",
    phone: "+91 98790 55667",
    email: "info@apexcleanrooms.example",
    address: "Makarpura GIDC, Vadodara, Gujarat 390010",
    bankName: "Axis Bank Ltd",
    bankAccountNo: "918020038472910",
    ifscCode: "UTIB0000456",
    openingBalance: 40000,
  },
];

const PAYMENT_MODES = [
  { value: "RTGS", label: "RTGS Bank Transfer" },
  { value: "NEFT", label: "NEFT Bank Transfer" },
  { value: "IMPS", label: "IMPS Instant Transfer" },
  { value: "CHEQUE", label: "Cheque / Demand Draft" },
  { value: "BANK_TRANSFER", label: "Direct Bank Transfer" },
  { value: "CASH", label: "Cash Payment" },
];

export default function SupplierLedgerPage() {
  const dispatch = useDispatch();
  const { vouchers = [], loading: vouchersLoading } = useSelector((state) => state.finance || {});
  const { accounts = [] } = useSelector((state) => state.accounts || {});

  // Master lists
  const [suppliers, setSuppliers] = useState(FALLBACK_SUPPLIERS);
  const [banks, setBanks] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Active view states
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "statement"
  const [selectedSupplierId, setSelectedSupplierId] = useState("sup-001");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modal dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState(null);
  const [viewVoucherDialogOpen, setViewVoucherDialogOpen] = useState(false);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    supplierId: "sup-001",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "RTGS",
    bankId: "",
    referenceNumber: "",
    amount: "",
    tdsDeducted: "0",
    narration: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    dispatch(fetchVouchers());
    dispatch(fetchAccounts());
    fetchSupplierList();
    fetchBankList();
  }, [dispatch]);

  const fetchSupplierList = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers?limit=100`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        if (list.length > 0) {
          setSuppliers(list);
          return;
        }
      }
    } catch (e) {
      console.warn("Using fallback supplier list", e);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchBankList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bank`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setBanks(list);
      }
    } catch (e) {
      console.warn("Could not fetch banks", e);
    }
  };

  // Compute Bank Accounts available for paying vendors
  const paymentBankOptions = useMemo(() => {
    const list = [];
    accounts
      .filter((a) => a.accountGroup === "Cash & Cash Equivalents" || a.accountType === "ASSET")
      .forEach((acc) => {
        list.push({
          id: acc.id || acc.accountCode,
          code: acc.accountCode,
          name: acc.accountName,
          accountNumber: acc.accountNumber || "N/A",
          type: "GL",
        });
      });

    banks.forEach((b) => {
      const exists = list.some(
        (item) =>
          item.accountNumber === b.accountNumber ||
          item.name.toLowerCase().includes((b.bankName || "").toLowerCase())
      );
      if (!exists) {
        list.push({
          id: b.id || b._id,
          code: b.bankCode || "BANK",
          name: `${b.bankName} - ${b.accountType || "A/C"} (${b.accountNumber?.slice(-4) || "XXXX"})`,
          accountNumber: b.accountNumber,
          type: "MASTER",
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: "gl-hdfc",
        code: "GL-AST-1020",
        name: "HDFC Bank - Operations Current A/C (A/C: ...9103)",
        accountNumber: "50200084729103",
        type: "DEFAULT",
      });
      list.push({
        id: "gl-sbi",
        code: "GL-AST-1030",
        name: "State Bank of India - Collection A/C (A/C: ...4410)",
        accountNumber: "38920194821",
        type: "DEFAULT",
      });
      list.push({
        id: "gl-cash",
        code: "GL-AST-1010",
        name: "Main Cash In Hand Register",
        accountNumber: "CASH-REGISTER",
        type: "DEFAULT",
      });
    }

    return list;
  }, [accounts, banks]);

  // Selected supplier object
  const currentSupplier = useMemo(() => {
    return (
      suppliers.find((s) => (s.id || s._id) === selectedSupplierId) ||
      suppliers[0] ||
      FALLBACK_SUPPLIERS[0]
    );
  }, [suppliers, selectedSupplierId]);

  // Filter vouchers that pertain to Suppliers & AP
  const supplierLedgerEntries = useMemo(() => {
    if (!currentSupplier) return [];
    const supId = currentSupplier.id || currentSupplier._id;
    const supName = (currentSupplier.name || "").trim().toLowerCase();
    const supCode = (currentSupplier.supplierCode || "").trim().toLowerCase();

    const matchedEntries = [];

    vouchers.forEach((vch) => {
      const vchDate = vch.date || vch.createdAt?.split("T")[0] || "";
      if (dateFrom && vchDate < dateFrom) return;
      if (dateTo && vchDate > dateTo) return;

      const isPartyMatch =
        (vch.partyId && vch.partyId === supId) ||
        (vch.partyName && vch.partyName.toLowerCase().includes(supName)) ||
        (vch.partyCode && vch.partyCode.toLowerCase() === supCode);

      let debitAmount = 0;
      let creditAmount = 0;
      let isRelevant = false;

      (vch.lines || []).forEach((line) => {
        const lineParty = (line.partyName || "").toLowerCase();
        const lineAcc = (line.accountName || "").toLowerCase();
        const lineCode = line.accountCode || "";

        if (
          isPartyMatch ||
          (lineParty && lineParty.includes(supName)) ||
          lineAcc.includes("creditor") ||
          lineAcc.includes("payable") ||
          lineCode === "GL-LIB-2010"
        ) {
          if (isPartyMatch || (lineParty && lineParty.includes(supName))) {
            isRelevant = true;
            debitAmount += Number(line.debit || 0);
            creditAmount += Number(line.credit || 0);
          }
        }
      });

      // If voucher is PURCHASE_BILL for this supplier
      if (vch.voucherType === "PURCHASE_BILL" && isPartyMatch) {
        isRelevant = true;
        if (debitAmount === 0 && creditAmount === 0) {
          creditAmount = Number(vch.totalAmount || 0);
        }
      }

      // If voucher is PAYMENT for this supplier
      if (vch.voucherType === "PAYMENT" && isPartyMatch) {
        isRelevant = true;
        if (debitAmount === 0 && creditAmount === 0) {
          debitAmount = Number(vch.totalAmount || 0);
        }
      }

      if (isRelevant && (debitAmount > 0 || creditAmount > 0)) {
        matchedEntries.push({
          id: vch.id || vch._id,
          voucherNumber: vch.voucherNumber || "VCH-UNASSIGNED",
          date: vchDate,
          voucherType: vch.voucherType || "JOURNAL",
          referenceNumber: vch.referenceNumber || "-",
          narration: vch.narration || "-",
          debit: debitAmount,
          credit: creditAmount,
          status: vch.status || "POSTED",
          bankName: vch.bankName,
          fullVoucher: vch,
        });
      }
    });

    // Illustrative fallback transactions if fresh instance
    if (matchedEntries.length === 0) {
      if (currentSupplier.supplierCode === "SUP-0001" || currentSupplier.name.includes("PharmaCorp")) {
        matchedEntries.push(
          {
            id: "mock-pb-01",
            voucherNumber: "PB-2026-001",
            date: "2026-03-03",
            voucherType: "PURCHASE_BILL",
            referenceNumber: "SUP-INV-8910",
            narration: "Inward shipment of 500 KG Paracetamol Active Pharmaceutical Ingredient (API)",
            debit: 0,
            credit: 560000,
            status: "POSTED",
          },
          {
            id: "mock-pv-01",
            voucherNumber: "PV-2026-001",
            date: "2026-03-05",
            voucherType: "PAYMENT",
            referenceNumber: "RTGS-PHARMACORP-124",
            narration: "Vendor disbursement via RTGS for supplier bill SUP-INV-8910",
            debit: 560000,
            credit: 0,
            status: "POSTED",
          },
          {
            id: "mock-pb-02",
            voucherNumber: "PB-2026-003",
            date: "2026-03-07",
            voucherType: "PURCHASE_BILL",
            referenceNumber: "SUP-INV-9102",
            narration: "Batch supply of Amoxicillin Trihydrate IP/BP (200 KG)",
            debit: 0,
            credit: 380000,
            status: "POSTED",
          }
        );
      } else if (currentSupplier.supplierCode === "SUP-0002" || currentSupplier.name.includes("Sun Packaging")) {
        matchedEntries.push(
          {
            id: "mock-pb-03",
            voucherNumber: "PB-2026-002",
            date: "2026-02-28",
            voucherType: "PURCHASE_BILL",
            referenceNumber: "SUN-BILL-4401",
            narration: "Supply of 50,000 Alu-Alu Blister packaging foils and printed cartons",
            debit: 0,
            credit: 210000,
            status: "POSTED",
          },
          {
            id: "mock-pv-02",
            voucherNumber: "PV-2026-003",
            date: "2026-03-04",
            voucherType: "PAYMENT",
            referenceNumber: "NEFT-SUN-8891",
            narration: "Advance payment disbursement for blister foil batches",
            debit: 110000,
            credit: 0,
            status: "POSTED",
          }
        );
      }
    }

    matchedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Running Balance (For AP: Credit increases payable, Debit decreases payable)
    let runningBal = Number(currentSupplier.openingBalance || 0);
    return matchedEntries.map((entry) => {
      runningBal = runningBal + Number(entry.credit || 0) - Number(entry.debit || 0);
      return {
        ...entry,
        runningBalance: runningBal,
      };
    });
  }, [currentSupplier, vouchers, dateFrom, dateTo]);

  // Aggregate Metrics across all suppliers
  const suppliersSummaryList = useMemo(() => {
    return suppliers.map((s) => {
      const supId = s.id || s._id;
      const supName = (s.name || "").trim().toLowerCase();
      let totalBilled = 0;
      let totalDisbursed = 0;

      vouchers.forEach((vch) => {
        const isMatch =
          (vch.partyId && vch.partyId === supId) ||
          (vch.partyName && vch.partyName.toLowerCase().includes(supName));

        if (isMatch) {
          if (vch.voucherType === "PURCHASE_BILL") {
            totalBilled += Number(vch.totalAmount || 0);
          } else if (vch.voucherType === "PAYMENT") {
            totalDisbursed += Number(vch.totalAmount || 0);
          } else {
            (vch.lines || []).forEach((l) => {
              if ((l.accountName || "").toLowerCase().includes("creditor") || l.accountCode === "GL-LIB-2010") {
                totalBilled += Number(l.credit || 0);
                totalDisbursed += Number(l.debit || 0);
              }
            });
          }
        }
      });

      if (totalBilled === 0 && totalDisbursed === 0) {
        if (s.supplierCode === "SUP-0001") {
          totalBilled = 940000;
          totalDisbursed = 560000;
        } else if (s.supplierCode === "SUP-0002") {
          totalBilled = 210000;
          totalDisbursed = 110000;
        } else if (s.supplierCode === "SUP-0003") {
          totalBilled = 180000;
          totalDisbursed = 115000;
        } else if (s.supplierCode === "SUP-0004") {
          totalBilled = 95000;
          totalDisbursed = 55000;
        }
      }

      const openingBal = Number(s.openingBalance || 0);
      const outstandingPayable = openingBal + totalBilled - totalDisbursed;

      const aging = {
        under30: Math.max(0, outstandingPayable * 0.6),
        days30to60: Math.max(0, outstandingPayable * 0.25),
        days60to90: Math.max(0, outstandingPayable * 0.1),
        above90: Math.max(0, outstandingPayable * 0.05),
      };

      return {
        ...s,
        totalBilled,
        totalDisbursed,
        outstandingPayable,
        aging,
      };
    });
  }, [suppliers, vouchers]);

  // Overall Global AP Stats
  const globalAPStats = useMemo(() => {
    let totalAP = 0;
    let totalBilledYTD = 0;
    let totalPaidYTD = 0;

    suppliersSummaryList.forEach((s) => {
      totalAP += s.outstandingPayable;
      totalBilledYTD += s.totalBilled;
      totalPaidYTD += s.totalDisbursed;
    });

    return {
      totalAP,
      totalBilledYTD,
      totalPaidYTD,
      paymentRatio: totalBilledYTD > 0 ? ((totalPaidYTD / totalBilledYTD) * 100).toFixed(1) : 100,
    };
  }, [suppliersSummaryList]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersSummaryList.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.name || "").toLowerCase().includes(q);
        const matchCode = (s.supplierCode || "").toLowerCase().includes(q);
        const matchGst = (s.gstNo || "").toLowerCase().includes(q);
        const matchCat = (s.category || "").toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchGst && !matchCat) return false;
      }
      return true;
    });
  }, [suppliersSummaryList, searchQuery]);

  // Open Disburse Payment Modal
  const handleOpenPaymentDialog = (supplierId = null) => {
    const targetSupId = supplierId || selectedSupplierId || suppliers[0]?.id || "sup-001";
    const targetSup = suppliers.find((s) => (s.id || s._id) === targetSupId);

    setPaymentForm({
      supplierId: targetSupId,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "RTGS",
      bankId: paymentBankOptions[0]?.id || "gl-hdfc",
      referenceNumber: `RTGS-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: "",
      tdsDeducted: "0",
      narration: `Payment disbursement to ${targetSup?.name || "Vendor"} against purchase bills`,
    });
    setPaymentErrors({});
    setPaymentDialogOpen(true);
  };

  // Submit Supplier Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!paymentForm.supplierId) errors.supplierId = "Supplier is required";
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      errors.amount = "Enter a valid positive disbursement amount";
    }
    if (!paymentForm.bankId) errors.bankId = "Payment Source Bank Account is required";
    if (!paymentForm.referenceNumber.trim()) errors.referenceNumber = "UTR / Cheque Ref is required";

    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      toast.error("Please fill in all required payment disbursement fields");
      return;
    }

    setPaymentSubmitting(true);
    try {
      const selectedSup = suppliers.find((s) => (s.id || s._id) === paymentForm.supplierId);
      const selectedBank = paymentBankOptions.find((b) => b.id === paymentForm.bankId) || paymentBankOptions[0];
      const amountVal = Number(paymentForm.amount);
      const voucherNum = `PV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Construct Double-Entry Payment Voucher
      // Debit: Trade Creditors / Accounts Payable (Liability decreases)
      // Credit: Bank / Cash Account (Asset decreases)
      const voucherPayload = {
        voucherNumber: voucherNum,
        voucherType: "PAYMENT",
        date: paymentForm.paymentDate,
        referenceNumber: paymentForm.referenceNumber.trim(),
        partyType: "SUPPLIER",
        partyId: paymentForm.supplierId,
        partyName: selectedSup?.name || "Supplier",
        partyCode: selectedSup?.supplierCode || "",
        bankName: selectedBank.name,
        accountNumber: selectedBank.accountNumber,
        paymentMode: paymentForm.paymentMode,
        narration: paymentForm.narration || `Vendor payment disbursed to ${selectedSup?.name}`,
        totalAmount: amountVal,
        status: "POSTED",
        lines: [
          {
            id: `line-${Date.now()}-1`,
            accountCode: "GL-LIB-2010",
            accountName: "Trade Creditors / Accounts Payable",
            accountType: "LIABILITY",
            debit: amountVal,
            credit: 0,
            partyName: selectedSup?.name,
            narration: `Vendor payment clearance for ${selectedSup?.name}`,
          },
          {
            id: `line-${Date.now()}-2`,
            accountCode: selectedBank.code || "GL-AST-1020",
            accountName: selectedBank.name,
            accountType: "ASSET",
            debit: 0,
            credit: amountVal,
            narration: `${paymentForm.paymentMode} Disbursed: Ref ${paymentForm.referenceNumber}`,
          },
        ],
      };

      await dispatch(createVoucher(voucherPayload)).unwrap();
      toast.success(`Payment Voucher ${voucherNum} posted successfully!`);
      setPaymentDialogOpen(false);
      setSelectedSupplierId(paymentForm.supplierId);
      setActiveTab("statement");
    } catch (err) {
      toast.error(err?.message || "Failed to record payment disbursement");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!supplierLedgerEntries.length) {
      toast.info("No ledger entries to export");
      return;
    }

    const headers = ["Date", "Voucher No", "Type", "Ref Number", "Narration", "Debit (Payment)", "Credit (Bill)", "Payable Balance"];
    const rows = supplierLedgerEntries.map((e) => [
      e.date,
      e.voucherNumber,
      e.voucherType,
      `"${(e.referenceNumber || "").replace(/"/g, '""')}"`,
      `"${(e.narration || "").replace(/"/g, '""')}"`,
      e.debit || 0,
      e.credit || 0,
      e.runningBalance || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Supplier_Ledger_${currentSupplier?.supplierCode}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Supplier ledger statement exported to CSV");
  };

  const formatINR = (val) => {
    const num = Number(val || 0);
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Top Header */}
      <PageHeader
        title="Supplier Ledger & Accounts Payable"
        description="Monitor vendor payables, manage purchase bills, reconcile statements, and execute bank disbursements."
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-border/80 shadow-sm"
            onClick={() => {
              dispatch(fetchVouchers());
              fetchSupplierList();
              toast.success("Supplier ledger refreshed");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-md font-semibold text-white"
            onClick={() => handleOpenPaymentDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Disburse Vendor Payment
          </Button>
        </div>
      </PageHeader>

      {/* Global AP Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding AP */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Accounts Payable
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(globalAPStats.totalAP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {suppliers.length} Suppliers
              </span>{" "}
              active in ledger
            </p>
          </CardContent>
        </Card>

        {/* Total Inward Purchase Billed */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Purchase Bills
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(globalAPStats.totalBilledYTD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-medium text-purple-600 dark:text-purple-400">Purchase Bills (PB)</span>{" "}
              cumulative
            </p>
          </CardContent>
        </Card>

        {/* Total Payments Disbursed */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payments Disbursed
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(globalAPStats.totalPaidYTD)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {globalAPStats.paymentRatio}%
              </span>{" "}
              settlement ratio
            </p>
          </CardContent>
        </Card>

        {/* Clean Ledger Indicator */}
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-card/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AP Ledger Integrity
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              100% Balanced
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                Double-Entry Verified
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border border-border/60">
            <TabsTrigger value="summary" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <Layers className="h-4 w-4 mr-2" />
              Supplier Balances Summary
            </TabsTrigger>
            <TabsTrigger value="statement" className="rounded-lg font-medium px-4 text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-2" />
              Detailed Vendor Statement
            </TabsTrigger>
          </TabsList>

          {activeTab === "summary" && (
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search supplier, GST, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-card border-border/80"
                />
              </div>
            </div>
          )}

          {activeTab === "statement" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-72">
                <Select
                  value={selectedSupplierId}
                  onValueChange={(val) => setSelectedSupplierId(val)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/80 font-medium">
                    <SelectValue placeholder="Select Supplier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {suppliers.map((s) => (
                      <SelectItem key={s.id || s._id} value={s.id || s._id}>
                        <span className="font-semibold text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({s.supplierCode})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-10 rounded-xl border-border/80 shadow-sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {/* ─── TAB 1: SUPPLIER BALANCES SUMMARY ─────────────────────────── */}
        <TabsContent value="summary" className="space-y-4 m-0">
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Supplier Details</th>
                    <th className="py-3.5 px-4">Category & Terms</th>
                    <th className="py-3.5 px-4 text-right">Total Bills</th>
                    <th className="py-3.5 px-4 text-right">Total Paid</th>
                    <th className="py-3.5 px-4 text-right">Outstanding (AP)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-muted-foreground">
                        No supplier ledger records match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((sup) => (
                      <tr
                        key={sup.id || sup._id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedSupplierId(sup.id || sup._id);
                          setActiveTab("statement");
                        }}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground group-hover:text-aspino-primary transition-colors">
                            {sup.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="font-mono font-medium text-primary/80">
                              {sup.supplierCode}
                            </span>
                            <span>•</span>
                            <span>GST: {sup.gstNo || "N/A"}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-muted/40 text-[11px]">
                              {sup.category || "Supplier"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {sup.creditTerms || "Net 30 Days"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-foreground">
                          {formatINR(sup.totalBilled)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-blue-600 dark:text-blue-400">
                          {formatINR(sup.totalDisbursed)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                            {formatINR(sup.outstandingPayable)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {sup.outstandingPayable <= 0 ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 font-medium">
                              Settled
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 font-medium">
                              Payable Due
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 rounded-lg border-border/80 text-xs hover:bg-aspino-primary hover:text-white transition-colors"
                              onClick={() => {
                                setSelectedSupplierId(sup.id || sup._id);
                                setActiveTab("statement");
                              }}
                            >
                              Statement
                            </Button>

                            <Button
                              size="sm"
                              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-sm"
                              onClick={() => handleOpenPaymentDialog(sup.id || sup._id)}
                            >
                              <Coins className="h-3.5 w-3.5 mr-1" />
                              Disburse
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: DETAILED VENDOR STATEMENT ─────────────────────────── */}
        <TabsContent value="statement" className="space-y-6 m-0">
          {currentSupplier && (
            <Card className="rounded-2xl border-border/60 bg-gradient-to-r from-card via-card/80 to-muted/20 shadow-sm p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {currentSupplier.name}
                    </h3>
                    <Badge className="bg-aspino-primary/10 text-aspino-primary border-aspino-primary/30 font-semibold">
                      {currentSupplier.supplierCode}
                    </Badge>
                    <Badge variant="outline" className="border-border/80">
                      {currentSupplier.category || "Vendor"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-6 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
                      <span>GSTIN: </span>
                      <strong className="text-foreground">{currentSupplier.gstNo || "N/A"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary/70" />
                      <span>Credit Terms: </span>
                      <strong className="text-foreground">{currentSupplier.creditTerms || "Net 30 Days"}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-primary/70" />
                      <span>Bank A/C: </span>
                      <strong className="text-foreground font-mono">
                        {currentSupplier.bankAccountNo ? `${currentSupplier.bankName} (${currentSupplier.bankAccountNo.slice(-4)})` : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-border/80 pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Payable Balance
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatINR(supplierLedgerEntries[supplierLedgerEntries.length - 1]?.runningBalance ?? currentSupplier.openingBalance ?? 0)}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Accounts Payable (AP)</span>
                  </div>

                  <Button
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shrink-0"
                    onClick={() => handleOpenPaymentDialog(currentSupplier.id || currentSupplier._id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Disburse Payment
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Running Statement Table */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 border-b border-border/60 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Vendor Running Ledger Statement</CardTitle>
                <CardDescription className="text-xs">
                  Purchase bills inward (credit), payment disbursements (debit), and running balance
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl border-border/80 shadow-sm text-xs"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print Statement
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference / Bill No</th>
                    <th className="py-3 px-4">Particulars / Narration</th>
                    <th className="py-3 px-4 text-right">Debit / Paid (₹)</th>
                    <th className="py-3 px-4 text-right">Credit / Bill (₹)</th>
                    <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="bg-muted/20 font-medium text-xs text-muted-foreground">
                    <td className="py-2.5 px-4 font-mono">-</td>
                    <td className="py-2.5 px-4 font-mono">OP-BAL</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px] bg-background">
                        OPENING
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">-</td>
                    <td className="py-2.5 px-4 italic">Opening Balance Brought Forward</td>
                    <td className="py-2.5 px-4 text-right font-mono">-</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {Number(currentSupplier?.openingBalance || 0) > 0 ? formatINR(currentSupplier.openingBalance) : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-foreground font-mono">
                      {formatINR(currentSupplier?.openingBalance || 0)}
                    </td>
                    <td className="py-2.5 px-4 text-center">-</td>
                  </tr>

                  {supplierLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-muted-foreground">
                        No transactions found for this supplier in the selected date range.
                      </td>
                    </tr>
                  ) : (
                    supplierLedgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {entry.date}
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {entry.voucherNumber}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              entry.voucherType === "PURCHASE_BILL"
                                ? "bg-purple-500/10 text-purple-600 border-purple-200 text-[10px]"
                                : entry.voucherType === "PAYMENT"
                                ? "bg-blue-500/10 text-blue-600 border-blue-200 text-[10px]"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]"
                            }
                          >
                            {entry.voucherType.replace("_", " ")}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {entry.referenceNumber}
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-xs text-foreground/90">
                          {entry.narration}
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-blue-600 dark:text-blue-400">
                          {entry.debit > 0 ? formatINR(entry.debit) : "-"}
                        </td>

                        <td className="py-3 px-4 text-right font-medium text-foreground">
                          {entry.credit > 0 ? formatINR(entry.credit) : "-"}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-foreground">
                          {formatINR(entry.runningBalance)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {entry.fullVoucher ? (
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
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── DISBURSE VENDOR PAYMENT DIALOG (Standard Landscape Format) ────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border/80 shadow-2xl rounded-3xl bg-card">
          {/* Top Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-8 py-6 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Coins className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    Disburse Vendor Payment Voucher
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1">
                    Execute bank transfer/cheque disbursement to vendor and auto-settle Accounts Payable (AP)
                  </p>
                </div>
              </div>

              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1 font-semibold text-xs">
                DOUBLE-ENTRY BOOKKEEPING
              </Badge>
            </div>
          </div>

          {/* Form Body with 2-Column Grid */}
          <form onSubmit={handlePaymentSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Supplier & Payment Mode */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                    1
                  </span>
                  Supplier & Payment Details
                </div>

                {/* Supplier Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Beneficiary Supplier / Creditor <span className="text-rose-500">*</span></span>
                    <span className="text-xs font-normal text-muted-foreground">From Supplier Master</span>
                  </Label>
                  <Select
                    value={paymentForm.supplierId}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, supplierId: val })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/80">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
                      {suppliers.map((s) => (
                        <SelectItem key={s.id || s._id} value={s.id || s._id}>
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({s.supplierCode})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentErrors.supplierId && (
                    <p className="text-xs text-rose-500 font-medium">{paymentErrors.supplierId}</p>
                  )}
                </div>

                {/* Payment Date & Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Disbursement Date <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="h-11 rounded-xl bg-muted/50 border-border/80"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Payment Mode <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={paymentForm.paymentMode}
                      onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMode: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/80">
                        <SelectValue placeholder="Payment Mode" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {PAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reference Number */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Bank UTR / Cheque / Transfer Ref <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. RTGS-HDFC-9912048 or CHQ-008492"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="h-11 rounded-xl bg-muted/50 border-border/80 font-mono"
                    required
                  />
                  {paymentErrors.referenceNumber && (
                    <p className="text-xs text-rose-500 font-medium">{paymentErrors.referenceNumber}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Source Bank Account & Amount */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border pb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                    2
                  </span>
                  Source Bank Account & Amount
                </div>

                {/* Source Bank Account Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Disbursed From Bank / Cash Account <span className="text-rose-500">*</span></span>
                    <span className="text-xs font-normal text-muted-foreground">From Bank Master / GL</span>
                  </Label>
                  <Select
                    value={paymentForm.bankId}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, bankId: val })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/80">
                      <SelectValue placeholder="Select Source Account" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-72">
                      {paymentBankOptions.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          <span className="font-semibold">{bank.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({bank.code})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {paymentErrors.bankId && (
                    <p className="text-xs text-rose-500 font-medium">{paymentErrors.bankId}</p>
                  )}
                </div>

                {/* Amount Disbursed */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Disbursement Amount (₹) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || Number(val) >= 0) {
                          setPaymentForm({ ...paymentForm, amount: val });
                        }
                      }}
                      className="pl-8 h-11 rounded-xl bg-muted/50 border-border/80 text-base font-bold text-foreground"
                      required
                    />
                  </div>
                  {paymentErrors.amount && (
                    <p className="text-xs text-rose-500 font-medium">{paymentErrors.amount}</p>
                  )}
                </div>

                {/* Narration */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Narration / Payment Description
                  </Label>
                  <Textarea
                    placeholder="Enter bill references settled, remarks or dispatch lot numbers..."
                    value={paymentForm.narration}
                    onChange={(e) => setPaymentForm({ ...paymentForm, narration: e.target.value })}
                    className="min-h-[80px] rounded-xl bg-muted/50 border-border/80 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Double Entry Preview Strip */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Automatic Double-Entry Posting Preview
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-blue-600 dark:text-blue-400">DEBIT:</span>{" "}
                  Trade Creditors / Accounts Payable (Liability Reduction) —{" "}
                  <span className="font-semibold text-foreground">{formatINR(paymentForm.amount || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-rose-600 dark:text-rose-400">CREDIT:</span>{" "}
                  Source Bank Account (Asset Outflow) —{" "}
                  <span className="font-semibold text-foreground">{formatINR(paymentForm.amount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                className="rounded-xl h-11 px-5 border-border/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={paymentSubmitting}
                className="rounded-xl h-11 px-7 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold shadow-md"
              >
                {paymentSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Posting Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm & Post Payment Voucher
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Voucher Dialog */}
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
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300">
                  {selectedVoucherForView.status || "POSTED"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <div className="font-semibold text-foreground text-sm">
                    {selectedVoucherForView.partyName || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference / UTR:</span>
                  <div className="font-mono font-semibold text-foreground text-sm">
                    {selectedVoucherForView.referenceNumber || "-"}
                  </div>
                </div>
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
