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
  Scale,
  Edit,
  Trash2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Hash,
  Layers,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateUomCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function UomMasterPage() {
  const [uoms, setUoms] = useState([]);
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
  const [editingUom, setEditingUom] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uomToDelete, setUomToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [uomCode, setUomCode] = useState("");
  const [uomName, setUomName] = useState("");
  const [conversionFactor, setConversionFactor] = useState("1.0");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch UOMs
  const fetchUoms = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
      }
      const res = await fetch(`${API_BASE_URL}/uom?${queryParams.toString()}`);
      if (!res.ok) {
        setUoms([]);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setUoms(list);
      setTotalCount(data.total ?? list.length);
      setTotalActive(
        data.activeCount ?? list.filter((u) => u?.isActive).length
      );
      setTotalInactive(
        data.inactiveCount ?? list.filter((u) => !u?.isActive).length
      );
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching UOMs:", error);
      customToast.error("Failed to load UOM master records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUoms();
  }, [currentPage, pageSize, debouncedSearch]);

  const resetForm = () => {
    setUomCode("");
    setUomName("");
    setConversionFactor("1.0");
    setDescription("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setEditingUom(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsCodeManual(false);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (uom) => {
    setEditingUom(uom);
    setUomCode(uom.uomCode || "");
    setUomName(uom.uomName || "");
    setConversionFactor(
      uom.conversionFactor !== undefined ? String(uom.conversionFactor) : "1.0"
    );
    setDescription(uom.description || "");
    setIsActive(uom.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Live UOM name change with real-time auto code generation
  const handleNameChange = (val) => {
    setUomName(val);
    if (fieldErrors.uomName) {
      setFieldErrors((prev) => ({ ...prev, uomName: null }));
    }
    if (!isCodeManual) {
      const generated = generateUomCode(val);
      setUomCode(generated);
      if (fieldErrors.uomCode) {
        setFieldErrors((prev) => ({ ...prev, uomCode: null }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!uomCode.trim()) {
      errors.uomCode = "UOM Code is required.";
    } else if (!/^[A-Z0-9_-]{1,15}$/i.test(uomCode.trim())) {
      errors.uomCode = "Code must be 1-15 alphanumeric characters (e.g. KG, LTR, TAB, NOS).";
    }

    if (!uomName.trim()) {
      errors.uomName = "UOM Name is required.";
    } else if (uomName.trim().length < 2) {
      errors.uomName = "UOM Name must be at least 2 characters long.";
    }

    if (
      conversionFactor !== "" &&
      (isNaN(Number(conversionFactor)) || Number(conversionFactor) <= 0)
    ) {
      errors.conversionFactor = "Conversion factor must be a valid number greater than 0.";
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
        uomCode: uomCode.trim().toUpperCase(),
        uomName: uomName.trim(),
        conversionFactor:
          conversionFactor !== "" ? parseFloat(conversionFactor) : 1.0,
        description: description.trim() || undefined,
        isActive,
      };

      const url = editingUom
        ? `${API_BASE_URL}/uom/${editingUom.id}`
        : `${API_BASE_URL}/uom`;

      const method = editingUom ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.message || "Failed to save UOM.");
        customToast.error(result.message || "Failed to save UOM.");
        return;
      }

      customToast.success(
        editingUom
          ? "UOM updated successfully."
          : "UOM registered successfully."
      );
      setFormDialogOpen(false);
      resetForm();
      fetchUoms();
    } catch (err) {
      console.error("Error saving UOM:", err);
      setFormError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (uom) => {
    setUomToDelete(uom);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!uomToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/uom/${uomToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        customToast.error(data.message || "Failed to delete UOM.");
        return;
      }
      customToast.success("UOM deleted successfully.");
      setDeleteConfirmOpen(false);
      setUomToDelete(null);
      fetchUoms();
    } catch (error) {
      console.error("Error deleting UOM:", error);
      customToast.error("An error occurred while deleting UOM.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "uomCode",
      header: "UOM Code",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded-md text-foreground border">
            {item.uomCode}
          </span>
        );
      },
    },
    {
      accessorKey: "uomName",
      header: "UOM Name",
      cell: (row) => {
        const item = row?.original || row;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">
              {item.uomName}
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
      accessorKey: "conversionFactor",
      header: "Conversion Factor",
      cell: (row) => {
        const item = row?.original || row;
        const factor = item.conversionFactor ?? 1.0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Hash className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold text-foreground">{factor}</span>
            <span className="text-muted-foreground text-[11px]">(Base x {factor})</span>
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
              title="Edit UOM"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(item)}
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete UOM"
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
        title="UOM Master (Unit of Measurement)"
        description="Configure standard metric units, dosage forms, packaging sizes, and conversion factors."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters" },
          { label: "UOM Master" },
        ]}
      >
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add UOM
        </Button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Units
              </p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Units
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
                Inactive Units
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
              Unit of Measurement (UOM) Registry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Filter, search, sort, and manage pharmaceutical packaging units and conversion multipliers
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-transparent">
          <DataTable
            columns={columns}
            data={uoms}
            loading={loading}
            searchPlaceholder="Search UOM by code, name or description..."
            emptyMessage="No UOM master records found"
            emptyDescription="Create a new measurement unit by clicking Add UOM."
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
              <Scale className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  {editingUom
                    ? `Modify UOM: ${editingUom.uomName}`
                    : "Register New UOM Master"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Configure measurement codes, dosage unit names, and conversion multipliers.
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
                <Scale className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Unit Specification
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* UOM Name (First for intuitive flow) */}
                <div className="space-y-1.5">
                  <Label htmlFor="uomName" className="text-xs font-bold text-foreground">
                    UOM Name *
                  </Label>
                  <Input
                    id="uomName"
                    placeholder="e.g. Kilogram, Litre, Tablet, Strip"
                    value={uomName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`text-xs h-10 rounded-xl bg-muted/50 ${
                      fieldErrors.uomName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.uomName && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.uomName}
                    </p>
                  )}
                </div>

                {/* UOM Code (Auto-derived & Editable) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="uomCode" className="text-xs font-bold text-foreground">
                      UOM Code *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = generateUomCode(uomName);
                        if (auto) {
                          setUomCode(auto);
                          setIsCodeManual(false);
                          if (fieldErrors.uomCode) {
                            setFieldErrors((prev) => ({ ...prev, uomCode: null }));
                          }
                        }
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Auto-derive code from unit name"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-derive
                    </button>
                  </div>
                  <Input
                    id="uomCode"
                    placeholder="e.g. KG, LTR, TAB, NOS"
                    value={uomCode}
                    onChange={(e) => {
                      setUomCode(e.target.value.toUpperCase());
                      setIsCodeManual(true);
                      if (fieldErrors.uomCode) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          uomCode: null,
                        }));
                      }
                    }}
                    className={`text-xs h-10 rounded-xl bg-muted/50 font-mono font-bold ${
                      fieldErrors.uomCode
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.uomCode && (
                    <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.uomCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Conversion Factor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="conversionFactor"
                    className="text-xs font-bold text-foreground"
                  >
                    Conversion Factor (Optional multiplier)
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Default: 1.0 (Base unit)
                  </span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input
                    id="conversionFactor"
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 1.0, 1000, 0.001"
                    value={conversionFactor}
                    onChange={(e) => {
                      setConversionFactor(e.target.value);
                      if (fieldErrors.conversionFactor) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          conversionFactor: null,
                        }));
                      }
                    }}
                    className={`text-xs h-10 pl-9 rounded-xl bg-muted/50 font-mono ${
                      fieldErrors.conversionFactor
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                </div>
                {fieldErrors.conversionFactor && (
                  <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.conversionFactor}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs font-bold text-foreground"
                >
                  Description & Measuring Guidelines
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Provide measurement context (e.g. Base metric unit for bulk chemicals)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs rounded-xl bg-muted/50 border-border"
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">
                    Active Status
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable this unit in product master dropdowns and gate pass manifests.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
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
                  : editingUom
                  ? "Save Changes"
                  : "Register UOM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete UOM Record"
        description={`Are you sure you want to delete measurement unit "${uomToDelete?.uomName}" (${uomToDelete?.uomCode})? This action cannot be undone.`}
        confirmText="Delete UOM"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
