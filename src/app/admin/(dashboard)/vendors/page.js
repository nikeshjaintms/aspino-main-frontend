"use client";

import { useState, useEffect } from "react";
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
import {
  Plus,
  Truck,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCheck,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Handshake,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search States
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Metrics state variables populated from backend
  const [totalVendors, setTotalVendors] = useState(0);
  const [approvedVendors, setApprovedVendors] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);

  // Modals state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, seteditingVendor] = useState(null);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setvendorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Validation State
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form Fields State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [contractReference, setContractReference] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("Approved");

  // Fetch vendors from NestJS backend
  const fetchvendors = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }
      const res = await fetch(`${API_BASE_URL}/vendor?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load vendors listing");
      const data = await res.json();
      setVendors(data.data || []);
      setTotalVendors(data.total || 0);
      setApprovedVendors(data.totalApproved || 0);
      setTotalCategories(data.totalCategories || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync records with database backend.");
    } finally {
      setLoading(false);
    }
  };

  // Refetch vendors when pagination/search state updates
  useEffect(() => {
    fetchvendors();
  }, [currentPage, pageSize, search]);

  const fetchData = async () => {
    await fetchvendors();
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setServiceType("");
    setAddress("");
    setContactName("");
    setMobile("");
    setEmail("");
    setContractReference("");
    setApprovalStatus("Approved");
    setFormError("");
    setFieldErrors({});
  };

  const handleAddClick = () => {
    seteditingVendor(null);
    resetForm();
    const nextNum = vendors.length + 1;
    setCode(`VEN-2026-${String(nextNum).padStart(3, "0")}`);
    setFormDialogOpen(true);
  };

  const handleEditClick = (vendor) => {
    seteditingVendor(vendor);
    setCode(vendor.code || "");
    setName(vendor.name || "");
    setServiceType(vendor.serviceType || "");
    setAddress(vendor.address || "");
    setContactName(vendor.contactName || vendor.contactPerson || "");
    setMobile(vendor.mobile || vendor.phone || "");
    setEmail(vendor.email || "");
    setContractReference(vendor.contractReference || "");
    setApprovalStatus(vendor.approvalStatus || "Approved");
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  const promptDeleteVendor = (id) => {
    setvendorToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/${vendorToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vendor");
      toast.success("Vendor removed from master registry.");
      setDeleteConfirmOpen(false);
      setvendorToDelete(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Error removing vendor from registry.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowDetails = (vendor) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const errors = {};

    if (!code.trim()) {
      errors.code = "Vendor Code is required.";
    }

    if (!name.trim()) {
      errors.name = "Vendor Name is required.";
    } else if (/[0-9]/.test(name.trim())) {
      errors.name = "Numbers are not allowed in Vendor Name.";
    }

    if (!serviceType.trim()) {
      errors.serviceType = "Service Type is required.";
    }

    if (!contactName.trim()) {
      errors.contactName = "Contact Name is required.";
    } else if (/[0-9]/.test(contactName.trim())) {
      errors.contactName = "Numbers are not allowed in Contact Name.";
    }

    if (!email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!mobile.trim()) {
      errors.mobile = "Mobile Number is required.";
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!address.trim()) {
      errors.address = "Physical Address is required.";
    }

    if (!contractReference.trim()) {
      errors.contractReference = "Contract Reference is required (e.g. CNT-2026-084).";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fix the highlighted fields below.");
      toast.error("Please check highlighted fields.");
      return;
    }

    const vendorPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      serviceType: serviceType.trim(),
      address: address.trim(),
      contactName: contactName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      contractReference: contractReference.trim(),
      approvalStatus,
    };

    try {
      const url = editingVendor
        ? `${API_BASE_URL}/vendor/${editingVendor.id}`
        : `${API_BASE_URL}/vendor`;
      const method = editingVendor ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to save Vendor";
        throw new Error(errorMsg);
      }

      toast.success(
        editingVendor
          ? "Vendor master record updated!"
          : "New Vendor registered successfully!"
      );
      setFormDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
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
                ? row.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "VN"}
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
      accessorKey: "serviceType",
      header: "Service Type",
      cell: (row) => (
        <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5 bg-muted text-muted-foreground border border-border">
          {row.serviceType || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "contactName",
      header: "Primary Contact",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground text-xs">
            {row.contactName || row.contactPerson || "N/A"}
          </div>
          {row.email && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              {row.email}
            </div>
          )}
          {(row.mobile || row.phone) && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              {row.mobile || row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "contractReference",
      header: "Contract Ref",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {row.contractReference || "N/A"}
        </span>
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
            {row.approvalStatus || "Approved"}
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
            title="Edit Vendor"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteVendor(row.id)}
            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Vendor"
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
        title="Vendor Master Registry"
        description="Configure certified vendors, service classifications, contact information, and compliance status"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Master Records" },
          { label: "Vendor Master" },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAddClick}
            className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </PageHeader>

      {/* Modern Dashboard Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Vendors */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Vendors</p>
              <h3 className="text-3xl font-extrabold text-foreground">{totalVendors}</h3>
              <p className="text-[10px] text-muted-foreground">Registered partners in ERP</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Handshake className="h-6 w-6 text-sky-400" />
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

        {/* Service Types / Categories */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Types</p>
              <h3 className="text-3xl font-extrabold text-foreground">{totalCategories}</h3>
              <p className="text-[10px] text-muted-foreground">Approved service categories</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main DataTable in Card Container */}
      <Card className="border-border/60 shadow-md bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Vendor Master Registry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage transport, service, and external service provider records
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-transparent">
          <DataTable
            columns={columns}
            data={vendors}
            loading={loading}
            searchPlaceholder="Search by Name, Code, Service Type, Contact..."
            emptyMessage="No Vendor records found"
            emptyDescription="Create a new Vendor master entry by clicking Add Vendor."
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
        </CardContent>
      </Card>

      {/* Dialog 1: Add / Edit Vendor Form */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Handshake className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  {editingVendor ? `Modify Master Record: ${editingVendor.name}` : "Register New Vendor Master"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Configure vendor code, service classifications, contact details, and compliance status.
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

            {/* General Profile Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                <Building2 className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Profile Settings</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-bold text-foreground">Vendor Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
                    }}
                    placeholder="e.g. VEN-2026-001"
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
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-foreground">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onKeyDown={(e) => {
                      if (/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[0-9]/g, "");
                      setName(cleaned);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                    }}
                    placeholder="e.g. Apex Industrial Solutions"
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

                {/* Service Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="serviceType" className="text-xs font-bold text-foreground">Service Type *</Label>
                  <Input
                    id="serviceType"
                    value={serviceType}
                    onChange={(e) => {
                      setServiceType(e.target.value);
                      if (fieldErrors.serviceType) setFieldErrors((prev) => ({ ...prev, serviceType: null }));
                    }}
                    placeholder="e.g. Equipment Maintenance"
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.serviceType ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.serviceType && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.serviceType}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                  <UserCheck className="h-4 w-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact & Reference Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Contact Person */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs font-bold text-foreground">Contact Name *</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                      <Input
                        id="contactName"
                        value={contactName}
                        onKeyDown={(e) => {
                          if (/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[0-9]/g, "");
                          setContactName(cleaned);
                          if (fieldErrors.contactName) setFieldErrors((prev) => ({ ...prev, contactName: null }));
                        }}
                        placeholder="e.g. Amit Patel"
                        className={`text-xs h-10 pl-9 rounded-xl bg-muted/50 ${
                          fieldErrors.contactName ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                    </div>
                    {fieldErrors.contactName && (
                      <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.contactName}
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
                        placeholder="e.g. contact@vendor.com"
                        className={`text-xs h-10 pl-9 rounded-xl bg-muted/50 ${
                          fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
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

                  {/* Mobile */}
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-xs font-bold text-foreground">Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                      <Input
                        id="mobile"
                        value={mobile}
                        maxLength={10}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setMobile(cleaned);
                          if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: null }));
                        }}
                        placeholder="e.g. 9876543210"
                        className={`text-xs h-10 pl-9 rounded-xl bg-muted/50 ${
                          fieldErrors.mobile ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                    </div>
                    {fieldErrors.mobile && (
                      <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.mobile}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-bold text-foreground">Physical Address *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: null }));
                      }}
                      placeholder="Plot number, industrial estate, city, state"
                      className={`text-xs h-10 rounded-xl bg-muted/50 ${
                        fieldErrors.address ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                      }`}
                    />
                    {fieldErrors.address && (
                      <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>

                  {/* Contract Reference */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contractReference" className="text-xs font-bold text-foreground">Contract Reference *</Label>
                    <Input
                      id="contractReference"
                      value={contractReference}
                      onChange={(e) => {
                        setContractReference(e.target.value);
                        if (fieldErrors.contractReference) setFieldErrors((prev) => ({ ...prev, contractReference: null }));
                      }}
                      placeholder="e.g. CNT-2026-084"
                      className={`text-xs h-10 rounded-xl bg-muted/50 font-mono ${
                        fieldErrors.contractReference ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                      }`}
                    />
                    {fieldErrors.contractReference && (
                      <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.contractReference}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Status Switch at the bottom */}
            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40">
                <div className="space-y-0.5">
                  <Label htmlFor="Vendor-status-switch" className="text-xs font-bold text-foreground">Active Status</Label>
                  <p className="text-[10px] text-muted-foreground">Allow this Vendor to be active in ERP procurement workflows</p>
                </div>
                <Switch
                  id="Vendor-status-switch"
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
                {editingVendor ? "Save Changes" : "Register Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: View Detailed Vendor Profile */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="lg:max-w-2xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          {selectedVendor && (
            <div>
              {/* Header block */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white/20 shadow-xl shrink-0">
                    <AvatarFallback className="bg-sky-600 text-white font-bold text-lg">
                      {selectedVendor.name
                        ? selectedVendor.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "VN"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      {selectedVendor.name}
                      <span className="font-mono text-[10px] font-bold text-sky-300 bg-white/10 border border-white/10 px-1.5 py-0.5 rounded-md">
                        {selectedVendor.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Service Type: <span className="font-semibold text-slate-100">{selectedVendor.serviceType || "N/A"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-6 bg-card text-xs space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Contact</div>
                    <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-sky-600 shrink-0" />
                      {selectedVendor.contactName || selectedVendor.contactPerson || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approval Status</div>
                    <div className="mt-1">
                      {selectedVendor.approvalStatus === "Approved" && (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                          <ShieldCheck className="h-3 w-3" /> Approved
                        </Badge>
                      )}
                      {selectedVendor.approvalStatus === "Pending" && (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
                          <ShieldAlert className="h-3 w-3" /> Pending Review
                        </Badge>
                      )}
                      {selectedVendor.approvalStatus === "Suspended" && (
                        <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 flex items-center gap-1 w-fit">
                          <ShieldAlert className="h-3 w-3" /> Suspended
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</div>
                    <div className="text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      {selectedVendor.mobile || selectedVendor.phone || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</div>
                    <div className="text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      {selectedVendor.email || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contract Reference</div>
                    <div className="text-muted-foreground font-mono font-semibold mt-1 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      {selectedVendor.contractReference || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location / Address</div>
                    <div className="text-muted-foreground font-medium mt-1 flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedVendor.address || "N/A"}</span>
                    </div>
                  </div>
                </div>
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
        title="Delete Vendor Record?"
        description="Are you sure you want to delete this Vendor from the master registry? This action cannot be undone."
        confirmText="Delete Vendor"
        onConfirm={confirmDeleteVendor}
        loading={deleteLoading}
      />
    </div>
  );
}
