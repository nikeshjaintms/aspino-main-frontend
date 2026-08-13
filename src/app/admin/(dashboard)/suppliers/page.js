"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Download,
  Truck,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Star,
  Building2,
  UserCheck,
  Globe,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  AlertCircle,
  History as HistoryIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Reusable Interactive Star Rating Component
function StarRating({ value, onChange, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(null);
  
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 cursor-pointer transition-all duration-150 ${
            (hoverValue !== null ? star <= hoverValue : star <= value)
              ? "text-amber-500 fill-amber-500 scale-110"
              : "text-muted-foreground/30 fill-transparent hover:text-amber-400"
          } ${disabled ? "pointer-events-none" : ""}`}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => !disabled && setHoverValue(null)}
          onClick={() => !disabled && onChange(star)}
        />
      ))}
      <span className="ml-2 font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {value ? Number(value).toFixed(1) : "0.0"} / 5.0
      </span>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search States
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Metrics state variables populated from backend
  const [totalVendors, setTotalVendors] = useState(0);
  const [approvedVendors, setApprovedVendors] = useState(0);
  const [avgRating, setAvgRating] = useState("5.00");
  const [totalCategories, setTotalCategories] = useState(0);

  // Modals state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("general");

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Validation State
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form Fields State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [approvedCategories, setApprovedCategories] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("Approved");
  const [bankId, setBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [rating, setRating] = useState(5);
  const [history, setHistory] = useState("");

  // Fetch Banks from NestJS backend (for select dropdown)
  const fetchBanks = async () => {
    try {
      const banksRes = await fetch(`${API_BASE_URL}/bank`);
      if (!banksRes.ok) return;
      const banksData = await banksRes.json();
      const list = Array.isArray(banksData) ? banksData : (Array.isArray(banksData?.data) ? banksData.data : []);
      const activeBanks = list.filter(b => b?.isActive);
      setBanks(activeBanks);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  // Fetch Suppliers from NestJS backend
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      const res = await fetch(`${API_BASE_URL}/supplier?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load suppliers listing");
      const data = await res.json();
      setSuppliers(data.data || []);
      setTotalVendors(data.total || 0);
      setApprovedVendors(data.totalApproved || 0);
      setAvgRating(Number(data.averageRating || 5.0).toFixed(2));
      setTotalCategories(data.totalCategories || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync records with database backend.");
    } finally {
      setLoading(false);
    }
  };

  // Load banks once on mount
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banksRes = await fetch(`${API_BASE_URL}/bank`);
        if (!banksRes.ok) return;
        const banksData = await banksRes.json();
        const list = Array.isArray(banksData) ? banksData : (Array.isArray(banksData?.data) ? banksData.data : []);
        const activeBanks = list.filter((b) => b?.isActive);
        setBanks(activeBanks);
      } catch (error) {
        console.error("Error loading banks:", error);
      }
    };
    loadBanks();
  }, []);

  // Refetch suppliers when pagination/search state updates
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: pageSize,
        });
        if (search.trim()) {
          queryParams.append("search", search.trim());
        }
        const res = await fetch(`${API_BASE_URL}/supplier?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to load suppliers listing");
        const data = await res.json();
        setSuppliers(data.data || []);
        setTotalVendors(data.total || 0);
        setApprovedVendors(data.totalApproved || 0);
        setAvgRating(Number(data.averageRating || 5.0).toFixed(2));
        setTotalCategories(data.totalCategories || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error(error);
        toast.error("Failed to sync records with database backend.");
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, [currentPage, pageSize, search]);

  // Backward compatibility wrapper for delete/create refetches
  const fetchData = async () => {
    await fetchSuppliers();
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setAddress("");
    setGstNo("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setApprovedCategories("");
    setApprovalStatus("Approved");
    setBankId("");
    setAccountNumber("");
    setIfscCode("");
    setAccountName("");
    setRating(5);
    setHistory("");
  };

  const handleAddClick = () => {
    setEditingSupplier(null);
    resetForm();
    // Auto generate code suggestion based on current count
    const nextNum = suppliers.length + 1;
    setCode(`SUP-2026-${String(nextNum).padStart(3, "0")}`);
    setFormDialogOpen(true);
  };

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setCode(supplier.code || "");
    setName(supplier.name || "");
    setAddress(supplier.address || "");
    setGstNo(supplier.gstNo || "");
    setContactPerson(supplier.contactPerson || "");
    setPhone(supplier.phone || "");
    setEmail(supplier.email || "");
    setApprovedCategories(supplier.approvedCategories ? supplier.approvedCategories.join(", ") : "");
    setApprovalStatus(supplier.approvalStatus || "Approved");
    setBankId(supplier.bankId ? String(supplier.bankId) : "");
    setAccountNumber(supplier.accountNumber || "");
    setIfscCode(supplier.ifscCode || "");
    setAccountName(supplier.accountName || "");
    setRating(Number(supplier.rating || 5));
    setHistory(supplier.history || "");
    setFormDialogOpen(true);
  };

  const promptDeleteSupplier = (id) => {
    setSupplierToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/supplier/${supplierToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete supplier");
      toast.success("Supplier removed from master registry.");
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error removing supplier from registry.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setActiveDetailTab("general");
    setViewDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const errors = {};

    // 1. Supplier Code
    if (!code.trim()) {
      errors.code = "Supplier Code is required.";
    } else if (code.trim().length < 2) {
      errors.code = "Supplier Code must be at least 2 characters.";
    }

    // 2. Supplier Name
    if (!name.trim()) {
      errors.name = "Company / Supplier Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Supplier Name must be at least 2 characters.";
    }

    // 3. Physical Address
    if (!address.trim()) {
      errors.address = "Physical Address / Plant Location is required.";
    }

    // 4. Contact Person
    if (!contactPerson.trim()) {
      errors.contactPerson = "Contact Person Name is required.";
    }

    // 5. Email Address
    if (!email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    // 6. Phone Number
    if (!phone.trim()) {
      errors.phone = "Phone Number is required.";
    } else if (!/^\d{10}$/.test(phone.trim())) {
  errors.phone = "Please enter a valid 10-digit phone number.";
}

    // 7. GST No
    if (!gstNo.trim()) {
      errors.gstNo = "GST / Tax Registration No. is required.";
    } else if (gstNo.trim().length < 8) {
      errors.gstNo = "Invalid GST Number format.";
    }

    // 8. Approved Categories
    if (!approvedCategories.trim()) {
      errors.approvedCategories = "Approved Material Categories are required.";
    }

    // 9. Bank Selection
    if (!bankId) {
      errors.bankId = "Bank Institution selection is required.";
    }

    // 10. Account Name
    if (!accountName.trim()) {
      errors.accountName = "Account Holder Name is required.";
    }

    // 11. Account Number
    if (!accountNumber.trim()) {
      errors.accountNumber = "Account Number is required.";
    }

    // 12. IFSC Code
    if (!ifscCode.trim()) {
      errors.ifscCode = "IFSC Code is required.";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim())) {
      errors.ifscCode = "Invalid IFSC Code format (e.g. HDFC0001234).";
    }

    // 13. Audit History / Remarks
    if (!history.trim()) {
      errors.history = "Audit History / Performance Remarks are required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("All fields are required. Please fix the highlighted fields in red below.");
      toast.error("All fields are required. Please check highlighted fields.");
      return;
    }

    const parsedCategories = approvedCategories
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const supplierPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      approvedCategories: parsedCategories,
      approvalStatus,
      bankId: bankId ? bankId : null,
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountName: accountName.trim(),
      rating: parseFloat(rating) || 5.0,
      history: history.trim(),
    };

    try {
      const url = editingSupplier ? `${API_BASE_URL}/supplier/${editingSupplier.id}` : `${API_BASE_URL}/supplier`;
      const method = editingSupplier ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to save supplier");
        throw new Error(errorMsg);
      }

      toast.success(editingSupplier ? "Supplier master record updated!" : "New supplier registered successfully!");
      setFormDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      const res = await fetch(`${API_BASE_URL}/supplier?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load suppliers for export");
      const fullSuppliers = await res.json();

      const headers = [
        "Supplier Code",
        "Company Name",
        "GST/Tax No.",
        "Contact Person",
        "Phone",
        "Email",
        "Address",
        "Approved Categories",
        "Approval Status",
        "Bank Name",
        "Account Number",
        "IFSC Code",
        "Rating",
        "Performance History",
      ];

      const rows = fullSuppliers.map((s) => [
        s.code,
        s.name,
        s.gstNo,
        s.contactPerson,
        s.phone,
        s.email,
        s.address,
        s.approvedCategories.join("; "),
        s.approvalStatus,
        s.bank?.name || "",
        s.accountNumber || "",
        s.ifscCode || "",
        s.rating,
        s.history,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          headers.join(","),
          ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SupplierMaster_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV file downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export supplier directory.");
    }
  };

  const columns = [
    {
      accessorKey: "code",
      header: "Code / Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/10 shadow-xs shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white text-xs font-bold">
              {row.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md">
                {row.code}
              </span>
            </div>
            <p className="font-bold text-sm text-foreground mt-1">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "gstNo",
      header: "Tax / GST No.",
      cell: (row) => <span className="font-mono text-xs font-bold text-muted-foreground">{row.gstNo}</span>,
    },
    {
      accessorKey: "contactPerson",
      header: "Primary Contact",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-xs">{row.contactPerson}</div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            {row.email}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            {row.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "approvedCategories",
      header: "Approved Categories",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.approvedCategories.map((cat, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-bold px-1.5 py-0 bg-muted text-muted-foreground border border-border">
              {cat}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: (row) => (
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-xs text-amber-400">{row.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Approval Status",
      cell: (row) => {
        let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (row.approvalStatus === "Pending") {
          badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        } else if (row.approvalStatus === "Suspended") {
          badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
        }
        return (
          <Badge variant="outline" className={`font-bold text-[10px] px-2 py-0.5 ${badgeStyle}`}>
            {row.approvalStatus}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShowDetails(row)}
            className="h-8 text-xs font-bold text-sky-400 border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-300 rounded-lg gap-1 px-2.5 transition-colors"
            title="Show details"
          >
            <Eye className="h-3.5 w-3.5" />
            Show
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditClick(row)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Edit Supplier"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteSupplier(row.id)}
            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Supplier"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Master Registry"
        description="Configure certified vendors, tax details, material classifications, and compliance ratings"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Master Records" },
          { label: "Supplier Master" },
        ]}
      >
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-xs rounded-xl font-bold gap-1.5 border-slate-200">
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </Button> */}
          <Button
            size="sm"
            onClick={handleAddClick}
            className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </PageHeader>

      {/* Modern Dashboard Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendors */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Suppliers</p>
              <h3 className="text-3xl font-extrabold text-foreground">{totalVendors}</h3>
              <p className="text-[10px] text-muted-foreground">Registered partners in ERP</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Truck className="h-6 w-6 text-sky-400" />
            </div>
          </CardContent>
        </Card>

        {/* Approved Vendors */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Approved Status</p>
              <h3 className="text-3xl font-extrabold text-foreground">{approvedVendors}</h3>
              <p className="text-[10px] text-muted-foreground">Active certified vendors</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Rating</p>
              <h3 className="text-3xl font-extrabold text-foreground">{avgRating}</h3>
              <p className="text-[10px] text-muted-foreground">Procurement quality average</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Material Categories */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Material Classes</p>
              <h3 className="text-3xl font-extrabold text-foreground">{totalCategories}</h3>
              <p className="text-[10px] text-muted-foreground">Approved supply categories</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Datatable */}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchPlaceholder="Search by Name, Code, Tax ID, Categories..."
        emptyMessage="No supplier records found"
        emptyDescription="Create a new supplier master entry by clicking Add Supplier."
        isServerSide={true}
        totalCount={totalVendors}
        totalPages={totalPages}
        currentPage={currentPage}
        searchQuery={search}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onLimitChange={(limit) => {
          setPageSize(limit);
          setCurrentPage(1);
        }}
        onSearchQueryChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
      />

      {/* Dialog 1: Add / Edit Supplier Form */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Building2 className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  {editingSupplier ? `Modify Master Record: ${editingSupplier.name}` : "Register New Supplier Master"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Configure supplier codes, billing credentials, compliance settings, and financial routing.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-card">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs font-bold shadow-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Row 1: Profile & Categories */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                <Building2 className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Profile Settings</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-bold text-foreground">Supplier Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
                    }}
                    placeholder="e.g. SUP-2026-001"
                    className={`text-xs h-10 rounded-xl bg-muted/50 font-mono font-bold ${
                      fieldErrors.code ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.code && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.code}
                    </p>
                  )}
                </div>

                {/* Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-foreground">Company Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. Reliance Chemical Industries Ltd"
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-bold text-foreground">Physical Address / Plant Location *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: null }));
                  }}
                  placeholder="Plot number, industrial estate, city, state, country - postal code"
                  className={`text-xs h-10 rounded-xl bg-slate-50 border-slate-200 ${
                    fieldErrors.address ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-sky-500"
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Contact Person */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactPerson" className="text-xs font-bold text-foreground">Contact Person Name *</Label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onKeyDown={(e) => {
                        // Block digits — names must not contain numbers
                        if (/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => {
                        // Strip any digits that may arrive via paste
                        const cleaned = e.target.value.replace(/[0-9]/g, "");
                        setContactPerson(cleaned);
                        if (fieldErrors.contactPerson) setFieldErrors((prev) => ({ ...prev, contactPerson: null }));
                      }}
                      placeholder="e.g. Amit Patel"
                      className={`text-xs h-10 pl-9 rounded-xl bg-slate-50 border-slate-200 ${
                        fieldErrors.contactPerson ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-sky-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.contactPerson && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.contactPerson}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="e.g. sales@vendor.com"
                      className={`text-xs h-10 pl-9 rounded-xl bg-slate-50 border-slate-200 ${
                        fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-sky-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-foreground">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                    <Input
                      id="phone"
                      value={phone}
                      maxLength={10}
                      onKeyDown={(e) => {
                        const isControl = e.ctrlKey || e.metaKey || [
                          "Backspace", "Delete", "Tab", "Enter", "ArrowLeft",
                          "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
                        ].includes(e.key);
                        if (!isControl && !/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(cleaned);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      placeholder="e.g. 9876543210"
                      className={`text-xs h-10 pl-9 rounded-xl bg-slate-50 border-slate-200 ${
                        fieldErrors.phone ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-sky-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Tax, Category & Status */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                <Globe className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Taxation & Classifications</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GST Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="gstNo" className="text-xs font-bold text-slate-700">GST/Tax Registration No. *</Label>
                  <Input
                    id="gstNo"
                    value={gstNo}
                    onChange={(e) => {
                      setGstNo(e.target.value);
                      if (fieldErrors.gstNo) setFieldErrors((prev) => ({ ...prev, gstNo: null }));
                    }}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className={`text-xs h-10 rounded-xl bg-muted/50 font-mono font-semibold ${
                      fieldErrors.gstNo ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.gstNo && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.gstNo}
                    </p>
                  )}
                </div>

                {/* Approved Material Categories */}
                <div className="space-y-1.5">
                  <Label htmlFor="approvedCategories" className="text-xs font-bold text-foreground">Approved Material Categories *</Label>
                  <Input
                    id="approvedCategories"
                    value={approvedCategories}
                    onChange={(e) => {
                      setApprovedCategories(e.target.value);
                      if (fieldErrors.approvedCategories) setFieldErrors((prev) => ({ ...prev, approvedCategories: null }));
                    }}
                    placeholder="Solvents, Acids, Packaging (comma separated)"
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.approvedCategories ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.approvedCategories && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.approvedCategories}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Financial Routing & Bank Dropdown */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Details & Financial Routing</h4>
                </div>
                <Link href="/admin/banks" target="_blank" className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Manage Bank Master
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Bank Name Dropdown */}
                <div className="space-y-1.5">
                  <Label htmlFor="bankId" className="text-xs font-bold text-foreground">Bank Name *</Label>
                  <Select value={bankId} onValueChange={(val) => {
                    setBankId(val);
                    if (fieldErrors.bankId) setFieldErrors((prev) => ({ ...prev, bankId: null }));
                  }}>
                    <SelectTrigger id="bankId" className={`h-10 text-xs rounded-xl bg-muted/50 ${
                      fieldErrors.bankId ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                    }`}>
                      <SelectValue placeholder="Select Corporate Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.length === 0 ? (
                        <div className="py-2 px-3 text-xs text-muted-foreground italic">No active banks in master.</div>
                      ) : (
                        banks.map((bank) => (
                          <SelectItem key={bank.id} value={String(bank.id)}>
                            {bank.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.bankId && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.bankId}
                    </p>
                  )}
                </div>

                {/* Account Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="accountName" className="text-xs font-bold text-foreground">Account Holder Name *</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onKeyDown={(e) => {
                      // Block digits — account holder name must contain only letters
                      if (/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      // Strip any digits that may arrive via paste
                      const cleaned = e.target.value.replace(/[0-9]/g, "");
                      setAccountName(cleaned);
                      if (fieldErrors.accountName) setFieldErrors((prev) => ({ ...prev, accountName: null }));
                    }}
                    placeholder="e.g. PharmaCorp Ltd"
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.accountName ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.accountName && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.accountName}
                    </p>
                  )}
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-xs font-bold text-foreground">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      if (fieldErrors.accountNumber) setFieldErrors((prev) => ({ ...prev, accountNumber: null }));
                    }}
                    placeholder="e.g. 50100223344"
                    className={`text-xs h-10 rounded-xl bg-slate-50 font-mono ${
                      fieldErrors.accountNumber ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.accountNumber && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.accountNumber}
                    </p>
                  )}
                </div>

                {/* IFSC Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="ifscCode" className="text-xs font-bold text-foreground">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={ifscCode}
                    onChange={(e) => {
                      setIfscCode(e.target.value);
                      if (fieldErrors.ifscCode) setFieldErrors((prev) => ({ ...prev, ifscCode: null }));
                    }}
                    placeholder="e.g. HDFC0000123"
                    className={`text-xs h-10 rounded-xl bg-slate-50 font-mono ${
                      fieldErrors.ifscCode ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.ifscCode && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.ifscCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Quality Performance Rating & History */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                <HistoryIcon className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Performance & Rating</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Custom Star Rating Component */}
                <div className="sm:col-span-1 space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Quality Rating Score</Label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* Audit log / History */}
                <div className="sm:col-span-3 space-y-1.5">
                  <Label htmlFor="history" className="text-xs font-bold text-foreground">Audit History / Performance Remarks *</Label>
                  <Textarea
                    id="history"
                    rows={2}
                    value={history}
                    onChange={(e) => {
                      setHistory(e.target.value);
                      if (fieldErrors.history) setFieldErrors((prev) => ({ ...prev, history: null }));
                    }}
                    placeholder="Provide details on delivery promptness, raw material quality, audit remarks, etc."
                    className={`text-xs rounded-xl bg-muted/50 ${
                      fieldErrors.history ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.history && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.history}
                    </p>
                  )}
                </div>
                </div>
              </div>
            {/* </div> */}

            {/* Active Status Switch at the bottom */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="space-y-0.5">
                  <Label htmlFor="supplier-status-switch" className="text-xs font-bold text-foreground">Active Status</Label>
                  <p className="text-[10px] text-muted-foreground">Allow this supplier to be active in ERP procurement workflows</p>
                </div>
                <Switch
                  id="supplier-status-switch"
                  checked={approvalStatus === "Approved"}
                  onCheckedChange={(checked) => setApprovalStatus(checked ? "Approved" : "Suspended")}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="h-10 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {editingSupplier ? "Save Changes" : "Register Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: View Detailed Supplier Profile */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="lg:max-w-3xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          {selectedSupplier && (
            <div>
              {/* Header block */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white/20 shadow-xl shrink-0">
                    <AvatarFallback className="bg-sky-600 text-white font-bold text-lg">
                      {selectedSupplier.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      {selectedSupplier.name}
                      <span className="font-mono text-[10px] font-bold text-sky-300 bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-md">
                        {selectedSupplier.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      GST/Tax No: <span className="font-mono text-slate-100 font-bold">{selectedSupplier.gstNo}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-border/50 bg-muted/30 px-4">
                {[
                  { id: "general", label: "Profile" },
                  { id: "tax_bank", label: "Financials" },
                  { id: "materials", label: "Materials" },
                  { id: "history", label: "Audit & Rating" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`py-3 px-4 text-xs font-bold transition-all border-b-2 ${
                      activeDetailTab === tab.id
                        ? "border-sky-500 text-sky-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="p-6 bg-card text-xs min-h-[220px]">
                {/* General Info */}
                {activeDetailTab === "general" && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Contact</div>
                        <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-sky-600 shrink-0" />
                          {selectedSupplier.contactPerson || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approval Status</div>
                        <div className="mt-1">
                          {selectedSupplier.approvalStatus === "Approved" && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                              <ShieldCheck className="h-3 w-3" /> Approved
                            </Badge>
                          )}
                          {selectedSupplier.approvalStatus === "Pending" && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
                              <ShieldAlert className="h-3 w-3" /> Pending Review
                            </Badge>
                          )}
                          {selectedSupplier.approvalStatus === "Suspended" && (
                            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1 w-fit">
                              <ShieldAlert className="h-3 w-3" /> Suspended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</div>
                        <div className="text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          {selectedSupplier.phone || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</div>
                        <div className="text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          {selectedSupplier.email || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location / Plant Address</div>
                      <div className="text-muted-foreground font-medium mt-1 flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{selectedSupplier.address || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tax & Banking */}
                {activeDetailTab === "tax_bank" && (
                  <div className="space-y-4">
                    <div className="bg-muted/40 p-3 rounded-2xl border border-border/40">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST/Tax Registration Number</div>
                      <div className="text-sm font-mono font-bold text-foreground mt-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                        {selectedSupplier.gstNo || "N/A"}
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Settlement Bank Details</div>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Bank Name</div>
                          <div className="font-semibold text-foreground">{selectedSupplier.bank?.name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Account Name</div>
                          <div className="font-semibold text-foreground">{selectedSupplier.accountName || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Account Number</div>
                          <div className="font-mono font-bold text-foreground">{selectedSupplier.accountNumber || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">IFSC Code</div>
                          <div className="font-mono font-bold text-foreground">{selectedSupplier.ifscCode || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Material Categories */}
                {activeDetailTab === "materials" && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Procurement Classifications</div>
                    <p className="text-slate-500">The supplier is authorized to deliver materials matching the categories below:</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedSupplier.approvedCategories && selectedSupplier.approvedCategories.length > 0 ? (
                        selectedSupplier.approvedCategories.map((cat, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl font-bold">
                            <Layers className="h-3.5 w-3.5 text-sky-600" />
                            {cat}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 font-medium italic">No categories approved for this vendor.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit & Rating */}
                {activeDetailTab === "history" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-2xl border border-border/40 font-bold">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Quality Audit Score</div>
                        <div className="text-slate-500 mt-0.5 font-medium">Complies with safety standards</div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-sm text-amber-400">{selectedSupplier.rating?.toFixed(1)} / 5.0</span>
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks & Notes</div>
                      <StarRating value={selectedSupplier.rating} disabled={true} />
                      <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/40 font-medium text-muted-foreground leading-relaxed italic">
                        &quot;{selectedSupplier.history || "No audit log or historical remarks available for this vendor."}&quot;
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-4 border-t border-border/50 bg-muted/20">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="h-10 text-xs font-bold w-full rounded-xl"
                >
                  Close Profile
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Custom Alert Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Supplier Record?"
        description="Are you sure you want to delete this supplier from the master registry? This action cannot be undone."
        confirmText="Delete Supplier"
        onConfirm={confirmDeleteSupplier}
        loading={deleteLoading}
      />
    </div>
  );
}
