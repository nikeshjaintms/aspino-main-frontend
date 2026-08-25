"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Eye,
  FolderTree,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  IndianRupee,
  FileCheck,
  Thermometer,
  Calendar,
  Filter,
  Sparkles,
  Scale,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateProductCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";


const SHELF_LIFE_OPTIONS = [
  "6 Months",
  "12 Months",
  "18 Months",
  "24 Months",
  "36 Months",
  "48 Months",
  "60 Months",
];

const STORAGE_OPTIONS = [
  "Store below 25°C in a dry place",
  "Store between 2°C - 8°C (Cold Storage / Refrigerate)",
  "Store below 30°C, protect from direct sunlight",
  "Protect from light and moisture",
  "Controlled Room Temperature (20°C - 25°C)",
  "Deep Freeze (-20°C ± 5°C)",
];

export default function ProductMasterPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("none");
  const [uom, setUom] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [storageCondition, setStorageCondition] = useState("");
  const [standardCost, setStandardCost] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [qcSpecification, setQcSpecification] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch dropdown data (Active Categories, Subcategories, UOMs)
  const fetchDropdowns = async () => {
    try {
      const [catRes, subRes, uomRes] = await Promise.all([
        fetch(`${API_BASE_URL}/product-category?status=ACTIVE`),
        fetch(`${API_BASE_URL}/product-sub-category?status=ACTIVE`),
        fetch(`${API_BASE_URL}/uom?status=ACTIVE`),
      ]);

      if (catRes.ok) {
        const cData = await catRes.json();
        const list = Array.isArray(cData) ? cData : Array.isArray(cData?.data) ? cData.data : [];
        setCategories(list.filter((c) => c.isActive === true || c.isActive === undefined));
      }

      if (subRes.ok) {
        const sData = await subRes.json();
        const list = Array.isArray(sData) ? sData : Array.isArray(sData?.data) ? sData.data : [];
        setSubCategories(list.filter((s) => s.isActive === true || s.isActive === undefined));
      }

      if (uomRes.ok) {
        const uData = await uomRes.json();
        const list = Array.isArray(uData) ? uData : Array.isArray(uData?.data) ? uData.data : [];
        setUoms(list.filter((u) => u.isActive === true || u.isActive === undefined));
      }
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Update sub-category options when category selection changes in form (active only)
  useEffect(() => {
    if (categoryId && categoryId !== "none") {
      const filtered = subCategories.filter(
        (s) => s.categoryId === categoryId && (s.isActive === true || s.isActive === undefined)
      );
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  }, [categoryId, subCategories]);

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
      }
      if (selectedCategoryFilter && selectedCategoryFilter !== "ALL") {
        queryParams.append("categoryId", selectedCategoryFilter);
      }

      const res = await fetch(
        `${API_BASE_URL}/product?${queryParams.toString()}`
      );
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setProducts(list);
      setTotalCount(data.total ?? list.length);
      setTotalActive(
        data.activeCount ?? list.filter((p) => p?.isActive).length
      );
      setTotalInactive(
        data.inactiveCount ?? list.filter((p) => !p?.isActive).length
      );
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      customToast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, debouncedSearch, selectedCategoryFilter]);

  const resetForm = () => {
    setProductCode("");
    setName("");
    setCategoryId("");
    setSubCategoryId("none");
    setUom("");
    setShelfLife("");
    setStorageCondition("");
    setStandardCost("");
    setHsnCode("");
    setQcSpecification("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setEditingProduct(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsCodeManual(false);
    if (categories.length > 0 && selectedCategoryFilter !== "ALL") {
      setCategoryId(selectedCategoryFilter);
    }
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setProductCode(prod.productCode || "");
    setName(prod.name || "");
    setCategoryId(prod.categoryId || "");
    setSubCategoryId(prod.subCategoryId || "none");
    const matchUom = uoms.find((u) => u.id === prod.uom || u.uomCode === prod.uom);
    setUom(matchUom ? matchUom.id : prod.uom || "");
    setShelfLife(prod.shelfLife || "");
    setStorageCondition(prod.storageCondition || "");
    setStandardCost(prod.standardCost !== undefined ? String(prod.standardCost) : "");
    setHsnCode(prod.hsnCode || "");
    setQcSpecification(prod.qcSpecification || "");
    setIsActive(prod.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Live product name change with real-time auto code generation
  const handleNameChange = (val) => {
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: null }));
    }
    if (!isCodeManual) {
      const generated = generateProductCode(val);
      setProductCode(generated);
      if (fieldErrors.productCode) {
        setFieldErrors((prev) => ({ ...prev, productCode: null }));
      }
    }
  };

  const handleOpenView = (prod) => {
    setViewProduct(prod);
    setDetailsDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!productCode.trim()) {
      errors.productCode = "Product Code is required.";
    } else if (!/^[A-Z0-9_-]{2,30}$/i.test(productCode.trim())) {
      errors.productCode =
        "Code must be 2-30 alphanumeric characters (e.g. PRD-001, TAB-PCM-500).";
    }

    if (!name.trim()) {
      errors.name = "Product Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Product Name must be at least 2 characters.";
    }

    if (!categoryId) {
      errors.categoryId = "Product Category is required.";
    }

    if (filteredSubCategories.length > 0 && (!subCategoryId || subCategoryId === "none")) {
      errors.subCategoryId = "Sub-Category is required for this category.";
    }

    if (!uom || !uom.trim()) {
      errors.uom = "Unit of Measure (UOM) is required.";
    }

    if (!shelfLife || !shelfLife.trim()) {
      errors.shelfLife = "Shelf Life is required.";
    }

    if (!hsnCode || !hsnCode.trim()) {
      errors.hsnCode = "HSN Code is required (e.g. 30049099).";
    }

    if (!storageCondition || !storageCondition.trim()) {
      errors.storageCondition = "Storage Condition is required.";
    }

    if (standardCost === "" || standardCost === null || standardCost === undefined) {
      errors.standardCost = "Standard Cost is required.";
    } else if (isNaN(Number(standardCost)) || Number(standardCost) < 0) {
      errors.standardCost = "Standard Cost cannot be negative.";
    }

    if (!qcSpecification || !qcSpecification.trim()) {
      errors.qcSpecification = "Linked QC Specification is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      setFormError("Please resolve the highlighted validation errors.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productCode: productCode.trim().toUpperCase(),
        name: name.trim(),
        categoryId,
        subCategoryId:
          subCategoryId && subCategoryId !== "none" ? subCategoryId : undefined,
        uom: uom.trim(),
        shelfLife: shelfLife.trim(),
        storageCondition: storageCondition.trim(),
        standardCost: parseFloat(standardCost) || 0.0,
        hsnCode: hsnCode.trim(),
        qcSpecification: qcSpecification.trim() || undefined,
        isActive,
      };

      const url = editingProduct
        ? `${API_BASE_URL}/product/${editingProduct.id}`
        : `${API_BASE_URL}/product`;

      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Failed to save product.");
        customToast.error(result.message || "Failed to save product.");
        return;
      }

      customToast.success(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      );
      setFormDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      setFormError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (prod) => {
    setProductToDelete(prod);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/product/${productToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        customToast.error(data.message || "Failed to delete product.");
        return;
      }
      customToast.success("Product deleted successfully.");
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      customToast.error("An error occurred while deleting product.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "productCode",
      header: "Product Code",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded-md text-foreground border">
            {item.productCode}
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Product Name",
      cell: (row) => {
        const item = row?.original || row;
        const matchUom = uoms.find((u) => u.id === item.uom || u.uomCode === item.uom);
        const uomDisp = matchUom ? matchUom.uomCode : item.uom;
        return (
          <div className="flex flex-col max-w-[220px]">
            <span className="font-semibold text-sm text-foreground truncate">
              {item.name}
            </span>
            <span className="text-[11px] text-muted-foreground">
              HSN: {item.hsnCode} • UOM: {uomDisp}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category / Sub-Category",
      cell: (row) => {
        const item = row?.original || row;
        const cat = item.category;
        const sub = item.subCategory;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-foreground">
              {cat?.categoryName || "—"}
            </span>
            {sub ? (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3 text-blue-500" />
                {sub.subCategoryName}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 italic">
                No Sub-Category
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "shelfLife",
      header: "Shelf Life",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="text-xs text-foreground font-medium">
            {item.shelfLife}
          </span>
        );
      },
    },
    {
      accessorKey: "standardCost",
      header: "Standard Cost",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="font-mono font-semibold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            ₹{Number(item.standardCost || 0).toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "qcSpecification",
      header: "QC Specification",
      cell: (row) => {
        const item = row?.original || row;
        const qc = item.qcSpecification;
        return qc ? (
          <span
            className="text-xs text-muted-foreground max-w-[150px] truncate block"
            title={qc}
          >
            {qc}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">None</span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: (row) => {
        const item = row?.original || row;
        const active = item.isActive;
        return (
          <Badge
            variant={active ? "default" : "secondary"}
            className={
              active
                ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:text-rose-400 border-rose-500/30"
            }
          >
            {active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenView(item)}
              className="h-8 text-xs font-semibold text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg gap-1.5 px-2.5 transition-colors"
              title="Show details"
            >
              <Eye className="h-3.5 w-3.5" />
              Show
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(item)}
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
              title="Edit Product"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(item)}
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Product"
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
        title="Product Master"
        description="Comprehensive pharmaceutical product specifications, costs, shelf life, and QC linkage."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters" },
          { label: "Product Master" },
        ]}
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Products
              </p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Products
              </p>
              <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inactive Products
              </p>
              <p className="text-2xl font-bold text-rose-500">{totalInactive}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main DataTable in Card Container */}
      <Card className="border-border/60 shadow-md bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Product Master Directory
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage formulation specs, storage, shelf life, and HSN codes
            </CardDescription>
          </div>

          {/* Quick Category Filter in Header */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={selectedCategoryFilter}
              onValueChange={(val) => {
                setSelectedCategoryFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[220px] h-9 text-xs rounded-xl bg-muted/40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.categoryName} ({cat.categoryCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-4 bg-transparent">
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            searchPlaceholder="Search products by code, name, HSN, QC spec..."
            emptyMessage="No products found"
            emptyDescription="Create a new pharmaceutical product by clicking Add Product."
            isServerSide={true}
            totalCount={totalCount}
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

      {/* Create / Edit Dialog - Styled exactly like Supplier/Customer Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setFormDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-3 opacity-10">
              <Package className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {editingProduct
                      ? `Modify Product Master: ${editingProduct.name}`
                      : "Register New Product Master"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Configure formulation attributes, packaging parameters, linked QC criteria, and pricing.
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
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

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 2-COLUMN WIDE LANDSCAPE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* LEFT COLUMN: Identity, Category & Valuation */}
                <div className="space-y-4">
                  {/* Section 1: Classification & Identity */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Package className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        1. Product Classification & Identity
                      </h4>
                    </div>

                    {/* Product Name & Product Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Product Code (Auto-derived & Editable) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="productCode" className="text-xs sm:text-sm font-bold text-foreground">
                            Product Code *
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              const auto = generateProductCode(name);
                              if (auto) {
                                setProductCode(auto);
                                setIsCodeManual(false);
                                if (fieldErrors.productCode) {
                                  setFieldErrors((prev) => ({ ...prev, productCode: null }));
                                }
                              }
                            }}
                            className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                            title="Auto-derive code from product name"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Auto-derive
                          </button>
                        </div>
                        <Input
                          id="productCode"
                          placeholder="e.g. PRD-PCM-500"
                          value={productCode}
                          onChange={(e) => {
                            setProductCode(e.target.value.toUpperCase());
                            setIsCodeManual(true);
                            if (fieldErrors.productCode) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                productCode: null,
                              }));
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono font-bold ${
                            fieldErrors.productCode
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                        {fieldErrors.productCode && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.productCode}
                          </p>
                        )}
                      </div>

                      {/* Formulation Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs sm:text-sm font-bold text-foreground">
                          Product Formulation Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g. Paracetamol 500mg Tablets"
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

                    {/* Category & Sub-Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="categoryId" className="text-xs sm:text-sm font-bold text-foreground">
                          Product Category *
                        </Label>
                        <Select
                          value={categoryId}
                          onValueChange={(val) => {
                            setCategoryId(val);
                            setSubCategoryId("none");
                            if (fieldErrors.categoryId) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                categoryId: null,
                              }));
                            }
                          }}
                        >
                          <SelectTrigger
                            id="categoryId"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              fieldErrors.categoryId
                                ? "border-red-500"
                                : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {categories && categories.length > 0 ? (
                              categories
                                .filter((cat) => cat.isActive !== false || cat.id === categoryId)
                                .map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                                    {cat.categoryName} ({cat.categoryCode})
                                  </SelectItem>
                                ))
                            ) : (
                              <div className="p-3 text-xs text-muted-foreground text-center">
                                No active categories available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.categoryId && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.categoryId}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="subCategoryId" className="text-xs sm:text-sm font-bold text-foreground">
                          Sub-Category {filteredSubCategories.length > 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={subCategoryId}
                          onValueChange={(val) => {
                            setSubCategoryId(val);
                            if (fieldErrors.subCategoryId) {
                              setFieldErrors((prev) => ({ ...prev, subCategoryId: null }));
                            }
                          }}
                          disabled={!categoryId}
                        >
                          <SelectTrigger
                            id="subCategoryId"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              fieldErrors.subCategoryId
                                ? "border-red-500"
                                : "border-border"
                            }`}
                          >
                            <SelectValue placeholder={categoryId ? "Select Sub-Category" : "Select Category first"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="none" className="text-xs sm:text-sm">None / Unassigned</SelectItem>
                            {filteredSubCategories
                              .filter((sub) => sub.isActive !== false || sub.id === subCategoryId)
                              .map((sub) => (
                                <SelectItem key={sub.id} value={sub.id} className="text-xs sm:text-sm">
                                  {sub.subCategoryName} ({sub.subCategoryCode})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.subCategoryId && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.subCategoryId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Measuring & Valuation */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Scale className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        2. Unit of Measure & Pricing
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="uom" className="text-xs sm:text-sm font-bold text-foreground">
                          Unit of Measure (UOM) *
                        </Label>
                        <Select
                          value={uom}
                          onValueChange={(val) => {
                            setUom(val);
                            if (fieldErrors.uom) {
                              setFieldErrors((prev) => ({ ...prev, uom: null }));
                            }
                          }}
                        >
                          <SelectTrigger
                            id="uom"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              fieldErrors.uom ? "border-red-500" : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select UOM" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {uoms && uoms.length > 0 ? (
                              uoms
                                .filter((u) => u.isActive !== false || u.id === uom)
                                .map((u) => (
                                  <SelectItem key={u.id || u.uomCode} value={u.id} className="text-xs sm:text-sm">
                                    {u.uomName} ({u.uomCode})
                                  </SelectItem>
                                ))
                            ) : (
                              <div className="p-3 text-xs text-muted-foreground text-center">
                                No active UOMs available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {fieldErrors.uom && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.uom}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="hsnCode" className="text-xs sm:text-sm font-bold text-foreground">
                          HSN Code *
                        </Label>
                        <Input
                          id="hsnCode"
                          placeholder="e.g. 30049099"
                          value={hsnCode}
                          onChange={(e) => {
                            setHsnCode(e.target.value);
                            if (fieldErrors.hsnCode) {
                              setFieldErrors((prev) => ({ ...prev, hsnCode: null }));
                            }
                          }}
                          className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 font-mono ${
                            fieldErrors.hsnCode
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                        {fieldErrors.hsnCode && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.hsnCode}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="standardCost" className="text-xs sm:text-sm font-bold text-foreground">
                          Standard Cost (₹) *
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                          <Input
                            id="standardCost"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={standardCost}
                            onKeyDown={(e) => {
                              if (["-", "+", "e", "E"].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
                                setStandardCost(val);
                                if (fieldErrors.standardCost) {
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    standardCost: null,
                                  }));
                                }
                              }
                            }}
                            className={`text-xs sm:text-sm h-11 pl-9 rounded-xl bg-muted/50 font-mono font-bold ${
                              fieldErrors.standardCost
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-border focus-visible:ring-sky-500"
                            }`}
                          />
                        </div>
                        {fieldErrors.standardCost && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.standardCost}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Shelf Life, Storage & Quality Criteria */}
                <div className="space-y-4">
                  {/* Section 3: Stability & Storage Guidelines */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Thermometer className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        3. Stability & Storage Guidelines
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="shelfLife" className="text-xs sm:text-sm font-bold text-foreground">
                          Shelf Life *
                        </Label>
                        <Select
                          value={shelfLife}
                          onValueChange={(val) => {
                            setShelfLife(val);
                            if (fieldErrors.shelfLife) {
                              setFieldErrors((prev) => ({ ...prev, shelfLife: null }));
                            }
                          }}
                        >
                          <SelectTrigger
                            id="shelfLife"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              fieldErrors.shelfLife ? "border-red-500" : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select Shelf Life" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHELF_LIFE_OPTIONS.map((sl) => (
                              <SelectItem key={sl} value={sl} className="text-xs sm:text-sm">
                                {sl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.shelfLife && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.shelfLife}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="storageCondition" className="text-xs sm:text-sm font-bold text-foreground">
                          Storage Condition *
                        </Label>
                        <Select
                          value={storageCondition}
                          onValueChange={(val) => {
                            setStorageCondition(val);
                            if (fieldErrors.storageCondition) {
                              setFieldErrors((prev) => ({ ...prev, storageCondition: null }));
                            }
                          }}
                        >
                          <SelectTrigger
                            id="storageCondition"
                            className={`text-xs sm:text-sm h-11 rounded-xl bg-muted/50 ${
                              fieldErrors.storageCondition ? "border-red-500" : "border-border"
                            }`}
                          >
                            <SelectValue placeholder="Select Storage Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {STORAGE_OPTIONS.map((sc) => (
                              <SelectItem key={sc} value={sc} className="text-xs sm:text-sm">
                                {sc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.storageCondition && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.storageCondition}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Quality Assurance & Activation */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <FileCheck className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        4. Quality Assurance & Status
                      </h4>
                    </div>

                    {/* Linked QC Specification */}
                    <div className="space-y-1.5">
                      <Label htmlFor="qcSpecification" className="text-xs sm:text-sm font-bold text-foreground">
                        Linked QC Specification / Standard Criteria *
                      </Label>
                      <Textarea
                        id="qcSpecification"
                        rows={2}
                        placeholder="e.g. QC-SPEC-TAB-001 | IP/BP/USP standard disintegration < 15min, assay 98-102%..."
                        value={qcSpecification}
                        onChange={(e) => {
                          setQcSpecification(e.target.value);
                          if (fieldErrors.qcSpecification) {
                            setFieldErrors((prev) => ({ ...prev, qcSpecification: null }));
                          }
                        }}
                        className={`text-xs sm:text-sm rounded-xl bg-muted/50 min-h-[60px] ${
                          fieldErrors.qcSpecification
                            ? "border-red-500 focus-visible:ring-red-500"
                            : "border-border focus-visible:ring-sky-500"
                        }`}
                      />
                      {fieldErrors.qcSpecification && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {fieldErrors.qcSpecification}
                        </p>
                      )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-background/80 border border-border/50 mt-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs sm:text-sm font-bold text-foreground cursor-pointer">
                          Active Product Status
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {isActive ? "Active (Usable in gate passes & batches)" : "Inactive"}
                        </p>
                      </div>
                      <Switch
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
                disabled={submitting}
                className="h-10 text-xs sm:text-sm font-bold rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-7 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {submitting
                  ? "Saving..."
                  : editingProduct
                  ? "Save Changes"
                  : "Register Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog - Styled with Supplier details aesthetic */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-5xl xl:max-w-6xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {viewProduct && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
                <div className="absolute right-8 top-3 opacity-10">
                  <Package className="h-28 w-28" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                      <Package className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white">
                        {viewProduct.name}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                          {viewProduct.productCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border ${
                      viewProduct.isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-white/10 text-slate-300 border-white/10"
                    }`}>
                      {viewProduct.isActive ? "Status: Active" : "Status: Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <FolderTree className="h-4 w-4 text-sky-500" />
                      Category
                    </span>
                    <p className="font-bold text-foreground">
                      {viewProduct.category?.categoryName || "—"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <Layers className="h-4 w-4 text-indigo-500" />
                      Sub-Category
                    </span>
                    <p className="font-bold text-foreground">
                      {viewProduct.subCategory?.subCategoryName || "None"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <Scale className="h-4 w-4 text-amber-500" />
                      Unit of Measure (UOM)
                    </span>
                    <p className="font-bold text-foreground">
                      {(() => {
                        const matchUom = uoms.find((u) => u.id === viewProduct.uom || u.uomCode === viewProduct.uom);
                        return matchUom ? `${matchUom.uomCode} - ${matchUom.uomName}` : viewProduct.uom;
                      })()}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold text-xs">HSN Code</span>
                    <p className="font-mono font-bold text-foreground">
                      {viewProduct.hsnCode}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      Shelf Life
                    </span>
                    <p className="font-bold text-foreground">{viewProduct.shelfLife}</p>
                  </div>

                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <IndianRupee className="h-4 w-4 text-emerald-500" />
                      Standard Cost
                    </span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(viewProduct.standardCost || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1 text-xs sm:text-sm shadow-sm">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                    Storage Condition
                  </span>
                  <p className="font-medium text-foreground">
                    {viewProduct.storageCondition}
                  </p>
                </div>

                {viewProduct.qcSpecification && (
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-1.5 text-xs sm:text-sm shadow-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs">
                      <FileCheck className="h-4 w-4 text-sky-500" />
                      Linked QC Specification Criteria
                    </span>
                    <p className="font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-background/50 p-3 rounded-xl border">
                      {viewProduct.qcSpecification}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                  className="h-10 text-xs sm:text-sm font-bold rounded-xl px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Product"
        description={`Are you sure you want to delete product "${productToDelete?.name}" (${productToDelete?.productCode})? This action cannot be undone.`}
        confirmText="Delete Product"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
