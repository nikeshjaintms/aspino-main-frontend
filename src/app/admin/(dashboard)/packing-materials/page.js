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
  DialogHeader,
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
  Boxes,
  Edit,
  Trash2,
  Eye,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  IndianRupee,
  FileCheck,
  Thermometer,
  Sparkles,
  Scale,
  Building2,
  CheckCircle2,
  Package,
  X,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generatePackingMaterialCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const STORAGE_OPTIONS = [
  "Ambient (15°C - 25°C)",
  "Cool & Dry Place (Below 25°C)",
  "Cold Storage (2°C - 8°C)",
  "Dry & Moisture Free (RH < 60%)",
  "Protect from Direct Sunlight",
];

export default function PackingMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [qcSpecs, setQcSpecs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [primaryCount, setPrimaryCount] = useState(0);
  const [secondaryCount, setSecondaryCount] = useState(0);
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
  const [viewMaterial, setViewMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [materialCode, setMaterialCode] = useState("");
  const [type, setType] = useState("PRIMARY");
  const [description, setDescription] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [supplierInput, setSupplierInput] = useState("");
  const [linkedSpecification, setLinkedSpecification] = useState("");
  const [uom, setUom] = useState("");
  const [standardCost, setStandardCost] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [storageCondition, setStorageCondition] = useState("Ambient (15°C - 25°C)");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Auxiliary Master Data
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [supRes, uomRes, qcRes] = await Promise.all([
          fetch(`${API_BASE_URL}/supplier`).catch(() => null),
          fetch(`${API_BASE_URL}/uom`).catch(() => null),
          fetch(`${API_BASE_URL}/qc-specification`).catch(() => null),
        ]);

        if (supRes && supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(Array.isArray(supData) ? supData : supData.data || []);
        }
        if (uomRes && uomRes.ok) {
          const uomData = await uomRes.json();
          setUoms(Array.isArray(uomData) ? uomData : uomData.data || []);
        }
        if (qcRes && qcRes.ok) {
          const qcData = await qcRes.json();
          setQcSpecs(Array.isArray(qcData) ? qcData : qcData.data || []);
        }
      } catch (err) {
        console.error("Failed to load auxiliary data", err);
      }
    };
    fetchAuxData();
  }, []);

  // Fetch Packing Materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) queryParams.append("search", debouncedSearch.trim());
      if (typeFilter && typeFilter !== "ALL") queryParams.append("type", typeFilter);
      if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/packing-material?${queryParams.toString()}`);
      if (!res.ok) {
        setMaterials([]);
        return;
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      const meta = json.meta || {};

      setMaterials(list);
      setTotalCount(meta.total ?? list.length);
      setActiveCount(meta.active ?? list.filter((m) => m.isActive).length);
      setPrimaryCount(meta.primary ?? list.filter((m) => m.type === "PRIMARY").length);
      setSecondaryCount(meta.secondary ?? list.filter((m) => m.type === "SECONDARY").length);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      customToast.error("Failed to fetch packing materials");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [debouncedSearch, typeFilter, statusFilter, currentPage, pageSize]);

  // Code Auto-Generation
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    if (!isCodeManual && !editingMaterial) {
      const autoCode = generatePackingMaterialCode(val, type);
      setMaterialCode(autoCode);
      if (fieldErrors.materialCode) {
        setFieldErrors((prev) => ({ ...prev, materialCode: null }));
      }
    }
    if (fieldErrors.description) {
      setFieldErrors((prev) => ({ ...prev, description: null }));
    }
  };

  const handleTypeChange = (val) => {
    setType(val);
    if (fieldErrors.type) {
      setFieldErrors((prev) => ({ ...prev, type: null }));
    }
    if (!isCodeManual && !editingMaterial && description.trim()) {
      const autoCode = generatePackingMaterialCode(description, val);
      setMaterialCode(autoCode);
      if (fieldErrors.materialCode) {
        setFieldErrors((prev) => ({ ...prev, materialCode: null }));
      }
    }
  };

  // Add Supplier helper
  const handleAddSupplier = (name) => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (!selectedSuppliers.includes(trimmed)) {
      setSelectedSuppliers((prev) => [...prev, trimmed]);
    }
    setSupplierInput("");
  };

  const handleRemoveSupplier = (sup) => {
    setSelectedSuppliers((prev) => prev.filter((s) => s !== sup));
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setMaterialCode("");
    setType("");
    setDescription("");
    setSelectedSuppliers([]);
    setSupplierInput("");
    setLinkedSpecification("");
    setUom("");
    setStandardCost("");
    setMinimumStock("");
    setStorageCondition("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (mat) => {
    setEditingMaterial(mat);
    setMaterialCode(mat.materialCode || "");
    setType(mat.type || "");
    setDescription(mat.description || "");
    const parsedSuppliers = Array.isArray(mat.approvedSuppliers)
      ? mat.approvedSuppliers
      : typeof mat.approvedSuppliers === "string"
      ? JSON.parse(mat.approvedSuppliers || "[]")
      : [];
    setSelectedSuppliers(parsedSuppliers);
    setSupplierInput("");
    const matchUom = uoms.find((u) => u.id === mat.uom || u.uomCode === mat.uom);
    setUom(matchUom ? matchUom.id : mat.uom || "");
    const matchSpec = qcSpecs.find((s) => s.id === mat.linkedSpecification || s.specCode === mat.linkedSpecification);
    setLinkedSpecification(matchSpec ? matchSpec.id : mat.linkedSpecification || "");
    setStandardCost(mat.standardCost !== undefined ? String(mat.standardCost) : "");
    setMinimumStock(mat.minimumStock !== undefined ? String(mat.minimumStock) : "");
    setStorageCondition(mat.storageCondition || "");
    setIsActive(mat.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open View Dialog
  const handleOpenView = (mat) => {
    setViewMaterial(mat);
    setDetailsDialogOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};

    if (!type) {
      errors.type = "Packaging Type is required.";
    }

    if (!materialCode.trim()) {
      errors.materialCode = "Material Code is required.";
    } else if (!/^[A-Z0-9_-]{2,30}$/i.test(materialCode.trim())) {
      errors.materialCode = "Material Code must be 2-30 alphanumeric characters.";
    }

    if (!description.trim()) {
      errors.description = "Material Description is required.";
    } else if (description.trim().length < 2) {
      errors.description = "Description must be at least 2 characters.";
    }

    if (!uom || !uom.trim()) {
      errors.uom = "Unit of Measure (UOM) is required.";
    }

    if (!linkedSpecification || !linkedSpecification.trim() || linkedSpecification === "none") {
      errors.linkedSpecification = "Linked QC Specification is required.";
    }

    if (selectedSuppliers.length === 0) {
      errors.selectedSuppliers = "At least one approved supplier is required.";
    }

    if (standardCost === "" || standardCost === null || isNaN(Number(standardCost)) || Number(standardCost) < 0) {
      errors.standardCost = "Valid Standard Cost (>= 0) is required.";
    }

    if (minimumStock === "" || minimumStock === null || isNaN(Number(minimumStock)) || Number(minimumStock) < 0) {
      errors.minimumStock = "Valid Minimum Stock Level (>= 0) is required.";
    }

    if (!storageCondition) {
      errors.storageCondition = "Storage Condition is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create / Edit
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
        materialCode: materialCode.trim().toUpperCase(),
        type,
        description: description.trim(),
        approvedSuppliers: selectedSuppliers,
        linkedSpecification: linkedSpecification.trim() || undefined,
        uom: uom.trim(),
        standardCost: standardCost ? parseFloat(standardCost) : 0,
        minimumStock: minimumStock ? parseFloat(minimumStock) : 0,
        storageCondition: storageCondition.trim() || undefined,
        isActive,
      };

      const url = editingMaterial
        ? `${API_BASE_URL}/packing-material/${editingMaterial.id}`
        : `${API_BASE_URL}/packing-material`;
      const method = editingMaterial ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save packing material");
      }

      customToast.success(
        editingMaterial
          ? "Packing Material updated successfully"
          : "Packing Material created successfully"
      );
      setFormDialogOpen(false);
      fetchMaterials();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred");
      customToast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status directly from table
  const handleToggleStatus = async (mat) => {
    try {
      const res = await fetch(`${API_BASE_URL}/packing-material/${mat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !mat.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setMaterials((prev) =>
        prev.map((item) =>
          item.id === mat.id ? { ...item, isActive: !item.isActive } : item
        )
      );
      customToast.success(`Material ${!mat.isActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      customToast.error(err.message || "Failed to toggle status");
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/packing-material/${materialToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete packing material");
      }

      customToast.success("Packing Material deleted successfully");
      setDeleteConfirmOpen(false);
      setMaterialToDelete(null);
      fetchMaterials();
    } catch (err) {
      customToast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: "Material Code",
      accessorKey: "materialCode",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm tracking-wide">
                {item?.materialCode}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const type = item?.type;
        let color = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
        if (type === "SECONDARY") {
          color = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
        } else if (type === "TERTIARY") {
          color = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800";
        }
        return (
          <Badge variant="outline" className={`font-semibold px-2 py-0.5 text-xs ${color}`}>
            {type}
          </Badge>
        );
      },
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="max-w-xs truncate font-medium text-sm text-foreground" title={item?.description}>
            {item?.description}
          </div>
        );
      },
    },
    {
      header: "Approved Suppliers",
      accessorKey: "approvedSuppliers",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const raw = item?.approvedSuppliers;
        const list = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
          ? JSON.parse(raw || "[]")
          : [];
        if (!list || list.length === 0) {
          return <span className="text-xs text-muted-foreground italic">None Listed</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {list.slice(0, 2).map((sup, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[11px] py-0.5 px-2 font-medium bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 truncate max-w-[150px]"
                title={sup}
              >
                {sup}
              </Badge>
            ))}
            {list.length > 2 && (
              <Badge variant="outline" className="text-[10px] py-0.5 px-1.5 font-semibold text-muted-foreground bg-muted/50 border-border">
                +{list.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Linked Spec",
      accessorKey: "linkedSpecification",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const foundSpec = qcSpecs.find((s) => s.id === item?.linkedSpecification || s.specCode === item?.linkedSpecification);
        const specDisp = foundSpec ? foundSpec.specCode : item?.linkedSpecification;
        return specDisp ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs">
            {specDisp}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      header: "UOM",
      accessorKey: "uom",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const foundUom = uoms.find((u) => u.id === item?.uom || u.uomCode === item?.uom);
        const code = foundUom ? foundUom.uomCode : item?.uom;
        return (
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md"
          >
            {code || "—"}
          </Badge>
        );
      },
    },
    {
      header: "Standard Cost",
      accessorKey: "standardCost",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <span className="font-medium text-sm text-foreground">
            ₹{(item?.standardCost || 0).toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={item?.isActive}
              onCheckedChange={() => handleToggleStatus(item)}
            />
            <Badge
              variant={item?.isActive ? "default" : "secondary"}
              className={
                item?.isActive
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium text-[11px]"
              }
            >
              {item?.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const mat = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenView(mat)}
              className="h-8 text-xs font-semibold text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg gap-1.5 px-2.5 transition-colors"
              title="Show details"
            >
              <Eye className="h-3.5 w-3.5" />
              Show
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
              title="Edit Material"
              onClick={() => handleOpenEdit(mat)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Material"
              onClick={() => {
                setMaterialToDelete(mat);
                setDeleteConfirmOpen(true);
              }}
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
      {/* Header */}
      <PageHeader
        title="Packing Material Master"
        description="Manage primary, secondary, and tertiary pharmaceutical packaging materials, specifications & approved suppliers."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters", href: "#" },
          { label: "Packing Materials" },
        ]}
      >
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Packing Material
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Materials</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Packaging</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{primaryCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secondary Packaging</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{secondaryCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Status</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Packaging Material Directory</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Browse, filter, and maintain approved pharmaceutical packaging inventory specifications
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-40">
                <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="PRIMARY">Primary Packaging</SelectItem>
                    <SelectItem value="SECONDARY">Secondary Packaging</SelectItem>
                    <SelectItem value="TERTIARY">Tertiary Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active Only</SelectItem>
                    <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={materials}
            loading={loading}
            searchKey="description"
            searchValue={search}
            onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
            searchPlaceholder="Search material code, description, UOM, or linked spec..."
            pagination={{
              pageIndex: currentPage - 1,
              pageSize: pageSize,
              pageCount: totalPages,
              total: totalCount,
            }}
            onPaginationChange={({ pageIndex, pageSize: newPageSize }) => {
              setCurrentPage(pageIndex + 1);
              setPageSize(newPageSize);
            }}
          />
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-2 opacity-10">
              <Boxes className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {editingMaterial ? `Edit Material: ${editingMaterial.materialCode}` : "Register New Packing Material"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300 mt-0.5">
                    {editingMaterial
                      ? "Update configuration, specifications & approved suppliers"
                      : "Define packaging item parameters, QC specifications & approved supplier registry"}
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 mr-6">
                <span className={`text-xs font-semibold px-3 py-1 rounded-xl backdrop-blur-md border ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-white/10 text-slate-300 border-white/10"
                }`}>
                  {isActive ? "Status: Active" : "Status: Inactive"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-6 space-y-5 bg-card flex-1 overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: General Packaging Material Profile */}
              <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. Packaging Material Classification & Specs
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Packaging Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Packaging Type <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={handleTypeChange}>
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.type ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIMARY">Primary Packaging (Direct Drug Contact)</SelectItem>
                        <SelectItem value="SECONDARY">Secondary Packaging (Boxes / Cartons)</SelectItem>
                        <SelectItem value="TERTIARY">Tertiary Packaging (Shippers / Pallets)</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.type && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.type}
                      </p>
                    )}
                  </div>

                  {/* Material Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">
                        Material Code <span className="text-rose-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCodeManual(!isCodeManual);
                          if (isCodeManual && description) {
                            setMaterialCode(generatePackingMaterialCode(description, type));
                            if (fieldErrors.materialCode) {
                              setFieldErrors((prev) => ({ ...prev, materialCode: null }));
                            }
                          }
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Sparkles className="h-3 w-3" />
                        {isCodeManual ? "Auto Generate" : "Edit Manually"}
                      </button>
                    </div>
                    <Input
                      value={materialCode}
                      onChange={(e) => {
                        setMaterialCode(e.target.value.toUpperCase());
                        setIsCodeManual(true);
                        if (fieldErrors.materialCode) {
                          setFieldErrors((prev) => ({ ...prev, materialCode: null }));
                        }
                      }}
                      placeholder="e.g. PKG-PRI-ALU"
                      className={`h-10 text-xs font-mono font-bold uppercase bg-background ${fieldErrors.materialCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {fieldErrors.materialCode && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.materialCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Material Description / Specification Title <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="e.g. Aluminium Blister Foil 25 Micron Printed for Paracetamol 500mg Tablets"
                    className={`text-xs resize-none bg-background ${fieldErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {fieldErrors.description && (
                    <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {fieldErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* UOM */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Unit of Measurement (UOM) <span className="text-rose-500">*</span>
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
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.uom ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.filter((u) => u.isActive !== false).length > 0 ? (
                          uoms
                            .filter((u) => u.isActive !== false || u.id === uom)
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.uomCode} - {u.uomName}
                              </SelectItem>
                            ))
                        ) : (
                          <>
                            <SelectItem value="ROLL">ROLL - Roll</SelectItem>
                            <SelectItem value="NOS">NOS - Numbers</SelectItem>
                            <SelectItem value="KG">KG - Kilogram</SelectItem>
                            <SelectItem value="BOX">BOX - Box</SelectItem>
                            <SelectItem value="MTR">MTR - Meter</SelectItem>
                            <SelectItem value="PCS">PCS - Pieces</SelectItem>
                          </>
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

                  {/* Linked QC Specification */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Linked QC Specification <span className="text-rose-500">*</span>
                    </Label>
                    {qcSpecs.length > 0 ? (
                      <Select
                        value={linkedSpecification}
                        onValueChange={(val) => {
                          setLinkedSpecification(val);
                          if (fieldErrors.linkedSpecification) {
                            setFieldErrors((prev) => ({ ...prev, linkedSpecification: null }));
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.linkedSpecification ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                          <SelectValue placeholder="Select Linked QC Spec" />
                        </SelectTrigger>
                        <SelectContent>
                          {qcSpecs
                            .filter((spec) => (spec.isActive !== false && spec.status !== "OBSOLETE") || spec.id === linkedSpecification)
                            .map((spec) => (
                              <SelectItem key={spec.id} value={spec.id}>
                                {spec.specCode} ({spec.itemName})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={linkedSpecification}
                        onChange={(e) => {
                          setLinkedSpecification(e.target.value);
                          if (fieldErrors.linkedSpecification) {
                            setFieldErrors((prev) => ({ ...prev, linkedSpecification: null }));
                          }
                        }}
                        placeholder="e.g. SPEC-PKG-ALU-001 Rev 2"
                        className={`h-10 text-xs bg-background ${fieldErrors.linkedSpecification ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                    )}
                    {fieldErrors.linkedSpecification && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.linkedSpecification}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Approved Suppliers & Inventory Specs */}
              <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Approved Vendors & Storage Parameters
                  </h4>
                </div>

                {/* Approved Suppliers Multi-Select & Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    Approved Supplier(s) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    {suppliers.length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(val) => {
                          if (val) {
                            handleAddSupplier(val);
                            if (fieldErrors.selectedSuppliers) {
                              setFieldErrors((prev) => ({ ...prev, selectedSuppliers: null }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 text-xs flex-1 bg-background ${fieldErrors.selectedSuppliers ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                          <SelectValue placeholder="+ Select and add supplier from Master..." />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers
                            .filter((sup) => sup.isActive !== false)
                            .map((sup) => {
                              const disp = sup.code || sup.supplierCode
                                ? `[${sup.code || sup.supplierCode}] ${sup.name || sup.supplierName || ""}`.trim()
                                : sup.name || sup.supplierName || "Supplier";
                              const isAlreadySelected = selectedSuppliers.includes(disp);
                              return (
                                <SelectItem
                                  key={sup.id}
                                  value={disp}
                                  disabled={isAlreadySelected}
                                  className={isAlreadySelected ? "opacity-50 font-normal" : "font-medium"}
                                >
                                  {disp} {isAlreadySelected ? " (Added)" : ""}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={supplierInput}
                        onChange={(e) => setSupplierInput(e.target.value)}
                        placeholder="Type supplier name and click Add"
                        className={`h-10 text-xs flex-1 bg-background ${fieldErrors.selectedSuppliers ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSupplier(supplierInput);
                            if (fieldErrors.selectedSuppliers) {
                              setFieldErrors((prev) => ({ ...prev, selectedSuppliers: null }));
                            }
                          }
                        }}
                      />
                    )}
                    {suppliers.length === 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 text-xs px-4 rounded-xl"
                        onClick={() => {
                          handleAddSupplier(supplierInput);
                          if (fieldErrors.selectedSuppliers) {
                            setFieldErrors((prev) => ({ ...prev, selectedSuppliers: null }));
                          }
                        }}
                      >
                        Add
                      </Button>
                    )}
                  </div>

                  {fieldErrors.selectedSuppliers && (
                    <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {fieldErrors.selectedSuppliers}
                    </p>
                  )}

                  {/* Selected Suppliers Chips */}
                  {selectedSuppliers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/40 rounded-xl border border-border/80 shadow-2xs">
                      {selectedSuppliers.map((sup, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200 border border-sky-300 dark:border-sky-800 shadow-2xs transition-all animate-in fade-in zoom-in-95 duration-150"
                        >
                          <Building2 className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                          <span className="truncate max-w-[280px]">{sup}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplier(sup)}
                            className="text-sky-700 dark:text-sky-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 p-0.5 rounded-md transition-colors ml-0.5 cursor-pointer"
                            title="Remove supplier"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Standard Cost */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Standard Cost (₹) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={standardCost}
                        onChange={(e) => {
                          setStandardCost(e.target.value);
                          if (fieldErrors.standardCost) {
                            setFieldErrors((prev) => ({ ...prev, standardCost: null }));
                          }
                        }}
                        placeholder="0.00"
                        className={`h-10 text-xs pl-7 bg-background ${fieldErrors.standardCost ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                    </div>
                    {fieldErrors.standardCost && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.standardCost}
                      </p>
                    )}
                  </div>

                  {/* Minimum Stock */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Min Stock Alert Level <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={minimumStock}
                      onChange={(e) => {
                        setMinimumStock(e.target.value);
                        if (fieldErrors.minimumStock) {
                          setFieldErrors((prev) => ({ ...prev, minimumStock: null }));
                        }
                      }}
                      placeholder="e.g. 100"
                      className={`h-10 text-xs bg-background ${fieldErrors.minimumStock ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {fieldErrors.minimumStock && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.minimumStock}
                      </p>
                    )}
                  </div>

                  {/* Storage Condition */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Storage Condition <span className="text-rose-500">*</span>
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
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.storageCondition ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {STORAGE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
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

              {/* Status Switch */}
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/60 rounded-2xl">
                <div>
                  <Label className="text-xs font-bold text-foreground">Material Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">Inactive materials cannot be selected on gate passes or bills of materials</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold">{isActive ? "Active" : "Inactive"}</span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-muted/30 flex items-center justify-end gap-3 rounded-b-3xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={submitting}
                className="h-10 text-xs rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-6 shadow-sm"
              >
                {submitting ? "Saving..." : editingMaterial ? "Update Material" : "Create Material"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-w-2xl w-[95vw] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Boxes className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {viewMaterial?.materialCode}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    {viewMaterial?.type} Packaging Material Details
                  </DialogDescription>
                </div>
              </div>
              <Badge className={viewMaterial?.isActive ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}>
                {viewMaterial?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {viewMaterial && (
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-muted/30 rounded-2xl border border-border/50 space-y-1">
                <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Description</p>
                <p className="text-sm font-semibold text-foreground">{viewMaterial.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <span className="text-muted-foreground text-[11px] block">Type</span>
                  <span className="font-bold text-foreground text-xs">{viewMaterial.type}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <span className="text-muted-foreground text-[11px] block">UOM</span>
                  <span className="font-bold text-foreground text-xs">
                    {(() => {
                      const foundUom = uoms.find((u) => u.id === viewMaterial.uom || u.uomCode === viewMaterial.uom);
                      return foundUom ? `${foundUom.uomCode} - ${foundUom.uomName}` : viewMaterial.uom;
                    })()}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <span className="text-muted-foreground text-[11px] block">Standard Cost</span>
                  <span className="font-bold text-foreground text-xs">₹{(viewMaterial.standardCost || 0).toFixed(2)}</span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40">
                  <span className="text-muted-foreground text-[11px] block">Min Stock Alert</span>
                  <span className="font-bold text-foreground text-xs">
                    {viewMaterial.minimumStock || 0}{" "}
                    {(() => {
                      const foundUom = uoms.find((u) => u.id === viewMaterial.uom || u.uomCode === viewMaterial.uom);
                      return foundUom ? foundUom.uomCode : viewMaterial.uom;
                    })()}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40 col-span-2">
                  <span className="text-muted-foreground text-[11px] block">Linked QC Specification</span>
                  <span className="font-bold text-foreground text-xs">
                    {(() => {
                      const foundSpec = qcSpecs.find((s) => s.id === viewMaterial.linkedSpecification || s.specCode === viewMaterial.linkedSpecification);
                      return foundSpec ? `${foundSpec.specCode} (${foundSpec.itemName})` : viewMaterial.linkedSpecification || "None / Standard Direct";
                    })()}
                  </span>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-border/40 col-span-2">
                  <span className="text-muted-foreground text-[11px] block">Storage Condition</span>
                  <span className="font-bold text-foreground text-xs">{viewMaterial.storageCondition || "Ambient"}</span>
                </div>
              </div>

              <div className="p-3.5 bg-muted/30 rounded-2xl border border-border/50">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block mb-2">Approved Suppliers</span>
                {Array.isArray(viewMaterial.approvedSuppliers) && viewMaterial.approvedSuppliers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewMaterial.approvedSuppliers.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No approved suppliers linked.</p>
                )}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border/50 bg-muted/30 flex items-center justify-end rounded-b-3xl">
            <Button variant="outline" size="sm" onClick={() => setDetailsDialogOpen(false)} className="rounded-xl px-5">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Packing Material"
        description={`Are you sure you want to permanently delete packing material "${materialToDelete?.materialCode}"? This action cannot be undone.`}
        confirmText="Delete Material"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
