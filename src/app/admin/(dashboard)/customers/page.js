"use client";

import { useState, useEffect, useMemo } from "react";
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
  DialogFooter,
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
import {
  Plus,
  Users,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  CreditCard,
  FileText,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateCustomerCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const CREDIT_TERM_PRESETS = [
  "Immediate / Advance",
  "Net 7 Days",
  "Net 15 Days",
  "Net 30 Days",
  "Net 45 Days",
  "Net 60 Days",
  "Net 90 Days",
  "Against LC / BL",
  "Custom",
];

const POPULAR_EXPORT_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "United Arab Emirates",
  "Saudi Arabia",
  "Singapore",
  "Australia",
  "Canada",
  "Japan",
  "France",
  "Italy",
  "Netherlands",
  "South Africa",
  "Bangladesh",
  "Sri Lanka",
  "Vietnam",
  "Malaysia",
  "Brazil",
  "Mexico",
  "Other",
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination, Filter & Search States
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL"); // ALL, DOMESTIC, EXPORT
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Metrics overview
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    domesticCustomers: 0,
    exportCustomers: 0,
    activeCustomers: 0,
  });

  // Modal Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [customerCode, setCustomerCode] = useState("");
  const [name, setName] = useState("");
  const [customerType, setCustomerType] = useState("DOMESTIC"); // "DOMESTIC" | "EXPORT"
  const [country, setCountry] = useState("India");
  const [customCountry, setCustomCountry] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [creditTerms, setCreditTerms] = useState("Net 30 Days");
  const [customCreditTerms, setCustomCreditTerms] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch customers from backend
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      if (customerTypeFilter !== "ALL") {
        queryParams.append("type", customerTypeFilter);
      }
      if (statusFilter !== "ALL") {
        queryParams.append("status", statusFilter);
      }

      const res = await fetch(`${API_BASE_URL}/customer?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load customer list");
      }
      const data = await res.json();
      setCustomers(data.data || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);

      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load customer records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize, customerTypeFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchCustomers();
      } else {
        setCurrentPage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset / initialize form
  const resetForm = () => {
    setCustomerCode("");
    setName("");
    setCustomerType("DOMESTIC");
    setCountry("India");
    setCustomCountry("");
    setGstNo("");
    setCreditTerms("Net 30 Days");
    setCustomCreditTerms("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setBillingAddress("");
    setShippingAddress("");
    setSameAsBilling(false);
    setIsActive(true);
    setNotes("");
    setIsCodeManual(false);
    setFieldErrors({});
    setEditingCustomer(null);
    setFormError("");
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    resetForm();
    setIsCodeManual(false);
    setFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setCustomerCode(cust.customerCode || "");
    setName(cust.name || "");
    const type = cust.customerType || (cust.isDomestic ? "DOMESTIC" : "EXPORT");
    setCustomerType(type);

    if (type === "DOMESTIC") {
      setCountry("India");
      setCustomCountry("");
    } else {
      if (POPULAR_EXPORT_COUNTRIES.includes(cust.country)) {
        setCountry(cust.country || "United States");
        setCustomCountry("");
      } else {
        setCountry("Other");
        setCustomCountry(cust.country || "");
      }
    }

    setGstNo(cust.gstNo || "");

    if (CREDIT_TERM_PRESETS.includes(cust.creditTerms)) {
      setCreditTerms(cust.creditTerms || "Net 30 Days");
      setCustomCreditTerms("");
    } else {
      setCreditTerms("Custom");
      setCustomCreditTerms(cust.creditTerms || "");
    }

    setContactPerson(cust.contactPerson || "");
    setPhone(cust.phone || "");
    setEmail(cust.email || "");
    setBillingAddress(cust.billingAddress || "");
    setShippingAddress(cust.shippingAddress || "");
    setSameAsBilling(
      cust.billingAddress && cust.shippingAddress && cust.billingAddress === cust.shippingAddress
    );
    setIsActive(cust.isActive ?? true);
    setNotes(cust.notes || "");
    setIsCodeManual(true);
    setFieldErrors({});
    setFormError("");
    setFormDialogOpen(true);
  };

  // Live customer name change with real-time auto code generation
  const handleNameChange = (val) => {
    setName(val);
    if (fieldErrors.name && val.trim().length >= 2) {
      setFieldErrors((prev) => ({ ...prev, name: null }));
    }
    if (!isCodeManual) {
      const generated = generateCustomerCode(val);
      setCustomerCode(generated);
      if (fieldErrors.customerCode && generated) {
        setFieldErrors((prev) => ({ ...prev, customerCode: null }));
      }
    }
  };

  // Open View Dialog
  const handleOpenView = (cust) => {
    setSelectedCustomer(cust);
    setViewDialogOpen(true);
  };

  // Copy billing address to shipping
  const handleSameAsBillingToggle = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      setShippingAddress(billingAddress);
      if (fieldErrors.shippingAddress) {
        setFieldErrors((prev) => ({ ...prev, shippingAddress: null }));
      }
    }
  };

  // Handle Customer Type Change
  const handleTypeChange = (type) => {
    setCustomerType(type);
    if (type === "DOMESTIC") {
      setCountry("India");
      setCustomCountry("");
    } else {
      if (country === "India" || !country) {
        setCountry("United States");
      }
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    // Customer Code
    if (!customerCode.trim()) {
      errors.customerCode = "Customer Code is required.";
    } else if (!/^[A-Z0-9_-]{2,30}$/i.test(customerCode.trim())) {
      errors.customerCode = "Code must be 2-30 alphanumeric characters.";
    }

    // Customer Name
    if (!name.trim()) {
      errors.name = "Customer / Company Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Customer Name must be at least 2 characters.";
    }

    if (!customerType) {
      errors.customerType = "Customer Type is required.";
    }

    if (customerType === "EXPORT" && country === "Other" && !customCountry.trim()) {
      errors.country = "Please enter the destination country name.";
    }

    // Contact Person Name (NO NUMBERS ALLOWED)
    if (!contactPerson.trim()) {
      errors.contactPerson = "Contact Person name is required.";
    } else if (/[0-9]/.test(contactPerson.trim())) {
      errors.contactPerson = "Numbers are not allowed in Contact Person name.";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(contactPerson.trim())) {
      errors.contactPerson = "Only letters and spaces are allowed in Contact Person.";
    }

    // Mobile / Phone (10 DIGITS ONLY)
    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (!cleanedPhone) {
      errors.phone = "10-digit mobile number is required.";
    } else if (cleanedPhone.length !== 10) {
      errors.phone = `Mobile number must be exactly 10 digits (currently ${cleanedPhone.length}).`;
    } else if (customerType === "DOMESTIC" && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      errors.phone = "Mobile number should start with 6, 7, 8, or 9.";
    }

    // Email Address (Proper regex)
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!emailPattern.test(email.trim())) {
      errors.email = "Please enter a valid email address (e.g. contact@company.com).";
    }

    // GSTIN
    if (customerType === "DOMESTIC") {
      if (!gstNo.trim()) {
        errors.gstNo = "15-digit GSTIN is required.";
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstNo.trim())) {
        errors.gstNo = "Invalid GSTIN format (e.g. 24AAAAA0000A1Z5).";
      }
    } else {
      if (!gstNo.trim()) {
        errors.gstNo = "Tax ID / VAT / Export Code is required.";
      }
    }

    // Credit Terms
    if (!creditTerms) {
      errors.creditTerms = "Credit Terms is required.";
    } else if (creditTerms === "Custom" && !customCreditTerms.trim()) {
      errors.creditTerms = "Please specify custom credit terms.";
    }

    // Addresses
    if (!billingAddress.trim()) {
      errors.billingAddress = "Billing Address is required.";
    }

    if (!shippingAddress.trim()) {
      errors.shippingAddress = "Shipping Address is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      setFormError("Please fix the highlighted fields below.");
      toast.error("Please check highlighted fields.");
      return;
    }

    const finalCountry =
      customerType === "DOMESTIC"
        ? "India"
        : country === "Other"
        ? customCountry.trim() || "International"
        : country;

    const finalCreditTerms =
      creditTerms === "Custom"
        ? customCreditTerms.trim() || "Custom"
        : creditTerms;

    const payload = {
      customerCode: customerCode.trim().toUpperCase(),
      name: name.trim(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      creditTerms: finalCreditTerms,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      customerType,
      isDomestic: customerType === "DOMESTIC",
      country: finalCountry,
      isActive,
      notes: notes.trim() || undefined,
    };

    setFormSubmitting(true);
    try {
      const url = editingCustomer
        ? `${API_BASE_URL}/customer/${editingCustomer.id}`
        : `${API_BASE_URL}/customer`;
      const method = editingCustomer ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save customer record.");
      }

      toast.success(
        editingCustomer
          ? "Customer record updated successfully."
          : "Customer registered successfully."
      );
      setFormDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setFormError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "Failed to save customer record.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Trigger Delete confirmation
  const handleOpenDelete = (cust) => {
    setCustomerToDelete(cust);
    setDeleteConfirmOpen(true);
  };

  // Perform Delete
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/customer/${customerToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      toast.success(data.message || "Customer deleted successfully");
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not delete customer");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!customers.length) {
      toast.error("No customer records to export");
      return;
    }

    const headers = [
      "Customer Code",
      "Customer Name",
      "Type",
      "Country",
      "GST No",
      "Credit Terms",
      "Contact Person",
      "Phone",
      "Email",
      "Billing Address",
      "Shipping Address",
      "Status",
    ];

    const rows = customers.map((c) => [
      `"${c.customerCode || ""}"`,
      `"${c.name || ""}"`,
      `"${c.customerType || (c.isDomestic ? "DOMESTIC" : "EXPORT")}"`,
      `"${c.country || ""}"`,
      `"${c.gstNo || ""}"`,
      `"${c.creditTerms || ""}"`,
      `"${c.contactPerson || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      `"${(c.billingAddress || "").replace(/"/g, '""')}"`,
      `"${(c.shippingAddress || "").replace(/"/g, '""')}"`,
      `"${c.isActive ? "Active" : "Inactive"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer list exported to CSV");
  };

  // Table Columns Definition
  const columns = [
    {
      header: "Customer Info",
      accessorKey: "customerCode",
      cell: (row) => {
        const cust = row?.original || row;
        if (!cust) return null;
        const initials = cust.name
          ? cust.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "CU";

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/60 bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-semibold">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground hover:underline cursor-pointer" onClick={() => handleOpenView(cust)}>
                  {cust.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span className="bg-muted px-1.5 py-0.5 rounded font-medium text-foreground/80">
                  {cust.customerCode}
                </span>
                {cust.contactPerson && (
                  <span>• {cust.contactPerson}</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Type & Country",
      accessorKey: "customerType",
      cell: (row) => {
        const cust = row?.original || row;
        if (!cust) return null;
        const isDom = cust.isDomestic ?? cust.customerType === "DOMESTIC";
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant="outline"
              className={
                isDom
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1"
              }
            >
              {isDom ? (
                <>
                  <Building2 className="h-3 w-3" /> Domestic
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" /> Export
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {cust.country || (isDom ? "India" : "International")}
            </span>
          </div>
        );
      },
    },
    {
      header: "GST No / Tax ID",
      accessorKey: "gstNo",
      cell: (row) => {
        const cust = row?.original || row;
        const gst = cust?.gstNo;
        if (!gst) {
          return <span className="text-xs text-muted-foreground italic">N/A</span>;
        }
        return (
          <div className="flex items-center gap-1 font-mono text-xs bg-muted/60 px-2 py-1 rounded border border-border/60">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate max-w-[140px] font-semibold">{gst}</span>
          </div>
        );
      },
    },
    {
      header: "Credit Terms",
      accessorKey: "creditTerms",
      cell: (row) => {
        const cust = row?.original || row;
        const terms = cust?.creditTerms;
        if (!terms) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <Badge variant="secondary" className="font-normal text-xs flex items-center gap-1 w-fit">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            {terms}
          </Badge>
        );
      },
    },
    {
      header: "Contact",
      accessorKey: "phone",
      cell: (row) => {
        const cust = row?.original || row;
        if (!cust) return null;
        return (
          <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
            {cust.phone ? (
              <span className="flex items-center gap-1 text-foreground/90">
                <Phone className="h-3 w-3 text-primary/70" /> {cust.phone}
              </span>
            ) : null}
            {cust.email ? (
              <span className="flex items-center gap-1 truncate max-w-[160px]">
                <Mail className="h-3 w-3 text-primary/70" /> {cust.email}
              </span>
            ) : null}
            {!cust.phone && !cust.email && <span className="italic">—</span>}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row) => {
        const cust = row?.original || row;
        const active = cust?.isActive ?? true;
        return (
          <Badge
            variant="outline"
            className={
              active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const cust = row?.original || row;
        if (!cust) return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="View Customer Details"
              onClick={() => handleOpenView(cust)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Edit Customer"
              onClick={() => handleOpenEdit(cust)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete Customer"
              onClick={() => handleOpenDelete(cust)}
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
      {/* Page Header */}
      <PageHeader
        title="Customer Master Registry"
        description="Maintain customer registry with GSTIN details, credit terms, domestic/export categorization, and multiple address tracking."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Master Records" },
          { label: "Customer Master" },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Customers
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {metrics.totalCustomers}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Master directory count</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Domestic Clients
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {metrics.domesticCustomers}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Indian GST registered</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Export / Overseas
              </p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {metrics.exportCustomers}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">International buyers</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Globe className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Accounts
              </p>
              <h3 className="text-2xl font-bold mt-1 text-violet-600 dark:text-violet-400">
                {metrics.activeCustomers}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Eligible for transactions</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main DataTable in Card Container */}
      <Card className="border-border/60 shadow-md bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Customer Master Registry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage domestic and export client records, credit terms, and GSTIN profiles
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Customer Type Filter */}
            <Select
              value={customerTypeFilter}
              onValueChange={(val) => {
                setCustomerTypeFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl bg-muted/40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="DOMESTIC">Domestic</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs rounded-xl bg-muted/40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              title="Refresh"
              onClick={fetchCustomers}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 bg-transparent space-y-4">
          {/* Search Input Bar */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search code, name, GST, country, contact..."
              className="pl-9 text-xs h-10 rounded-xl bg-muted/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            isServerSide={true}
            searchable={false}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(p) => setCurrentPage(p)}
            onLimitChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* CREATE / EDIT CUSTOMER DIALOG (WIDE 2-COLUMN LANDSCAPE LAYOUT) */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Top Gradient Banner with Watermark & Glass Badges */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-3 opacity-10">
              <Users className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {editingCustomer ? `Modify Customer Record: ${editingCustomer.name}` : "Register New Customer Master"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Configure corporate identity, tax credentials, credit terms, and facility shipping destinations.
                  </DialogDescription>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2.5">
                <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                  customerType === "DOMESTIC"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-sky-500/20 text-sky-300 border-sky-500/30"
                }`}>
                  {customerType === "DOMESTIC" ? "🇮🇳 Domestic Entity" : "🌐 Export Entity"}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-white/10 text-slate-300 border-white/10"
                }`}>
                  {isActive ? "Status: Active" : "Status: Inactive"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 2-COLUMN WIDE LANDSCAPE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* LEFT COLUMN: Identification & Contacts */}
                <div className="space-y-4">
                  {/* Section 1: Customer Identification & Classification */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        1. Corporate Identification & Classification
                      </h4>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Code */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="customerCode" className="text-xs sm:text-sm font-bold text-foreground">
                          Customer Code *
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            if (name) {
                              const code = generateCustomerCode(name);
                              setCustomerCode(code);
                              setIsCodeManual(false);
                              if (fieldErrors.customerCode) {
                                setFieldErrors((prev) => ({ ...prev, customerCode: null }));
                              }
                            }
                          }}
                          className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                          title="Auto-derive code from customer name"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Auto-derive
                        </button>
                      </div>
                      <Input
                        id="customerCode"
                        placeholder="e.g. CUST-ACME"
                        value={customerCode}
                        onChange={(e) => {
                          setCustomerCode(e.target.value.toUpperCase());
                          setIsCodeManual(true);
                          if (fieldErrors.customerCode) {
                            setFieldErrors((prev) => ({ ...prev, customerCode: null }));
                          }
                        }}
                        className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold ${
                          fieldErrors.customerCode
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                      {fieldErrors.customerCode && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.customerCode}
                        </p>
                      )}
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm font-bold text-foreground">
                        Customer / Company Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. Acme Pharmaceuticals Pvt Ltd"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                          fieldErrors.name
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Domestic / Export Flag */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-bold text-foreground">
                        Domestic / Export Flag *
                      </Label>
                      <Select value={customerType} onValueChange={handleTypeChange}>
                        <SelectTrigger className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOMESTIC" className="text-xs sm:text-sm">
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-emerald-600" /> Domestic (India)
                            </span>
                          </SelectItem>
                          <SelectItem value="EXPORT" className="text-xs sm:text-sm">
                            <span className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-sky-600" /> Export / International
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-xs sm:text-sm font-bold text-foreground">
                        Destination Country {customerType === "EXPORT" && "*"}
                      </Label>
                      {customerType === "DOMESTIC" ? (
                        <Input
                          id="country"
                          value="India"
                          disabled
                          className="bg-muted/70 text-muted-foreground text-xs sm:text-sm h-11 rounded-xl border-border cursor-not-allowed"
                        />
                      ) : (
                        <div className="space-y-2">
                          <Select
                            value={country}
                            onValueChange={(val) => {
                              setCountry(val);
                              if (fieldErrors.country) {
                                setFieldErrors((prev) => ({ ...prev, country: null }));
                              }
                            }}
                          >
                            <SelectTrigger className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border">
                              <SelectValue placeholder="Select Destination Country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-52">
                              {POPULAR_EXPORT_COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs sm:text-sm">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {country === "Other" && (
                            <Input
                              placeholder="Type country name..."
                              value={customCountry}
                              onChange={(e) => {
                                setCustomCountry(e.target.value);
                                if (fieldErrors.country) {
                                  setFieldErrors((prev) => ({ ...prev, country: null }));
                                }
                              }}
                              className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                                fieldErrors.country ? "border-red-500" : "border-border"
                              }`}
                            />
                          )}
                          {fieldErrors.country && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {fieldErrors.country}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Person & Communication */}
                <div className="border rounded-2xl p-5 bg-muted/20 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <Mail className="h-4.5 w-4.5 text-sky-600" />
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      2. Primary Contact & Communications
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Contact Person */}
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson" className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">
                        Contact Person *
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="contactPerson"
                          placeholder="e.g. Rajesh Sharma"
                          value={contactPerson}
                          onKeyDown={(e) => {
                            if (/[0-9]/.test(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[0-9]/g, "");
                            setContactPerson(cleaned);
                            if (fieldErrors.contactPerson && cleaned.trim()) {
                              setFieldErrors((prev) => ({ ...prev, contactPerson: null }));
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 pl-10 rounded-xl bg-muted/50 ${
                            fieldErrors.contactPerson
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                      </div>
                      {fieldErrors.contactPerson && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.contactPerson}
                        </p>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">
                        Mobile *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="phone"
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={phone}
                          onKeyDown={(e) => {
                            if (
                              ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) ||
                              e.ctrlKey ||
                              e.metaKey
                            ) {
                              return;
                            }
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const numeric = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setPhone(numeric);
                            if (fieldErrors.phone) {
                              if (numeric.length === 10 && (customerType !== "DOMESTIC" || /^[6-9]\d{9}$/.test(numeric))) {
                                setFieldErrors((prev) => ({ ...prev, phone: null }));
                              }
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 pl-10 rounded-xl bg-muted/50 ${
                            fieldErrors.phone
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="e.g. accounts@acme.com"
                          value={email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEmail(val);
                            if (fieldErrors.email) {
                              if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim())) {
                                setFieldErrors((prev) => ({ ...prev, email: null }));
                              }
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 pl-10 rounded-xl bg-muted/50 ${
                            fieldErrors.email
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Tax, Terms, Addresses & Status */}
              <div className="space-y-5">
                {/* Section 3: Tax Credentials & Credit Terms */}
                <div className="border rounded-2xl p-5 bg-muted/20 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <CreditCard className="h-4.5 w-4.5 text-sky-600" />
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      3. Tax Credentials & Credit Agreements
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* GSTIN / Tax ID */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gstNo" className="text-xs sm:text-sm font-bold text-foreground">
                          {customerType === "DOMESTIC" ? "GST No. (GSTIN) *" : "Tax ID / VAT / Export Code *"}
                        </Label>
                        {customerType === "DOMESTIC" && (
                          <span className="text-xs text-muted-foreground font-normal">e.g. 24AAAAA0000A1Z5</span>
                        )}
                      </div>
                      <Input
                        id="gstNo"
                        placeholder={
                          customerType === "DOMESTIC"
                            ? "15-digit GSTIN number"
                            : "Overseas Tax Identifier / VAT"
                        }
                        className={`font-mono uppercase text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                          fieldErrors.gstNo
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                        value={gstNo}
                        onChange={(e) => {
                          setGstNo(e.target.value.toUpperCase());
                          if (fieldErrors.gstNo) {
                            setFieldErrors((prev) => ({ ...prev, gstNo: null }));
                          }
                        }}
                      />
                      {fieldErrors.gstNo && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.gstNo}
                        </p>
                      )}
                    </div>

                    {/* Credit Terms */}
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-bold text-foreground">Credit Terms *</Label>
                      <Select
                        value={creditTerms}
                        onValueChange={(val) => {
                          setCreditTerms(val);
                          if (fieldErrors.creditTerms) {
                            setFieldErrors((prev) => ({ ...prev, creditTerms: null }));
                          }
                        }}
                      >
                        <SelectTrigger className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                          fieldErrors.creditTerms ? "border-red-500" : "border-border"
                        }`}>
                          <SelectValue placeholder="Select Credit Term" />
                        </SelectTrigger>
                        <SelectContent className="max-h-52">
                          {CREDIT_TERM_PRESETS.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs sm:text-sm">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {creditTerms === "Custom" && (
                        <Input
                          placeholder="e.g. 50% Advance, 50% Against BL"
                          value={customCreditTerms}
                          onChange={(e) => {
                            setCustomCreditTerms(e.target.value);
                            if (fieldErrors.creditTerms) {
                              setFieldErrors((prev) => ({ ...prev, creditTerms: null }));
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 mt-1.5 ${
                            fieldErrors.creditTerms ? "border-red-500" : "border-border"
                          }`}
                        />
                      )}
                      {fieldErrors.creditTerms && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.creditTerms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Billing & Shipping Addresses */}
                <div className="border rounded-2xl p-5 bg-muted/20 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4.5 w-4.5 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        4. Addresses
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-xl border border-border/50">
                      <Switch
                        id="sameAsBilling"
                        checked={sameAsBilling}
                        onCheckedChange={handleSameAsBillingToggle}
                        className="scale-90"
                      />
                      <Label htmlFor="sameAsBilling" className="text-xs cursor-pointer font-medium">
                        Shipping same as Billing
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Billing Address */}
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress" className="text-xs sm:text-sm font-bold text-foreground">
                        Billing Address *
                      </Label>
                      <Textarea
                        id="billingAddress"
                        rows={3}
                        placeholder="Registered corporate / billing address..."
                        value={billingAddress}
                        onChange={(e) => {
                          setBillingAddress(e.target.value);
                          if (sameAsBilling) {
                            setShippingAddress(e.target.value);
                          }
                          if (fieldErrors.billingAddress) {
                            setFieldErrors((prev) => ({ ...prev, billingAddress: null }));
                          }
                        }}
                        className={`text-xs sm:text-sm rounded-xl bg-muted/50 min-h-[90px] ${
                          fieldErrors.billingAddress
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                      {fieldErrors.billingAddress && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.billingAddress}
                        </p>
                      )}
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress" className="text-xs sm:text-sm font-bold text-foreground">
                        Shipping Address (Delivery Destination) *
                      </Label>
                      <Textarea
                        id="shippingAddress"
                        rows={3}
                        placeholder="Warehouse or delivery plant location..."
                        value={shippingAddress}
                        onChange={(e) => {
                          setShippingAddress(e.target.value);
                          if (fieldErrors.shippingAddress) {
                            setFieldErrors((prev) => ({ ...prev, shippingAddress: null }));
                          }
                        }}
                        disabled={sameAsBilling}
                        className={`text-xs sm:text-sm rounded-xl bg-muted/50 min-h-[90px] ${
                          fieldErrors.shippingAddress
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                      {fieldErrors.shippingAddress && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.shippingAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5: Remarks & Active Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center border rounded-2xl p-4 bg-muted/20 shadow-sm">
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs sm:text-sm font-bold text-foreground">
                      Internal Remarks / Notes
                    </Label>
                    <Input
                      id="notes"
                      placeholder="e.g. Special dispatch instructions"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-xs sm:text-sm h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 border border-border/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="customer-active-switch" className="text-xs sm:text-sm font-bold text-foreground cursor-pointer">
                        Active Account Status
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? "Active (Usable in passes)" : "Inactive"}
                      </p>
                    </div>
                    <Switch
                      id="customer-active-switch"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
              disabled={formSubmitting}
              className="h-10 text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-7 rounded-xl shadow-lg shadow-sky-600/20"
            >
              {formSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingCustomer ? "Save Changes" : "Register Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

      {/* VIEW CUSTOMER PROFILE MODAL (WIDE LANDSCAPE LAYOUT) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-5xl xl:max-w-6xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {selectedCustomer && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Header Gradient Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
                <div className="absolute right-8 top-3 opacity-10">
                  <Users className="h-28 w-28" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white/20 shadow-xl shrink-0">
                      <AvatarFallback className="bg-sky-600 text-white font-black text-lg">
                        {selectedCustomer.name
                          ? selectedCustomer.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "CU"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {selectedCustomer.name}
                        </h3>
                        <span className="font-mono text-xs font-bold text-sky-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-lg">
                          {selectedCustomer.customerCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Registered on:{" "}
                        <span className="font-semibold text-slate-100">
                          {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                      selectedCustomer.customerType === "DOMESTIC"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-sky-500/20 text-sky-300 border-sky-500/30"
                    }`}>
                      {selectedCustomer.customerType === "DOMESTIC" ? "🇮🇳 Domestic Entity" : "🌐 Export Entity"}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                      selectedCustomer.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-white/10 text-slate-300 border-white/10"
                    }`}>
                      {selectedCustomer.isActive ? "Status: Active" : "Status: Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Content Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Key Identifiers */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Entity & Taxation Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">GSTIN / Tax ID</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedCustomer.gstNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">PAN / Corporate Tax</span>
                        <span className="font-mono font-bold text-foreground mt-0.5 block">
                          {selectedCustomer.panNumber || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Credit Limit</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {selectedCustomer.creditLimit ? `₹ ${Number(selectedCustomer.creditLimit).toLocaleString()}` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Credit Period</span>
                        <span className="font-bold text-foreground mt-0.5 block">
                          {selectedCustomer.creditPeriodDays ? `${selectedCustomer.creditPeriodDays} Days` : "Immediate"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Contact Person */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <UserCheck className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Primary Liaison & Contacts
                      </h4>
                    </div>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block font-medium">Contact Person</span>
                        <span className="font-bold text-foreground mt-0.5 block">
                          {selectedCustomer.contactPerson || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">Email Address</span>
                          <span className="font-medium text-foreground mt-0.5 block truncate">
                            {selectedCustomer.email || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block font-medium">Phone / Mobile</span>
                          <span className="font-medium text-foreground mt-0.5 block font-mono">
                            {selectedCustomer.phone || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Facility Addresses
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        Billing / Headquarter Address
                      </span>
                      <p className="text-foreground font-medium mt-1 leading-relaxed">
                        {selectedCustomer.billingAddress || "No billing address recorded."}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        Shipping / Delivery Plant Destination
                      </span>
                      <p className="text-foreground font-medium mt-1 leading-relaxed">
                        {selectedCustomer.shippingAddress || "No shipping address recorded."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 3: Notes if present */}
                {selectedCustomer.notes && (
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-1 text-xs sm:text-sm shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Internal Remarks & Notes
                    </span>
                    <p className="text-foreground font-medium mt-1 leading-relaxed">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-3.5 border-t border-border/40 bg-muted/10 shrink-0 flex flex-row items-center justify-end">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="h-10 text-xs sm:text-sm font-bold rounded-xl px-6"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete customer "${customerToDelete?.name}" (${customerToDelete?.customerCode})? This action cannot be undone.`}
        confirmText="Delete Customer"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
