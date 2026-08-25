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
  Layers,
  Edit,
  Trash2,
  FolderTree,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Package,
  Filter,
  Sparkles,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateSubCategoryCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ProductSubCategoriesPage() {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // Modal State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [subCategoryCode, setSubCategoryCode] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Active Parent Categories for dropdowns
  const fetchCategoryDropdown = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-category?status=ACTIVE`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCategories(list.filter((c) => c.isActive === true || c.isActive === undefined));
      }
    } catch (err) {
      console.error("Error fetching categories dropdown:", err);
    }
  };

  useEffect(() => {
    fetchCategoryDropdown();
  }, []);

  // Fetch Sub-Categories
  const fetchSubCategories = async () => {
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
        `${API_BASE_URL}/product-sub-category?${queryParams.toString()}`
      );
      if (!res.ok) {
        setSubCategories([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setSubCategories(list);
      setTotalCount(data.total ?? list.length);
      setTotalActive(
        data.activeCount ?? list.filter((s) => s?.isActive).length
      );
      setTotalInactive(
        data.inactiveCount ?? list.filter((s) => !s?.isActive).length
      );
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching sub categories:", error);
      customToast.error("Failed to load sub-categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, [currentPage, pageSize, debouncedSearch, selectedCategoryFilter]);

  const resetForm = () => {
    setSubCategoryCode("");
    setSubCategoryName("");
    setCategoryId("");
    setDescription("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setEditingSubCategory(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsCodeManual(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubCategory(sub);
    setSubCategoryCode(sub.subCategoryCode || "");
    setSubCategoryName(sub.subCategoryName || "");
    setCategoryId(sub.categoryId || "");
    setDescription(sub.description || "");
    setIsActive(sub.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Name change with real-time auto code generation
  const handleNameChange = (val) => {
    setSubCategoryName(val);
    if (fieldErrors.subCategoryName) {
      setFieldErrors((prev) => ({ ...prev, subCategoryName: null }));
    }
    if (!isCodeManual) {
      const generated = generateSubCategoryCode(val);
      setSubCategoryCode(generated);
      if (fieldErrors.subCategoryCode) {
        setFieldErrors((prev) => ({ ...prev, subCategoryCode: null }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!subCategoryCode.trim()) {
      errors.subCategoryCode = "Sub-Category Code is required.";
    } else if (!/^[A-Z0-9_-]{2,20}$/i.test(subCategoryCode.trim())) {
      errors.subCategoryCode =
        "Code must be 2-20 alphanumeric characters (e.g. SUB-001, TAB, CAP).";
    }

    if (!subCategoryName.trim()) {
      errors.subCategoryName = "Sub-Category Name is required.";
    } else if (subCategoryName.trim().length < 2) {
      errors.subCategoryName =
        "Sub-Category Name must be at least 2 characters.";
    }

    if (!categoryId) {
      errors.categoryId = "Linked Product Category is required.";
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
        subCategoryCode: subCategoryCode.trim().toUpperCase(),
        subCategoryName: subCategoryName.trim(),
        categoryId,
        description: description.trim() || undefined,
        isActive,
      };

      const url = editingSubCategory
        ? `${API_BASE_URL}/product-sub-category/${editingSubCategory.id}`
        : `${API_BASE_URL}/product-sub-category`;

      const method = editingSubCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Failed to save product sub-category.");
        customToast.error(
          result.message || "Failed to save product sub-category."
        );
        return;
      }

      customToast.success(
        editingSubCategory
          ? "Sub-Category updated successfully."
          : "Sub-Category created successfully."
      );
      setFormDialogOpen(false);
      resetForm();
      fetchSubCategories();
    } catch (err) {
      console.error("Error saving sub-category:", err);
      setFormError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (sub) => {
    setSubCategoryToDelete(sub);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subCategoryToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/product-sub-category/${subCategoryToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        customToast.error(data.message || "Failed to delete sub-category.");
        return;
      }
      customToast.success("Sub-Category deleted successfully.");
      setDeleteConfirmOpen(false);
      setSubCategoryToDelete(null);
      fetchSubCategories();
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      customToast.error("An error occurred while deleting sub-category.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "subCategoryCode",
      header: "Sub-Category Code",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded-md text-foreground border">
            {item.subCategoryCode}
          </span>
        );
      },
    },
    {
      accessorKey: "subCategoryName",
      header: "Sub-Category Name",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">
              {item.subCategoryName}
            </span>
            {item.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Linked Category",
      cell: (row) => {
        const item = row?.original || row;
        const cat = item.category;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <FolderTree className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span className="font-medium text-foreground">
              {cat ? `${cat.categoryName} (${cat.categoryCode})` : "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "products",
      header: "Products",
      cell: (row) => {
        const item = row?.original || row;
        const count = item._count?.products ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-medium text-foreground">{count}</span> items
          </div>
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
      accessorKey: "createdAt",
      header: "Created Date",
      cell: (row) => {
        const item = row?.original || row;
        const date = item.createdAt;
        return (
          <span className="text-xs text-muted-foreground">
            {date ? new Date(date).toLocaleDateString() : "—"}
          </span>
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
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEdit(item)}
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
              title="Edit Sub-Category"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(item)}
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Sub-Category"
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
        title="Product Sub-Category Master"
        description="Configure specific dosage forms, packaging types, and granular classifications."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters" },
          { label: "Product Sub-Categories" },
        ]}
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add Sub-Category
        </Button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Sub-Categories
              </p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Sub-Categories
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
                Inactive Sub-Categories
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
              Product Sub-Category Registry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage secondary dosage forms and specifications
            </CardDescription>
          </div>

          {/* Quick Category Filter inside Header */}
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
            data={subCategories}
            loading={loading}
            searchPlaceholder="Search sub-categories by code, name, description..."
            emptyMessage="No product sub-categories found"
            emptyDescription="Create a new sub-category by clicking Add Sub-Category."
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

      {/* Create / Edit Dialog - Styled exactly like Supplier Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setFormDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          {/* Supplier-style Gradient Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Layers className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  {editingSubCategory
                    ? `Modify Sub-Category: ${editingSubCategory.subCategoryName}`
                    : "Register Product Sub-Category"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Define granular classifications linked to a parent category.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-card"
          >
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-rose-400 text-xs font-bold shadow-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                <Layers className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sub-Category Linkage & Identity
                </h4>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="text-xs font-bold text-foreground">
                  Linked Parent Category *
                </Label>
                <Select
                  value={categoryId}
                  onValueChange={(val) => {
                    setCategoryId(val);
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
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.categoryId
                        ? "border-red-500"
                        : "border-border"
                    }`}
                  >
                    <SelectValue placeholder="Select Parent Category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categories && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.categoryName} ({cat.categoryCode})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        No active parent categories available
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {fieldErrors.categoryId && (
                  <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.categoryId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sub-Category Name (First for intuitive flow) */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="subCategoryName"
                    className="text-xs font-bold text-foreground"
                  >
                    Sub-Category Name *
                  </Label>
                  <Input
                    id="subCategoryName"
                    placeholder="e.g. Solid Orals (Tablets), Capsules"
                    value={subCategoryName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.subCategoryName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.subCategoryName && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.subCategoryName}
                    </p>
                  )}
                </div>

                {/* Sub-Category Code (Auto-derived & Editable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="subCategoryCode"
                      className="text-xs font-bold text-foreground"
                    >
                      Sub-Category Code *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = generateSubCategoryCode(subCategoryName);
                        if (auto) {
                          setSubCategoryCode(auto);
                          setIsCodeManual(false);
                          if (fieldErrors.subCategoryCode) {
                            setFieldErrors((prev) => ({ ...prev, subCategoryCode: null }));
                          }
                        }
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Auto-derive code from sub-category name"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-derive
                    </button>
                  </div>
                  <Input
                    id="subCategoryCode"
                    placeholder="e.g. SUB-TAB, SUB-CAP"
                    value={subCategoryCode}
                    onChange={(e) => {
                      setSubCategoryCode(e.target.value.toUpperCase());
                      setIsCodeManual(true);
                      if (fieldErrors.subCategoryCode) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          subCategoryCode: null,
                        }));
                      }
                    }}
                    className={`text-xs h-10 rounded-xl bg-muted/50 font-mono font-bold ${
                      fieldErrors.subCategoryCode
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.subCategoryCode && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.subCategoryCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-foreground">
                  Description & Scope
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Provide details about products classified under this sub-category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable or disable this sub-category in product forms.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={submitting}
                className="h-10 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {submitting
                  ? "Saving..."
                  : editingSubCategory
                  ? "Save Changes"
                  : "Register Sub-Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Sub-Category"
        description={`Are you sure you want to delete sub-category "${subCategoryToDelete?.subCategoryName}" (${subCategoryToDelete?.subCategoryCode})? This action cannot be undone.`}
        confirmText="Delete Sub-Category"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
