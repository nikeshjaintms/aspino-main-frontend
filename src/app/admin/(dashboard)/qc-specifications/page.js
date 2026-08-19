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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Plus,
  ClipboardCheck,
  Edit,
  Trash2,
  Eye,
  Layers,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Calendar,
  Package,
  Boxes,
  Beaker,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  X,
  Printer,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateQcSpecCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Standard QC Parameter Presets for quick autofill
const QC_PRESETS = {
  PRODUCT: [
    { parameterName: "Description / Appearance", testMethod: "Visual Inspection", acceptableLimits: "White circular biconvex tablets, plain on both sides", uom: "N/A" },
    { parameterName: "Identification (Assay)", testMethod: "HPLC / UV-Vis (IP/USP)", acceptableLimits: "Positive for active drug substance", uom: "N/A" },
    { parameterName: "Average Weight", testMethod: "Analytical Balance (USP <2091>)", acceptableLimits: "550 mg ± 5% (522.5 mg - 577.5 mg)", uom: "mg" },
    { parameterName: "Disintegration Time", testMethod: "USP Apparatus (<701>)", acceptableLimits: "NMT 15 minutes", uom: "Mins" },
    { parameterName: "Assay (Purity)", testMethod: "HPLC (USP/BP)", acceptableLimits: "95.0% - 105.0% of labeled claim", uom: "%" },
    { parameterName: "Dissolution", testMethod: "USP Apparatus II (Paddle, 50 RPM)", acceptableLimits: "NLT 80% (Q) in 30 minutes", uom: "%" },
  ],
  PACKING_MATERIAL: [
    { parameterName: "Visual Description & Printing", testMethod: "Visual vs Approved Artwork", acceptableLimits: "Clean, legible printing without smudges or streaks", uom: "N/A" },
    { parameterName: "Grammage / Thickness", testMethod: "Micrometer Gauge", acceptableLimits: "25 Micron ± 2 Micron", uom: "µm" },
    { parameterName: "Pin Hole Test", testMethod: "Light Box / Optical Inspection", acceptableLimits: "Zero pin holes per meter square", uom: "Nos/m²" },
    { parameterName: "Seal Integrity / Burst Strength", testMethod: "Bursting Strength Tester", acceptableLimits: "NLT 150 kPa", uom: "kPa" },
  ],
  RAW_MATERIAL: [
    { parameterName: "Appearance / Color", testMethod: "Visual Inspection", acceptableLimits: "White or almost white crystalline powder", uom: "N/A" },
    { parameterName: "Solubility", testMethod: "USP / IP Protocol", acceptableLimits: "Freely soluble in ethanol, sparingly soluble in water", uom: "N/A" },
    { parameterName: "Assay (Anhydrous Basis)", testMethod: "Potentiometric Titration / HPLC", acceptableLimits: "99.0% - 101.0%", uom: "%" },
    { parameterName: "Loss on Drying (LOD)", testMethod: "Halogen / Oven 105°C", acceptableLimits: "NMT 0.5% w/w", uom: "%" },
  ],
};

export default function QcSpecificationsPage() {
  const [specs, setSpecs] = useState([]);
  const [products, setProducts] = useState([]);
  const [packingMaterials, setPackingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);
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
  const [viewSpec, setViewSpec] = useState(null);
  const [editingSpec, setEditingSpec] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [specToDelete, setSpecToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [specCode, setSpecCode] = useState("");
  const [productMaterialCode, setProductMaterialCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("PRODUCT");
  const [testParameters, setTestParameters] = useState([]);
  const [testMethod, setTestMethod] = useState("IP / BP / USP Standard Testing Protocol");
  const [acceptableLimits, setAcceptableLimits] = useState("");
  const [versionNo, setVersionNo] = useState("v1.0");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [reviewDate, setReviewDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [preparedBy, setPreparedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Products and Packing Materials for linking
  const fetchLinkedItems = async () => {
    try {
      const [prodRes, pkgRes] = await Promise.all([
        fetch(`${API_BASE_URL}/product`).catch(() => null),
        fetch(`${API_BASE_URL}/packing-material`).catch(() => null),
      ]);
      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.data || []);
      }
      if (pkgRes && pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPackingMaterials(Array.isArray(pkgData) ? pkgData : pkgData.data || []);
      }
    } catch (err) {
      console.error("Failed to load linked items", err);
    }
  };

  useEffect(() => {
    fetchLinkedItems();
  }, []);

  // Fetch QC Specifications
  const fetchSpecs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) queryParams.append("search", debouncedSearch.trim());
      if (itemTypeFilter && itemTypeFilter !== "ALL") queryParams.append("itemType", itemTypeFilter);
      if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/qc-specification?${queryParams.toString()}`);
      if (!res.ok) {
        setSpecs([]);
        return;
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      const meta = json.meta || {};

      setSpecs(list);
      setTotalCount(meta.total ?? list.length);
      setActiveCount(meta.active ?? list.filter((s) => s.status === "ACTIVE").length);
      setProductCount(meta.product ?? list.filter((s) => s.itemType === "PRODUCT").length);
      setMaterialCount(meta.material ?? list.filter((s) => s.itemType !== "PRODUCT").length);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      customToast.error("Failed to fetch QC specifications");
      setSpecs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, [debouncedSearch, itemTypeFilter, statusFilter, currentPage, pageSize]);

  // Code Auto-Generation
  const handleItemSelect = (code, name, type) => {
    setProductMaterialCode(code);
    setItemName(name);
    if (type) setItemType(type);
    if (fieldErrors.catalogItem) {
      setFieldErrors((prev) => ({ ...prev, catalogItem: null }));
    }
    if (fieldErrors.productMaterialCode) {
      setFieldErrors((prev) => ({ ...prev, productMaterialCode: null }));
    }
    if (fieldErrors.itemName) {
      setFieldErrors((prev) => ({ ...prev, itemName: null }));
    }
    if (!isCodeManual && !editingSpec) {
      const generated = generateQcSpecCode(code, versionNo);
      setSpecCode(generated);
      if (fieldErrors.specCode) {
        setFieldErrors((prev) => ({ ...prev, specCode: null }));
      }
    }
  };

  const handleVersionChange = (ver) => {
    setVersionNo(ver);
    if (!isCodeManual && !editingSpec && productMaterialCode) {
      const generated = generateQcSpecCode(productMaterialCode, ver);
      setSpecCode(generated);
      if (fieldErrors.specCode) {
        setFieldErrors((prev) => ({ ...prev, specCode: null }));
      }
    }
  };

  // Test Parameter Row Operations
  const handleAddParamRow = () => {
    setTestParameters((prev) => [
      ...prev,
      { parameterName: "", testMethod: "", acceptableLimits: "", uom: "" },
    ]);
    if (fieldErrors.testParameters) {
      setFieldErrors((prev) => ({ ...prev, testParameters: null }));
    }
  };

  const handleUpdateParamRow = (index, field, value) => {
    setTestParameters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (fieldErrors.testParameters) {
      setFieldErrors((prev) => ({ ...prev, testParameters: null }));
    }
  };

  const handleRemoveParamRow = (index) => {
    setTestParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadPreset = (type) => {
    const preset = QC_PRESETS[type] || [];
    setTestParameters([...preset]);
    if (fieldErrors.testParameters) {
      setFieldErrors((prev) => ({ ...prev, testParameters: null }));
    }
    customToast.success(`Loaded ${preset.length} default test parameters for ${type}`);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    fetchLinkedItems();
    setEditingSpec(null);
    setSpecCode("");
    setProductMaterialCode("");
    setItemName("");
    setItemType("");
    setTestParameters([]);
    setTestMethod("");
    setAcceptableLimits("");
    setVersionNo("");
    setEffectiveDate("");
    setReviewDate("");
    setStatus("");
    setPreparedBy("");
    setApprovedBy("");
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (spec) => {
    fetchLinkedItems();
    setEditingSpec(spec);
    setSpecCode(spec.specCode || "");
    setProductMaterialCode(spec.productMaterialCode || "");
    setItemName(spec.itemName || "");
    setItemType(spec.itemType || "");
    const parsedParams = Array.isArray(spec.testParameters)
      ? spec.testParameters
      : typeof spec.testParameters === "string"
      ? JSON.parse(spec.testParameters || "[]")
      : [];
    setTestParameters(parsedParams);
    setTestMethod(spec.testMethod || "");
    setAcceptableLimits(spec.acceptableLimits || "");
    setVersionNo(spec.versionNo || "");
    setEffectiveDate(
      spec.effectiveDate ? new Date(spec.effectiveDate).toISOString().split("T")[0] : ""
    );
    setReviewDate(
      spec.reviewDate ? new Date(spec.reviewDate).toISOString().split("T")[0] : ""
    );
    setStatus(spec.status || "");
    setPreparedBy(spec.preparedBy || "");
    setApprovedBy(spec.approvedBy || "");
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open View Dialog
  const handleOpenView = (spec) => {
    setViewSpec(spec);
    setDetailsDialogOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};

    if (!itemType) {
      errors.itemType = "Item Type is required.";
    }

    if (!productMaterialCode.trim()) {
      errors.catalogItem = "Master Catalog Item selection is required.";
      errors.productMaterialCode = "Product / Material Code is required.";
    }

    if (!itemName.trim()) {
      errors.itemName = "Item Name / Description is required.";
    } else if (itemName.trim().length < 2) {
      errors.itemName = "Item Name must be at least 2 characters.";
    }

    if (!specCode.trim()) {
      errors.specCode = "Specification Code is required.";
    } else if (!/^[A-Z0-9_-]{2,40}$/i.test(specCode.trim())) {
      errors.specCode = "Specification Code must be 2-40 alphanumeric characters.";
    }

    if (!versionNo.trim()) {
      errors.versionNo = "Revision / Version is required (e.g. v1.0).";
    }

    if (!status) {
      errors.status = "QC Status is required.";
    }

    if (!effectiveDate) {
      errors.effectiveDate = "Effective Date is required.";
    }

    if (!reviewDate) {
      errors.reviewDate = "Next Review Date is required.";
    }

    if (testParameters.length === 0) {
      errors.testParameters = "At least one test parameter row is required.";
    } else {
      const hasEmptyParams = testParameters.some(
        (p) =>
          !p.parameterName ||
          !p.parameterName.trim() ||
          !p.testMethod ||
          !p.testMethod.trim() ||
          !p.acceptableLimits ||
          !p.acceptableLimits.trim() ||
          !p.uom ||
          !p.uom.trim()
      );
      if (hasEmptyParams) {
        errors.testParameters = "All test parameter fields (Parameter Name, Test Method, Acceptable Limits, and UOM) in every row are required.";
      }
    }

    if (!preparedBy.trim()) {
      errors.preparedBy = "Prepared / Analyzed By is required.";
    }

    if (!approvedBy.trim()) {
      errors.approvedBy = "Approved By (QA Head) is required.";
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
        specCode: specCode.trim().toUpperCase(),
        productMaterialCode: productMaterialCode.trim().toUpperCase(),
        itemName: itemName.trim(),
        itemType,
        testParameters,
        testMethod: testMethod.trim() || undefined,
        acceptableLimits: acceptableLimits.trim() || undefined,
        versionNo: versionNo.trim(),
        effectiveDate: effectiveDate || new Date().toISOString(),
        reviewDate: reviewDate || undefined,
        status,
        preparedBy: preparedBy.trim() || undefined,
        approvedBy: approvedBy.trim() || undefined,
      };

      const url = editingSpec
        ? `${API_BASE_URL}/qc-specification/${editingSpec.id}`
        : `${API_BASE_URL}/qc-specification`;
      const method = editingSpec ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save QC specification");
      }

      customToast.success(
        editingSpec
          ? "QC Specification updated successfully"
          : "QC Specification created successfully"
      );
      setFormDialogOpen(false);
      fetchSpecs();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred");
      customToast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!specToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/qc-specification/${specToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete QC specification");
      }

      customToast.success("QC Specification deleted successfully");
      setDeleteConfirmOpen(false);
      setSpecToDelete(null);
      fetchSpecs();
    } catch (err) {
      customToast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: "Product / Material Code",
      accessorKey: "productMaterialCode",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const type = item?.itemType || "";
        let typeColor = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
        if (type === "PACKING_MATERIAL") {
          typeColor = "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800";
        } else if (type === "RAW_MATERIAL") {
          typeColor = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
        }

        return (
          <div className="flex flex-col gap-1 max-w-[240px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                {item?.productMaterialCode || "—"}
              </span>
              {type && (
                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-medium ${typeColor}`}>
                  {type === "PRODUCT" ? "Product" : type === "PACKING_MATERIAL" ? "Packaging" : "Raw Material"}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium text-foreground truncate" title={item?.itemName}>
              {item?.itemName}
            </span>
          </div>
        );
      },
    },
    {
      header: "Specification Code",
      accessorKey: "specCode",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs border border-teal-200 dark:border-teal-800 shrink-0">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-xs font-mono tracking-tight">
                {item?.specCode}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Version",
      accessorKey: "versionNo",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
          >
            {item?.versionNo || "v1.0"}
          </Badge>
        );
      },
    },
    {
      header: "Test Parameters",
      accessorKey: "testParameters",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const params = Array.isArray(item?.testParameters)
          ? item.testParameters
          : typeof item?.testParameters === "string"
          ? JSON.parse(item.testParameters || "[]")
          : [];

        if (!params || params.length === 0) {
          return <span className="text-xs text-muted-foreground italic">None added</span>;
        }

        return (
          <div className="flex flex-col gap-1 max-w-[200px]">
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md shadow-2xs"
              >
                <Beaker className="h-3 w-3 mr-1 text-teal-700 dark:text-teal-400" />
                {params.length} Parameter{params.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {params.slice(0, 2).map((p, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50 truncate max-w-[90px]"
                  title={p.parameterName}
                >
                  {p.parameterName}
                </span>
              ))}
              {params.length > 2 && (
                <span className="text-[10px] px-1 font-semibold text-muted-foreground">
                  +{params.length - 2}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Test Method / Protocol",
      accessorKey: "testMethod",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const params = Array.isArray(item?.testParameters)
          ? item.testParameters
          : typeof item?.testParameters === "string"
          ? JSON.parse(item.testParameters || "[]")
          : [];
        const methods = params.map((p) => p.testMethod).filter(Boolean);
        const displayMethod = methods.length > 0 ? methods[0] : item?.testMethod || "Standard Protocol";

        return (
          <div className="flex flex-col max-w-[190px]">
            <span className="text-xs font-mono text-foreground font-medium truncate" title={methods.join(", ") || displayMethod}>
              {displayMethod}
            </span>
            {methods.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                +{methods.length - 1} more method{methods.length > 2 ? "s" : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Acceptable Limits / Range",
      accessorKey: "acceptableLimits",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const params = Array.isArray(item?.testParameters)
          ? item.testParameters
          : typeof item?.testParameters === "string"
          ? JSON.parse(item.testParameters || "[]")
          : [];
        const limits = params.map((p) => p.acceptableLimits).filter(Boolean);
        const displayLimit = limits.length > 0 ? limits[0] : item?.acceptableLimits || "As per spec";

        return (
          <div className="flex flex-col max-w-[210px]">
            <span className="text-xs text-foreground font-medium truncate" title={limits.join("; ") || displayLimit}>
              {displayLimit}
            </span>
            {limits.length > 1 && (
              <span className="text-[10px] text-muted-foreground">
                +{limits.length - 1} criteria range{limits.length > 2 ? "s" : ""}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Effective Date",
      accessorKey: "effectiveDate",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const effDate = item?.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString() : "—";
        const revDate = item?.reviewDate ? new Date(item.reviewDate).toLocaleDateString() : null;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              {effDate}
            </span>
            {revDate && (
              <span className="text-[10px] text-muted-foreground">
                Rev: {revDate}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const status = item?.status || "ACTIVE";
        let color = "bg-emerald-600 text-white";
        if (status === "DRAFT") color = "bg-amber-500 text-white";
        if (status === "SUPERSEDED") color = "bg-slate-500 text-white";
        if (status === "OBSOLETE") color = "bg-rose-500 text-white";

        return (
          <Badge className={`font-semibold text-[11px] px-2 py-0.5 ${color}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const spec = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50"
              title="View QC Spec Sheet"
              onClick={() => handleOpenView(spec)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              title="Edit Specification"
              onClick={() => handleOpenEdit(spec)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              title="Delete Specification"
              onClick={() => {
                setSpecToDelete(spec);
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
        title="QC Specification Master"
        description="Standard Testing Protocols (STP), acceptance criteria ranges, pharmacopoeial test methods & revision control."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters", href: "#" },
          { label: "QC Specifications" },
        ]}
      >
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add QC Specification
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Specifications</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Specs</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Finished Products</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{productCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Packaging & Raw Materials</p>
              <h3 className="text-2xl font-bold mt-1 text-violet-600 dark:text-violet-400">{materialCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Quality Control Specifications Register</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Official specifications, acceptable limits, analytical methods, and revision logs
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <Select value={itemTypeFilter} onValueChange={(val) => { setItemTypeFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Item Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Item Types</SelectItem>
                    <SelectItem value="PRODUCT">Finished Products</SelectItem>
                    <SelectItem value="PACKING_MATERIAL">Packaging Materials</SelectItem>
                    <SelectItem value="RAW_MATERIAL">Raw Materials / API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                    <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={specs}
            loading={loading}
            searchKey="specCode"
            searchValue={search}
            onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
            searchPlaceholder="Search spec code, item name, code or test method..."
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
        <DialogContent className="sm:max-w-5xl max-w-5xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-2 opacity-10">
              <ClipboardCheck className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <Sparkles className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {editingSpec ? `Modify QC Spec: ${editingSpec.specCode}` : "Create QC Specification & Testing Protocol"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300 mt-0.5">
                    {editingSpec
                      ? "Update analytical parameters, limits, methods and version control"
                      : "Define standard testing protocols (STP), acceptance ranges and compliance specifications"}
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 mr-6">
                <span className={`text-xs font-semibold px-3 py-1 rounded-xl backdrop-blur-md border ${
                  status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : status === "DRAFT"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-white/10 text-slate-300 border-white/10"
                }`}>
                  {`Status: ${status}`}
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

              {/* Section 1: Item Linking & Identification */}
              <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      1. Target Item Identification & Quick Linkage
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Choose from master catalog to auto-fill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Item Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Item Type <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={itemType}
                      onValueChange={(val) => {
                        setItemType(val);
                        if (fieldErrors.itemType) {
                          setFieldErrors((prev) => ({ ...prev, itemType: null }));
                        }
                        if (val === "PRODUCT") handleLoadPreset("PRODUCT");
                        else if (val === "PACKING_MATERIAL") handleLoadPreset("PACKING_MATERIAL");
                        else if (val === "RAW_MATERIAL") handleLoadPreset("RAW_MATERIAL");
                      }}
                    >
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.itemType ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select Item Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Finished Product</SelectItem>
                        <SelectItem value="PACKING_MATERIAL">Packaging Material</SelectItem>
                        <SelectItem value="RAW_MATERIAL">Raw Material / API</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.itemType && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.itemType}
                      </p>
                    )}
                  </div>

                  {/* Quick Link Picker */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">
                      Select Master Catalog Item <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={productMaterialCode || ""}
                      onValueChange={(val) => {
                        const p = products.find((x) => x.productCode === val);
                        if (p) {
                          setItemType("PRODUCT");
                          handleItemSelect(p.productCode, p.name, "PRODUCT");
                          return;
                        }
                        const pm = packingMaterials.find((x) => x.materialCode === val);
                        if (pm) {
                          setItemType("PACKING_MATERIAL");
                          handleItemSelect(pm.materialCode, pm.description, "PACKING_MATERIAL");
                          return;
                        }
                      }}
                    >
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.catalogItem || fieldErrors.productMaterialCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Choose from registered Master inventory items..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {(!itemType || itemType === "PRODUCT") && products.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                              📦 Finished Products Master
                            </SelectLabel>
                            {products
                              .filter((p) => p.isActive !== false || p.productCode === productMaterialCode)
                              .map((p) => (
                                <SelectItem key={p.id} value={p.productCode}>
                                  [{p.productCode}] {p.name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        )}
                        {(!itemType || itemType === "PACKING_MATERIAL") && packingMaterials.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                              📦 Packaging Materials Master
                            </SelectLabel>
                            {packingMaterials
                              .filter((pm) => pm.isActive !== false || pm.materialCode === productMaterialCode)
                              .map((pm) => (
                                <SelectItem key={pm.id} value={pm.materialCode}>
                                  [{pm.materialCode}] {pm.description}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        )}
                        {products.length === 0 && packingMaterials.length === 0 && (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No active items found in backend database.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {fieldErrors.catalogItem && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.catalogItem}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Product / Material Code */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Product / Material Code <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={productMaterialCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setProductMaterialCode(val);
                        if (fieldErrors.productMaterialCode) {
                          setFieldErrors((prev) => ({ ...prev, productMaterialCode: null }));
                        }
                        if (!isCodeManual && !editingSpec) {
                          setSpecCode(generateQcSpecCode(val, versionNo));
                        }
                      }}
                      placeholder="e.g. PRD-PCM-500"
                      className={`h-10 text-xs font-mono font-bold uppercase bg-background ${fieldErrors.productMaterialCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={!!editingSpec || (!!productMaterialCode && !!specCode && !isCodeManual)}
                    />
                    {fieldErrors.productMaterialCode && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.productMaterialCode}
                      </p>
                    )}
                  </div>

                  {/* Item Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">
                      Item Name / Pharmacopoeial Description <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={itemName}
                      onChange={(e) => {
                        setItemName(e.target.value);
                        if (fieldErrors.itemName) {
                          setFieldErrors((prev) => ({ ...prev, itemName: null }));
                        }
                      }}
                      placeholder="e.g. Paracetamol Tablets 500mg USP"
                      className={`h-10 text-xs bg-background ${fieldErrors.itemName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={!!editingSpec || (!!productMaterialCode && !!itemName)}
                    />
                    {fieldErrors.itemName && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.itemName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Spec Code */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground">
                        Specification Code <span className="text-rose-500">*</span>
                      </Label>
                      {!editingSpec && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCodeManual(!isCodeManual);
                            if (isCodeManual && productMaterialCode) {
                              setSpecCode(generateQcSpecCode(productMaterialCode, versionNo));
                              if (fieldErrors.specCode) {
                                setFieldErrors((prev) => ({ ...prev, specCode: null }));
                              }
                            }
                          }}
                          className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Sparkles className="h-3 w-3" />
                          {isCodeManual ? "Auto Generate" : "Edit Manually"}
                        </button>
                      )}
                    </div>
                    <Input
                      value={specCode}
                      onChange={(e) => {
                        setSpecCode(e.target.value.toUpperCase());
                        setIsCodeManual(true);
                        if (fieldErrors.specCode) {
                          setFieldErrors((prev) => ({ ...prev, specCode: null }));
                        }
                      }}
                      placeholder="e.g. QC-SPEC-PRD-PCM-500-V1"
                      className={`h-10 text-xs font-mono font-bold uppercase bg-background ${fieldErrors.specCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={!!editingSpec || (!!productMaterialCode && !!specCode && !isCodeManual)}
                    />
                    {fieldErrors.specCode && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.specCode}
                      </p>
                    )}
                  </div>

                  {/* Version No */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Revision / Version <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={versionNo}
                      onChange={(e) => {
                        handleVersionChange(e.target.value);
                        if (fieldErrors.versionNo) {
                          setFieldErrors((prev) => ({ ...prev, versionNo: null }));
                        }
                      }}
                      placeholder="e.g. v1.0 or Rev 02"
                      className={`h-10 text-xs font-mono bg-background ${fieldErrors.versionNo ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {fieldErrors.versionNo && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.versionNo}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      QC Status <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(val) => {
                        setStatus(val);
                        if (fieldErrors.status) {
                          setFieldErrors((prev) => ({ ...prev, status: null }));
                        }
                      }}
                    >
                      <SelectTrigger className={`h-10 text-xs bg-background ${fieldErrors.status ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active (Approved)</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                        <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.status && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.status}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Effective Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Effective Date <span className="text-rose-500">*</span>
                    </Label>
                    <DatePicker
                      value={effectiveDate}
                      onChange={(val) => {
                        setEffectiveDate(val);
                        if (fieldErrors.effectiveDate) {
                          setFieldErrors((prev) => ({ ...prev, effectiveDate: null }));
                        }
                      }}
                      placeholder="Select Effective Date"
                      error={!!fieldErrors.effectiveDate}
                    />
                    {fieldErrors.effectiveDate && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.effectiveDate}
                      </p>
                    )}
                  </div>

                  {/* Review Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Next Review Date <span className="text-rose-500">*</span>
                    </Label>
                    <DatePicker
                      value={reviewDate}
                      onChange={(val) => {
                        setReviewDate(val);
                        if (fieldErrors.reviewDate) {
                          setFieldErrors((prev) => ({ ...prev, reviewDate: null }));
                        }
                      }}
                      placeholder="Select Review Date"
                      error={!!fieldErrors.reviewDate}
                    />
                    {fieldErrors.reviewDate && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.reviewDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Test Parameters Dynamic Matrix */}
              <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/40 gap-2">
                  <div className="flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        2. Analytical Test Parameters & Acceptance Limits Matrix
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadPreset(itemType || "PRODUCT")}
                      className="h-8 text-xs gap-1.5 rounded-xl bg-background shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                      Load Standard Presets
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddParamRow}
                      className="h-8 text-xs gap-1.5 rounded-xl px-3 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Parameter Row
                    </Button>
                  </div>
                </div>

                {fieldErrors.testParameters && (
                  <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.testParameters}
                  </p>
                )}

                {/* Parameters List Table */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-background shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/70 text-muted-foreground border-b border-border/50 font-bold">
                      <tr>
                        <th className="p-3 text-left w-10">#</th>
                        <th className="p-3 text-left min-w-[180px]">Test Parameter Name</th>
                        <th className="p-3 text-left min-w-[200px]">Test Method / Protocol</th>
                        <th className="p-3 text-left min-w-[240px]">Acceptable Limits / Range</th>
                        <th className="p-3 text-left w-24">UOM</th>
                        <th className="p-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {testParameters.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            No test parameters added yet. Click <strong>&quot;Add Parameter Row&quot;</strong> or <strong>&quot;Load Standard Presets&quot;</strong>.
                          </td>
                        </tr>
                      ) : (
                        testParameters.map((param, index) => (
                          <tr key={index} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 text-muted-foreground font-mono font-bold text-xs">{index + 1}</td>
                            <td className="p-2">
                              <Input
                                value={param.parameterName}
                                onChange={(e) => handleUpdateParamRow(index, "parameterName", e.target.value)}
                                placeholder="e.g. Assay (Purity)"
                                className={`h-9 text-xs bg-background ${
                                  fieldErrors.testParameters && !param.parameterName?.trim()
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={param.testMethod}
                                onChange={(e) => handleUpdateParamRow(index, "testMethod", e.target.value)}
                                placeholder="e.g. HPLC (USP <621>)"
                                className={`h-9 text-xs bg-background font-mono ${
                                  fieldErrors.testParameters && !param.testMethod?.trim()
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={param.acceptableLimits}
                                onChange={(e) => handleUpdateParamRow(index, "acceptableLimits", e.target.value)}
                                placeholder="e.g. 98.0% - 102.0%"
                                className={`h-9 text-xs bg-background ${
                                  fieldErrors.testParameters && !param.acceptableLimits?.trim()
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={param.uom || ""}
                                onChange={(e) => handleUpdateParamRow(index, "uom", e.target.value)}
                                placeholder="e.g. %"
                                className={`h-9 text-xs w-24 bg-background font-mono ${
                                  fieldErrors.testParameters && !param.uom?.trim()
                                    ? "border-red-500 focus-visible:ring-red-500"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParamRow(index)}
                                className="text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Sign-Off & Approvals */}
              <div className="border border-border/60 rounded-2xl p-4 bg-muted/20 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Sign-offs & Quality Assurance Authorization
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prepared By */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Prepared / Analyzed By <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={preparedBy}
                      onChange={(e) => {
                        setPreparedBy(e.target.value);
                        if (fieldErrors.preparedBy) {
                          setFieldErrors((prev) => ({ ...prev, preparedBy: null }));
                        }
                      }}
                      placeholder="e.g. QC Analyst - John Doe"
                      className={`h-10 text-xs bg-background ${fieldErrors.preparedBy ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {fieldErrors.preparedBy && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.preparedBy}
                      </p>
                    )}
                  </div>

                  {/* Approved By */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Approved By (QA Head) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={approvedBy}
                      onChange={(e) => {
                        setApprovedBy(e.target.value);
                        if (fieldErrors.approvedBy) {
                          setFieldErrors((prev) => ({ ...prev, approvedBy: null }));
                        }
                      }}
                      placeholder="e.g. QA Manager - Dr. Smith"
                      className={`h-10 text-xs bg-background ${fieldErrors.approvedBy ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {fieldErrors.approvedBy && (
                      <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.approvedBy}
                      </p>
                    )}
                  </div>
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
                {submitting ? "Saving..." : editingSpec ? "Update Specification" : "Create Specification"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details / Spec Sheet View Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-4xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <ClipboardCheck className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {viewSpec?.specCode}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Quality Specification Sheet & Testing Protocol ({viewSpec?.versionNo})
                  </DialogDescription>
                </div>
              </div>
              <Badge className={viewSpec?.status === "ACTIVE" ? "bg-emerald-600 text-white mr-6" : "bg-muted text-muted-foreground mr-6"}>
                {viewSpec?.status}
              </Badge>
            </div>
          </div>

          {viewSpec && (
            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Header Info Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Item Code</span>
                  <span className="font-mono font-bold text-foreground text-sm">{viewSpec.productMaterialCode}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Item Name</span>
                  <span className="font-bold text-foreground text-sm">{viewSpec.itemName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Item Type</span>
                  <span className="font-semibold text-foreground text-xs">{viewSpec.itemType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Effective Date</span>
                  <span className="font-semibold text-foreground text-xs">
                    {viewSpec.effectiveDate ? new Date(viewSpec.effectiveDate).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Review Date</span>
                  <span className="font-semibold text-foreground text-xs">
                    {viewSpec.reviewDate ? new Date(viewSpec.reviewDate).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Prepared By</span>
                  <span className="font-semibold text-foreground text-xs">{viewSpec.preparedBy || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Approved By</span>
                  <span className="font-semibold text-foreground text-xs">{viewSpec.approvedBy || "—"}</span>
                </div>
              </div>

              {/* Parameter Matrix Table */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Test Parameters & Acceptance Criteria Matrix</h4>
                <div className="border border-border/60 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/70 text-muted-foreground font-bold border-b border-border/60">
                      <tr>
                        <th className="p-3 text-left w-10">#</th>
                        <th className="p-3 text-left min-w-[180px]">Test Parameter</th>
                        <th className="p-3 text-left min-w-[200px]">Analytical Method</th>
                        <th className="p-3 text-left min-w-[240px]">Acceptable Limits / Standard</th>
                        <th className="p-3 text-left w-20">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-background">
                      {Array.isArray(viewSpec.testParameters) && viewSpec.testParameters.map((p, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-3 text-muted-foreground font-mono font-bold text-xs">{idx + 1}</td>
                          <td className="p-3 font-bold text-foreground">{p.parameterName}</td>
                          <td className="p-3 text-muted-foreground font-mono text-xs">{p.testMethod || "—"}</td>
                          <td className="p-3 font-semibold text-foreground">{p.acceptableLimits}</td>
                          <td className="p-3 text-muted-foreground font-mono text-xs">{p.uom || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border/50 bg-muted/30 flex items-center justify-end gap-3 rounded-b-3xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 h-9 text-xs rounded-xl px-4"
            >
              <Printer className="h-4 w-4" />
              Print Spec Sheet
            </Button>
            <Button size="sm" onClick={() => setDetailsDialogOpen(false)} className="h-9 text-xs rounded-xl px-5">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete QC Specification"
        description={`Are you sure you want to delete QC specification "${specToDelete?.specCode}"?`}
        confirmText="Delete Specification"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
