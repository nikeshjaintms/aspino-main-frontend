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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FolderTree,
  Edit,
  Trash2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Layers,
  Package,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateCategoryCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search States
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
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
      }
      const res = await fetch(
        `${API_BASE_URL}/product-category?${queryParams.toString()}`
      );
      if (!res.ok) {
        setCategories([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setCategories(list);
      setTotalCount(data.total ?? list.length);
      setTotalActive(
        data.activeCount ?? list.filter((c) => c?.isActive).length
      );
      setTotalInactive(
        data.inactiveCount ?? list.filter((c) => !c?.isActive).length
      );
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      customToast.error("Failed to load product categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, pageSize, debouncedSearch]);

  const resetForm = () => {
    setCategoryCode("");
    setCategoryName("");
    setDescription("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setEditingCategory(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsCodeManual(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryCode(cat.categoryCode || "");
    setCategoryName(cat.categoryName || "");
    setDescription(cat.description || "");
    setIsActive(cat.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Name change with real-time auto code generation
  const handleNameChange = (val) => {
    setCategoryName(val);
    if (fieldErrors.categoryName) {
      setFieldErrors((prev) => ({ ...prev, categoryName: null }));
    }
    if (!isCodeManual) {
      const generated = generateCategoryCode(val);
      setCategoryCode(generated);
      if (fieldErrors.categoryCode) {
        setFieldErrors((prev) => ({ ...prev, categoryCode: null }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!categoryCode.trim()) {
      errors.categoryCode = "Category Code is required.";
    } else if (!/^[A-Z0-9_-]{2,20}$/i.test(categoryCode.trim())) {
      errors.categoryCode =
        "Code must be 2-20 alphanumeric characters (e.g. CAT-001, API, FDF).";
    }

    if (!categoryName.trim()) {
      errors.categoryName = "Category Name is required.";
    } else if (categoryName.trim().length < 2) {
      errors.categoryName = "Category Name must be at least 2 characters long.";
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
        categoryCode: categoryCode.trim().toUpperCase(),
        categoryName: categoryName.trim(),
        description: description.trim() || undefined,
        isActive,
      };

      const url = editingCategory
        ? `${API_BASE_URL}/product-category/${editingCategory.id}`
        : `${API_BASE_URL}/product-category`;

      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Failed to save product category.");
        customToast.error(
          result.message || "Failed to save product category."
        );
        return;
      }

      customToast.success(
        editingCategory
          ? "Product Category updated successfully."
          : "Product Category created successfully."
      );
      setFormDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("Error saving product category:", err);
      setFormError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cat) => {
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/product-category/${categoryToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        customToast.error(data.message || "Failed to delete category.");
        return;
      }
      customToast.success("Product Category deleted successfully.");
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      customToast.error("An error occurred while deleting category.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "categoryCode",
      header: "Category Code",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded-md text-foreground border">
            {item.categoryCode}
          </span>
        );
      },
    },
    {
      accessorKey: "categoryName",
      header: "Category Name",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">
              {item.categoryName}
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
      accessorKey: "subCategories",
      header: "Sub-Categories",
      cell: (row) => {
        const item = row?.original || row;
        const count = item._count?.subCategories ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-medium text-foreground">{count}</span> linked
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
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit Category"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(item)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete Category"
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
        title="Product Category Master"
        description="Manage high-level pharmaceutical classifications and categories."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters" },
          { label: "Product Categories" },
        ]}
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Categories
              </p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <FolderTree className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Categories
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
                Inactive Categories
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
              Product Category Registry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage pharmaceutical high-level product classifications
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-transparent">
          <DataTable
            columns={columns}
            data={categories}
            loading={loading}
            searchPlaceholder="Search categories by code, name or description..."
            emptyMessage="No product categories found"
            emptyDescription="Create a new category by clicking Add Category."
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
              <FolderTree className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  {editingCategory
                    ? `Modify Category: ${editingCategory.categoryName}`
                    : "Register Product Category"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Define high-level pharmaceutical classifications and categorization codes.
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
                <FolderTree className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Category Attributes
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Name (First for intuitive flow) */}
                <div className="space-y-1.5">
                  <Label htmlFor="categoryName" className="text-xs font-bold text-foreground">
                    Category Name *
                  </Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g. Active Pharmaceutical Ingredients"
                    value={categoryName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.categoryName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.categoryName && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.categoryName}
                    </p>
                  )}
                </div>

                {/* Category Code (Auto-generated & Editable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="categoryCode" className="text-xs font-bold text-foreground">
                      Category Code *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = generateCategoryCode(categoryName);
                        if (auto) {
                          setCategoryCode(auto);
                          setIsCodeManual(false);
                          if (fieldErrors.categoryCode) {
                            setFieldErrors((prev) => ({ ...prev, categoryCode: null }));
                          }
                        }
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Auto-derive code from category name"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-derive
                    </button>
                  </div>
                  <Input
                    id="categoryCode"
                    placeholder="e.g. CAT-API, CAT-FDF"
                    value={categoryCode}
                    onChange={(e) => {
                      setCategoryCode(e.target.value.toUpperCase());
                      setIsCodeManual(true);
                      if (fieldErrors.categoryCode) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          categoryCode: null,
                        }));
                      }
                    }}
                    className={`text-xs h-10 rounded-xl bg-muted/50 font-mono font-bold ${
                      fieldErrors.categoryCode
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.categoryCode && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.categoryCode}
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
                  placeholder="Provide details about materials and specifications in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable or disable this category across products and orders.
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
                  : editingCategory
                  ? "Save Changes"
                  : "Register Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Product Category"
        description={`Are you sure you want to delete category "${categoryToDelete?.categoryName}" (${categoryToDelete?.categoryCode})? This action cannot be undone.`}
        confirmText="Delete Category"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
