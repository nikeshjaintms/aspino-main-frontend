"use client";

import { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGatePasses,
  createGatePass,
  recordTimeOut,
  setSearch,
  setActiveTab,
  setCurrentPage,
  setLimit,
} from "@/redux/slices/gatePassSlice";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/redux/slices/passCategorySlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SelectContent ,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  ClipboardList,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Tags,
  Trash2,
  Edit,
  Layers,
  X,
  FileText,
  Printer,
  Download,
  Upload,
  Eye,
  ImageIcon,
} from "lucide-react";

import { GatePassHeader } from "@/components/gate-pass/GatePassHeader";
import { GatePassMetrics } from "@/components/gate-pass/GatePassMetrics";
import { DataTable } from "@/components/data-table";
import * as OCR from "@/lib/vehicleOCR";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Image from "next/image";


export default function GatePassPage() {
  const dispatch = useDispatch();

  // Redux States
  const {
    passes: gatePasses,
    totalCount,
    totalInward,
    totalOutward,
    totalPages,
    currentPage,
    limit,
    loading,
    submitting: passSubmitting,
    search,
    activeTab,
  } = useSelector((state) => state.gatePass);
  const { categories, submitting: catSubmitting } = useSelector(
    (state) => state.passCategory
  );

  // Create Gate Pass Modal state
  const [showModal, setShowModal] = useState(false);
  const [passType, setPassType] = useState("INWARD");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const selectedCatObj = categories.find((c) => c.id === Number(selectedCategoryId));
  const isSales = selectedCatObj ? selectedCatObj.name.toLowerCase().includes("sales") : false;

  // Form Fields for Gate Pass
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [supplierSource, setSupplierSource] = useState("");
  const [deliveryChallanNumber, setDeliveryChallanNumber] = useState("");
  const [declaredQuantity, setDeclaredQuantity] = useState("");
  const [grnNumber, setGrnNumber] = useState("");

  // Outward specific
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [coaGenerated, setCoaGenerated] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Form submission feedback & Field Errors
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [passFieldErrors, setPassFieldErrors] = useState({});

  // Category CRUD Modal state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catType, setCatType] = useState("INWARD");
  const [catDesc, setCatDesc] = useState("");
  const [isActiveCat, setIsActiveCat] = useState(true);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");
  const [catFieldErrors, setCatFieldErrors] = useState({});

  // Delete Category Confirm State
  const [deleteCatConfirmOpen, setDeleteCatConfirmOpen] = useState(false);
  const [catIdToDelete, setCatIdToDelete] = useState(null);
  const [deleteCatLoading, setDeleteCatLoading] = useState(false);

  const [downloadingId, setDownloadingId] = useState(null);
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [isManualSupplier, setIsManualSupplier] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(search);

  // Sync Redux search back if it changes elsewhere
  useEffect(() => {
    const syncSearch = () => {
      setLocalSearch(search);
    };
    syncSearch();
  }, [search]);

  // Debounce local search value to Redux search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        dispatch(setSearch(localSearch));
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch, dispatch, search]);

  // Dispatch Redux Thunks on Mount, search, page, limit, or activeTab change
  useEffect(() => {
    dispatch(fetchGatePasses({ search, page: currentPage, limit, type: activeTab }));
  }, [dispatch, search, currentPage, limit, activeTab]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch Suppliers from Master
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await fetch(`${backendUrl}/supplier`);
        if (res.ok) {
          const data = await res.json();
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };
    loadSuppliers();
  }, [backendUrl]);

  useEffect(() => {
    const syncCategory = () => {
      const match = categories.find((c) => c.type === passType && (c.isActive ?? true));
      if (match) {
        setSelectedCategoryId(String(match.id));
      } else if (categories.length > 0) {
        const activeCats = categories.filter((c) => c.isActive ?? true);
        if (activeCats.length > 0) {
          setSelectedCategoryId(String(activeCats[0].id));
        } else {
          setSelectedCategoryId("");
        }
      }
    };
    syncCategory();
  }, [passType, categories]);

  // Handle Download PDF via explicit Backend API call & file download
  const handleDownloadPDF = async (item) => {
    try {
      setDownloadingId(item.id);
      const res = await fetch(`${backendUrl}/gate-pass/${item.id}/pdf`);
      if (!res.ok) {
        throw new Error("Failed to generate PDF from backend");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GatePass_${item.passNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download PDF from backend.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Export All Register to PDF
  const handleExportRegisterPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = filteredPasses.map((p, idx) => `
      <tr>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${p.passNumber}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${p.type}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${p.category?.name || 'N/A'}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${p.vehicleNumber}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${p.driverName} (${p.driverContact || 'N/A'})</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${p.type === 'INWARD' ? (p.supplierSource || 'N/A') : (p.purpose || 'N/A')}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1;">${new Date(p.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${p.status}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Gate Register Report</title>
          <style>
            @media print {
              body { margin: 0; padding: 15px; font-family: 'Helvetica Neue', Arial, sans-serif; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 15px; }
            .logo { font-size: 20px; font-weight: 900; color: #0284c7; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background: #0284c7; color: white; padding: 8px; border: 1px solid #0284c7; text-align: left; text-transform: uppercase; font-size: 10px; }
            .btn-print { background: #0284c7; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <button class="btn-print no-print" onclick="window.print()">📥 Save Register PDF</button>
          
          <div class="header">
            <div class="logo">Aspino Speciality Chemicals Private Limited</div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">DAILY GATE REGISTER SUMMARY REPORT</div>
            <div style="font-size: 11px; color: #64748b;">Generated on ${new Date().toLocaleString()} | Total Records: ${filteredPasses.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pass #</th>
                <th>Type</th>
                <th>Category</th>
                <th>Vehicle No</th>
                <th>Driver & Contact</th>
                <th>Source / Purpose</th>
                <th>Time In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handle Create Gate Pass via Redux Action
  const handleCreatePass = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setPassFieldErrors({});

    const errors = {};

    // 1. Pass Category Validation
    if (!selectedCategoryId) {
      errors.category = "Pass Category is required.";
    }

    // 2. Vehicle Number Validation
    if (!vehicleNumber.trim()) {
      errors.vehicleNumber = "Vehicle Number is required.";
    } else if (vehicleNumber.trim().length < 4) {
      errors.vehicleNumber = "Vehicle Number must be at least 4 characters.";
    } else if (!/^[A-Z0-9\-\s]{4,20}$/i.test(vehicleNumber.trim())) {
      errors.vehicleNumber = "Invalid Vehicle Number format (e.g. MH-04-JK-8842).";
    }

    // 3. Driver Name Validation
    if (!driverName.trim()) {
      errors.driverName = "Driver Name is required.";
    } else if (driverName.trim().length < 2) {
      errors.driverName = "Driver Name must be at least 2 characters.";
    }

    // 4. Driver Contact Validation
    if (!driverContact.trim()) {
      errors.driverContact = "Driver Contact No is required.";
    } else if (!/^[+0-9\s\-]{8,15}$/.test(driverContact.trim())) {
      errors.driverContact = "Driver Contact must be a valid phone number (8-15 digits).";
    }

    // 5. Transporter Name Validation
    if (!transporterName.trim()) {
      errors.transporterName = "Transporter Name is required.";
    }

    // 6. Inward Specific Fields Validation
    if (passType === "INWARD") {
      if (!supplierSource.trim()) {
        errors.supplierSource = "Supplier / Source is required.";
      }
      if (!deliveryChallanNumber.trim()) {
        errors.deliveryChallanNumber = "Delivery Challan (DC) # is required.";
      }
      if (!declaredQuantity.trim()) {
        errors.declaredQuantity = "Declared Quantity is required.";
      }
    }

    // 7. Outward Specific Fields Validation
    if (passType === "OUTWARD") {
      if (!invoiceNumber.trim()) {
        errors.invoiceNumber = "Invoice Number is required.";
      }

      if (!purpose.trim()) {
        errors.purpose = "Outward Purpose is required.";
      }

      if (isSales && !coaGenerated) {
        errors.coaGenerated = "COA Generation & Verification is required for Sales Dispatch.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setPassFieldErrors(errors);
      setFormError("Please correct all highlighted fields in red below.");
      return;
    }

    const resultAction = await dispatch(
      createGatePass({
        type: passType,
        categoryId: Number(selectedCategoryId),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        driverName: driverName.trim(),
        driverContact: driverContact.trim(),
        transporterName: transporterName.trim(),
        supplierSource: supplierSource.trim(),
        deliveryChallanNumber: deliveryChallanNumber.trim(),
        declaredQuantity: declaredQuantity.trim(),
        grnNumber: grnNumber.trim(),
        invoiceNumber: invoiceNumber.trim(),
        coaGenerated,
        purpose: purpose.trim(),
        notes: notes.trim(),
        imageUrl: imageUrl.trim(),
      })
    );

    if (createGatePass.fulfilled.match(resultAction)) {
      setFormSuccess(`Gate Pass ${resultAction.payload.passNumber} created successfully!`);
      customToast.success(`Gate Pass ${resultAction.payload.passNumber} created successfully!`);
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1200);
    } else {
      setFormError(resultAction.payload || "Error creating gate pass.");
      customToast.error(resultAction.payload || "Error creating gate pass.");
    }
  };

  // Category CRUD Handlers via Redux Actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatError("");
    setCatSuccess("");
    setCatFieldErrors({});

    const errors = {};
    if (!catName.trim()) {
      errors.catName = "Category Name is required.";
    } else if (catName.trim().length < 2) {
      errors.catName = "Category Name must be at least 2 characters long.";
    }

    if (!catCode.trim()) {
      errors.catCode = "Category Code is required.";
    } else if (!/^[A-Z0-9_]{2,20}$/i.test(catCode.trim())) {
      errors.catCode = "Category Code must be 2 to 20 uppercase alphanumeric characters or underscores (e.g. IN_MAT, OUT_SALES).";
    }

    if (!catDesc.trim()) {
      errors.catDesc = "Description is required.";
    }

    if (Object.keys(errors).length > 0) {
      setCatFieldErrors(errors);
      setCatError("Please correct all highlighted fields in red below.");
      return;
    }

    const payload = {
      name: catName.trim(),
      code: catCode.trim().toUpperCase(),
      type: catType,
      description: catDesc.trim(),
      isActive: isActiveCat,
    };

    let resultAction;
    if (editingCatId) {
      resultAction = await dispatch(updateCategory({ id: editingCatId, catData: payload }));
    } else {
      resultAction = await dispatch(createCategory(payload));
    }

    if (createCategory.fulfilled.match(resultAction) || updateCategory.fulfilled.match(resultAction)) {
      setCatSuccess(`Category saved successfully!`);
      customToast.success(`Category saved successfully!`);
      setTimeout(() => {
        resetCatForm();
      }, 1000);
    } else {
      setCatError(resultAction.payload || "Error saving pass category.");
      customToast.error(resultAction.payload || "Error saving pass category.");
    }
  };

  const promptDeleteCategory = (id) => {
    setCatIdToDelete(id);
    setDeleteCatConfirmOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!catIdToDelete) return;
    setDeleteCatLoading(true);
    try {
      await dispatch(deleteCategory(catIdToDelete)).unwrap();
      customToast.success("Pass category deleted successfully!");
      setDeleteCatConfirmOpen(false);
      setCatIdToDelete(null);
    } catch (err) {
      customToast.error(err?.message || "Error deleting category.");
    } finally {
      setDeleteCatLoading(false);
    }
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatType(cat.type);
    setCatDesc(cat.description || "");
    setIsActiveCat(cat.isActive ?? true);
    setCatError("");
    setCatSuccess("");
    setCatFieldErrors({});
  };

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName("");
    setCatCode("");
    setCatType("INWARD");
    setCatDesc("");
    setIsActiveCat(true);
    setCatError("");
    setCatSuccess("");
    setCatFieldErrors({});
  };

  // Record Time Out via Redux
  const handleTimeOut = (id) => {
    dispatch(recordTimeOut(id));
  };

  const resetForm = () => {
    setPassType("INWARD");
    const firstInward = categories.find((c) => c.type === "INWARD" && (c.isActive ?? true));
    setSelectedCategoryId(firstInward ? String(firstInward.id) : "");
    setVehicleNumber("");
    setDriverName("");
    setDriverContact("");
    setTransporterName("");
    setSupplierSource("");
    setIsManualSupplier(false);
    setDeliveryChallanNumber("");
    setDeclaredQuantity("");
    setGrnNumber("");
    setInvoiceNumber("");
    setCoaGenerated(false);
    setPurpose("");
    setNotes("");
    setImageUrl("");
    setFormError("");
    setFormSuccess("");
    setPassFieldErrors({});
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    setFormError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      setFormError("Failed to read image file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };



  const availableCategoriesForType = categories.filter((c) => c.type === passType && (c.isActive ?? true));

  const inwardCount = totalInward;
  const outwardCount = totalOutward;

  const dataForTable = gatePasses.map((p) => ({
    ...p,
    categoryName: p.category?.name || "N/A",
  }));

  const columns = [
    {
      accessorKey: "passNumber",
      header: "Pass # / Type",
      cell: (row) => {
        const isInward = row.type === "INWARD";
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{row.passNumber}</div>
            <span
              className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                isInward
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}
            >
              {isInward ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {row.type}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: (row) => (
        <Badge variant="secondary" className="font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          {row.category?.name || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "vehicleNumber",
      header: "Vehicle & Driver",
      cell: (row) => (
        <div className="flex items-start gap-2.5">
          {row.imageUrl ? (
            <div
              onClick={() => setPreviewImageModal(row.imageUrl)}
              className="relative group cursor-pointer shrink-0 mt-0.5"
              title="Click to view attached image"
            >
              <Image
                src={row.imageUrl}
                alt="Vehicle / Pass"
                width={36}
                height={36}
                className="h-9 w-9 object-cover rounded-lg border border-slate-200 dark:border-slate-800 group-hover:opacity-80 transition-opacity shadow-xs"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                <Eye className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          ) : null}
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {row.vehicleNumber}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {row.driverName} {row.driverContact ? `(${row.driverContact})` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "supplierSource",
      header: "Source / Purpose",
      cell: (row) => {
        const isInward = row.type === "INWARD";
        return isInward ? (
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{row.supplierSource || "N/A"}</div>
            {row.declaredQuantity && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Qty: {row.declaredQuantity}</div>
            )}
          </div>
        ) : (
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{row.purpose || "Outward Dispatch"}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "invoiceNumber",
      header: "Reference Docs",
      cell: (row) => {
        const isInward = row.type === "INWARD";
        return isInward ? (
          <div className="space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
            {row.deliveryChallanNumber && (
              <div>
                DC: <span className="font-bold text-slate-900 dark:text-slate-100">{row.deliveryChallanNumber}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
            {row.invoiceNumber && (
              <div>
                INV: <span className="font-bold text-slate-900 dark:text-slate-100">{row.invoiceNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant={row.coaGenerated ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                {row.coaGenerated ? "COA Verified" : "No COA"}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "timeIn",
      header: "Timestamps",
      cell: (row) => (
        <div className="text-[11px] text-slate-600 dark:text-slate-400">
          <div>
            In: <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(row.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {row.timeOut ? (
            <div>
              Out: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{new Date(row.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">Still Inside</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={row.status === "COMPLETED" ? "default" : "secondary"}
          className={`font-bold text-[10px] ${
            row.status === "GATE_IN"
              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
          }`}
        >
          {row.status === "GATE_IN" ? "GATE IN" : "COMPLETED"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      cell: (row) => {
        const isGateIn = row.status === "GATE_IN";
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={downloadingId === row.id}
              onClick={() => handleDownloadPDF(row)}
              className="h-8 text-xs font-bold text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-850 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg gap-1 px-2.5"
              title="API Call & Download PDF Pass"
            >
              {downloadingId === row.id ? (
                <RefreshCw className="h-3.5 w-3.5 text-sky-600 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-sky-600" />
              )}
              {downloadingId === row.id ? "Downloading..." : "PDF"}
            </Button>

            {isGateIn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTimeOut(row.id)}
                className="h-8 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg gap-1 px-2.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Time Out
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const categoryColumns = [
    {
      accessorKey: "name",
      header: "Category Details",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{row.name}</span>
            <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 dark:border-slate-800 dark:text-slate-350">
              {row.code}
            </Badge>
          </div>
          {row.description && <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-0.5">{row.description}</p>}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Movement Type",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={`text-[9px] font-bold px-1.5 py-0 ${
            row.type === "INWARD"
              ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50"
              : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
          }`}
        >
          {row.type}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`font-bold text-[10px] px-2 py-0.5 ${
            row.isActive
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
              : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditCategoryClick(row)}
            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteCategory(row.id)}
            className="h-8 w-8 text-rose-600 dark:text-rose-455 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button
      variant="outline"
      size="icon"
      onClick={() => dispatch(fetchGatePasses({ search: debouncedSearch, page: currentPage, limit, type: activeTab }))}
      className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-850"
      title="Refresh"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <GatePassHeader
        categoriesCount={categories.length}
        onExportPDF={handleExportRegisterPDF}
        onOpenCategoryModal={() => {
          resetCatForm();
          setShowCatModal(true);
        }}
        onOpenIssueModal={() => {
          resetForm();
          setShowModal(true);
        }}
      />

      {/* Metrics Summary Row */}
      <GatePassMetrics
        inwardCount={inwardCount}
        outwardCount={outwardCount}
        categoriesCount={categories.length}
      />

      {/* Main Gate Pass Table & Filters */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Daily Gate Register & Movement History</CardTitle>
            <CardDescription className="text-xs">Filter, search, sort, and manage material movements</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-transparent">
          <Tabs value={activeTab} onValueChange={(val) => dispatch(setActiveTab(val))} className="w-full">
            <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-2">
              <TabsList className="bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs font-bold px-4 rounded-lg">
                  All Movements ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="inward" className="text-xs font-bold px-4 rounded-lg">
                  9.1 Inward Passes ({totalInward})
                </TabsTrigger>
                <TabsTrigger value="outward" className="text-xs font-bold px-4 rounded-lg">
                  9.2 Outward Passes ({totalOutward})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="all" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={dataForTable}
                  loading={loading}
                  searchPlaceholder="Search all gate passes..."
                  emptyMessage="No Gate Pass records found"
                  emptyDescription="Issue a new inward or outward gate pass to begin tracking."
                  actions={tableActions}
                  isServerSide={true}
                  totalCount={totalCount}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  searchQuery={localSearch}
                  pageSize={limit}
                  onPageChange={(page) => dispatch(setCurrentPage(page))}
                  onLimitChange={(lim) => dispatch(setLimit(lim))}
                  onSearchQueryChange={(q) => setLocalSearch(q)}
                />
              </TabsContent>
              <TabsContent value="inward" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={dataForTable}
                  loading={loading}
                  searchPlaceholder="Search Inward gate passes..."
                  emptyMessage="No Inward passes found"
                  emptyDescription="No material or visitor inward records are currently recorded."
                  actions={tableActions}
                  isServerSide={true}
                  totalCount={totalInward}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  searchQuery={localSearch}
                  pageSize={limit}
                  onPageChange={(page) => dispatch(setCurrentPage(page))}
                  onLimitChange={(lim) => dispatch(setLimit(lim))}
                  onSearchQueryChange={(q) => setLocalSearch(q)}
                />
              </TabsContent>
              <TabsContent value="outward" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={dataForTable}
                  loading={loading}
                  searchPlaceholder="Search Outward gate passes..."
                  emptyMessage="No Outward passes found"
                  emptyDescription="No outward dispatch or repair records are currently recorded."
                  actions={tableActions}
                  isServerSide={true}
                  totalCount={totalOutward}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  searchQuery={localSearch}
                  pageSize={limit}
                  onPageChange={(page) => dispatch(setCurrentPage(page))}
                  onLimitChange={(lim) => dispatch(setLimit(lim))}
                  onSearchQueryChange={(q) => setLocalSearch(q)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal 1: Issue Gate Pass (ALL FIELDS MANDATORY) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-sky-600 dark:text-sky-450" />
                  Issue Digital Gate Pass
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Record vehicle entry/exit using pass categories</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-350"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Red Alert Banner */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 flex items-center gap-2.5 text-red-800 dark:text-red-300 text-xs font-bold shadow-xs">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreatePass} noValidate className="space-y-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
          type="button"
          onClick={() => {
            setPassType("INWARD");
            const firstInward = categories.find(
              (c) => c.type === "INWARD" && (c.isActive ?? true)
            );
            setSelectedCategoryId(firstInward ? String(firstInward.id) : "");
          }}
          className={`p-3 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            passType === "INWARD"
              ? "border-sky-600 dark:border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          9.1 Inward Gate Pass
        </button>

               <button
  type="button"
  onClick={() => {
    setPassType("OUTWARD");
    const firstOutward = categories.find(
      (c) => c.type === "OUTWARD" && (c.isActive ?? true)
    );
    setSelectedCategoryId(firstOutward ? String(firstOutward.id) : "");
  }}
  className={`p-3 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
    passType === "OUTWARD"
      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  }`}
>
  <ArrowUpRight className="h-4 w-4" />
  9.2 Outward Gate Pass
</button>
              </div>

              {/*  Pass Category Dropdown */}
            <div className="space-y-1">
  <div className="flex items-center justify-between">
    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
      Pass Category *
    </Label>
  </div>

  <Select
    value={selectedCategoryId}
    onValueChange={(value) => {
      setSelectedCategoryId(value);

      if (passFieldErrors.category) {
        setPassFieldErrors((prev) => ({
          ...prev,
          category: null,
        }));
      }
    }}
  >
    <SelectTrigger
      className={`h-10 rounded-xl text-xs font-semibold
      ${
        passFieldErrors.category
          ? "border-red-500 focus:ring-red-500"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <SelectValue
        placeholder={
          availableCategoriesForType.length === 0
            ? `No categories defined for ${passType}`
            : "Select Pass Category"
        }
      />
    </SelectTrigger>

    <SelectContent>
      {availableCategoriesForType.length === 0 ? (
        <SelectItem value="no-category" disabled>
          No categories defined for {passType}
        </SelectItem>
      ) : (
        availableCategoriesForType.map((cat) => (
          <SelectItem key={cat.id} value={String(cat.id)}>
            {cat.name} ({cat.code})
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>

  {passFieldErrors.category && (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {passFieldErrors.category}
    </p>
  )}
            </div>

              {/* Vehicle & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vehicle Number & Photo Upload */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Vehicle Number *</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. MH-04-JK-8842"
                      value={vehicleNumber}
                      onChange={(e) => {
                        setVehicleNumber(e.target.value);
                        if (passFieldErrors.vehicleNumber) setPassFieldErrors((prev) => ({ ...prev, vehicleNumber: null }));
                      }}
                      className={`h-10 pr-32 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                        passFieldErrors.vehicleNumber
                          ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                          : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                      }`}
                    />
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold rounded-lg px-2.5 gap-1.5 shadow-xs transition-all"
                      >
                        <Upload className="h-3 w-3" />
                        {imageUrl ? "Change Photo" : "Upload Photo"}
                      </Button>
                    </div>
                  </div>
                  {passFieldErrors.vehicleNumber && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {passFieldErrors.vehicleNumber}
                    </p>
                  )}
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 w-fit">
                      <Image src={imageUrl} alt="Gate Pass Photo" width={48} height={48} className="h-12 w-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs" />
                      <div className="text-[11px]">
                        <p className="font-bold text-slate-700 dark:text-slate-300">Photo Attached</p>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-red-600 hover:text-red-700 text-[10px] font-bold flex items-center gap-1 mt-0.5"
                        >
                          <Trash2 className="h-3 w-3" /> Remove Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Driver Name *</Label>
                  <Input
                    placeholder="e.g. Rajesh Kumar"
                    value={driverName}
                    onChange={(e) => {
                      setDriverName(e.target.value);
                      if (passFieldErrors.driverName) setPassFieldErrors((prev) => ({ ...prev, driverName: null }));
                    }}
                    className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                      passFieldErrors.driverName
                        ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                        : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {passFieldErrors.driverName && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {passFieldErrors.driverName}
                    </p>
                  )}
                </div>

                {/* Driver Contact */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Driver Contact No *</Label>
                  <Input
                    placeholder="e.g. +91 98201 44512"
                    value={driverContact}
                    onChange={(e) => {
                      setDriverContact(e.target.value);
                      if (passFieldErrors.driverContact) setPassFieldErrors((prev) => ({ ...prev, driverContact: null }));
                    }}
                    className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                      passFieldErrors.driverContact
                        ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                        : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {passFieldErrors.driverContact && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {passFieldErrors.driverContact}
                    </p>
                  )}
                </div>

                {/* Transporter Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Transporter Name *</Label>
                  <Input
                    placeholder="e.g. VRL Logistics / SafeExpress"
                    value={transporterName}
                    onChange={(e) => {
                      setTransporterName(e.target.value);
                      if (passFieldErrors.transporterName) setPassFieldErrors((prev) => ({ ...prev, transporterName: null }));
                    }}
                    className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                      passFieldErrors.transporterName
                        ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                        : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {passFieldErrors.transporterName && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {passFieldErrors.transporterName}
                    </p>
                  )}
                </div>
              </div>

              {/* Inward / Outward fields */}
              {passType === "INWARD" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                 <div className="space-y-1">
  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
    Supplier / Source *
  </Label>

  <Select
    value={supplierSource}
    onValueChange={(value) => {
      setSupplierSource(value);

      if (passFieldErrors.supplierSource) {
        setPassFieldErrors((prev) => ({
          ...prev,
          supplierSource: null,
        }));
      }
    }}
  >
    <SelectTrigger
      className={`h-10 w-full rounded-xl text-xs font-semibold ${
        passFieldErrors.supplierSource
          ? "border-red-500 focus:ring-red-500"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <SelectValue placeholder="Select Supplier" />
    </SelectTrigger>

    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      {suppliers.length === 0 ? (
        <SelectItem value="no-supplier" disabled>
          No suppliers found
        </SelectItem>
      ) : (
        suppliers.map((sup) => (
          <SelectItem
            key={sup.id}
            value={String(sup.id)}
            className="text-xs focus:bg-slate-100 dark:focus:bg-slate-800"
          >
            {sup.name} ({sup.code})
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>

  {passFieldErrors.supplierSource && (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {passFieldErrors.supplierSource}
    </p>
  )}
</div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Delivery Challan (DC) # *</Label>
                    <Input
                      placeholder="e.g. DC-99410"
                      value={deliveryChallanNumber}
                      onChange={(e) => {
                        setDeliveryChallanNumber(e.target.value);
                        if (passFieldErrors.deliveryChallanNumber) setPassFieldErrors((prev) => ({ ...prev, deliveryChallanNumber: null }));
                      }}
                      className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                        passFieldErrors.deliveryChallanNumber
                          ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                          : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                      }`}
                    />
                    {passFieldErrors.deliveryChallanNumber && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {passFieldErrors.deliveryChallanNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Declared Quantity *</Label>
                    <Input
                      placeholder="e.g. 500 Ltrs / 20 Drums"
                      value={declaredQuantity}
                      onChange={(e) => {
                        setDeclaredQuantity(e.target.value);
                        if (passFieldErrors.declaredQuantity) setPassFieldErrors((prev) => ({ ...prev, declaredQuantity: null }));
                      }}
                      className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                        passFieldErrors.declaredQuantity
                          ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                          : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                      }`}
                    />
                    {passFieldErrors.declaredQuantity && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {passFieldErrors.declaredQuantity}
                      </p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Number *</Label>
                    <Input
                      placeholder="e.g. INV-2026-9021"
                      value={invoiceNumber}
                      onChange={(e) => {
                        setInvoiceNumber(e.target.value);
                        if (passFieldErrors.invoiceNumber) setPassFieldErrors((prev) => ({ ...prev, invoiceNumber: null }));
                      }}
                      className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                        passFieldErrors.invoiceNumber
                          ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                          : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                      }`}
                    />
                    {passFieldErrors.invoiceNumber && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {passFieldErrors.invoiceNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Outward Purpose *</Label>
                    <Input
                      placeholder="e.g. Sales Dispatch / Equipment Repair"
                      value={purpose}
                      onChange={(e) => {
                        setPurpose(e.target.value);
                        if (passFieldErrors.purpose) setPassFieldErrors((prev) => ({ ...prev, purpose: null }));
                      }}
                      className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                        passFieldErrors.purpose
                          ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                          : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                      }`}
                    />
                    {passFieldErrors.purpose && (
                      <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {passFieldErrors.purpose}
                      </p>
                    )}
                  </div>

                  {isSales && (
                    <div className="sm:col-span-2 space-y-1">
                      <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        passFieldErrors.coaGenerated
                          ? "bg-red-100 dark:bg-red-950/20 border-red-400 dark:border-red-900/50 text-red-900 dark:text-red-200"
                          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="coaCheck"
                            checked={coaGenerated}
                            onCheckedChange={(v) => {
                              setCoaGenerated(!!v);
                              if (passFieldErrors.coaGenerated) setPassFieldErrors((prev) => ({ ...prev, coaGenerated: null }));
                            }}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                          <Label htmlFor="coaCheck" className="text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                            Certificate of Analysis (COA) Generated & Verified *
                          </Label>
                        </div>
                        <span className="text-[10px] text-amber-700 dark:text-amber-450 font-semibold">Rule 9.2 Enforced</span>
                      </div>
                      {passFieldErrors.coaGenerated && (
                        <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {passFieldErrors.coaGenerated}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="h-10 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={passSubmitting}
                  className="h-10 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-6 rounded-xl shadow-md"
                >
                  {passSubmitting ? "Issuing Gate Pass..." : "Issue Gate Pass"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pass Category CRUD Management */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl flex items-center gap-2">
                  <Tags className="h-6 w-6 text-purple-600 dark:text-purple-450" />
                  Pass Category Management (Redux CRUD)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Create, edit, and manage custom categories for gate pass selection via Redux Toolkit</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCatModal(false)}
                className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-350"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {catError && (
              <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 flex items-center gap-2.5 text-red-800 dark:text-red-300 text-xs font-bold shadow-xs">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            {catSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{catSuccess}</span>
              </div>
            )}

            {/* Category Create/Edit Form */}
            <form onSubmit={handleSaveCategory} noValidate className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {editingCatId ? "Edit Pass Category" : "Add New Pass Category"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name *</Label>
                  <Input
                    placeholder="e.g. Courier & Parcel"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (catFieldErrors.catName) setCatFieldErrors((prev) => ({ ...prev, catName: null }));
                    }}
                    className={`h-9 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                      catFieldErrors.catName
                        ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                        : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {catFieldErrors.catName && (
                    <p className="text-red-600 dark:text-red-400 text-[10px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {catFieldErrors.catName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Code *</Label>
                  <Input
                    placeholder="e.g. IN_PARCEL"
                    value={catCode}
                    onChange={(e) => {
                      setCatCode(e.target.value);
                      if (catFieldErrors.catCode) setCatFieldErrors((prev) => ({ ...prev, catCode: null }));
                    }}
                    className={`h-9 text-xs font-mono uppercase rounded-xl bg-transparent text-slate-900 dark:text-slate-100 transition-colors ${
                      catFieldErrors.catCode
                        ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 focus-visible:ring-red-500 text-red-900 dark:text-red-200 font-medium"
                        : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {catFieldErrors.catCode && (
                    <p className="text-red-600 dark:text-red-400 text-[10px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {catFieldErrors.catCode}
                    </p>
                  )}
                </div>

               <div className="space-y-1">
  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
    Type *
  </Label>

  <Select value={catType} onValueChange={setCatType}>
    <SelectTrigger className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold">
      <SelectValue placeholder="Select Type" />
    </SelectTrigger>

    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      <SelectItem
        value="INWARD"
        className="text-xs focus:bg-slate-100 dark:focus:bg-slate-800"
      >
        INWARD
      </SelectItem>

      <SelectItem
        value="OUTWARD"
        className="text-xs focus:bg-slate-100 dark:focus:bg-slate-800"
      >
        OUTWARD
      </SelectItem>
    </SelectContent>
  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description *</Label>
                <Input
                  placeholder="Short explanation of movement covered under this category"
                  value={catDesc}
                  onChange={(e) => {
                    setCatDesc(e.target.value);
                    if (catFieldErrors.catDesc) setCatFieldErrors((prev) => ({ ...prev, catDesc: null }));
                  }}
                  className={`h-9 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 ${
                    catFieldErrors.catDesc ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-medium" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                  }`}
                />
                {catFieldErrors.catDesc && (
                  <p className="text-red-600 dark:text-red-400 text-[10px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {catFieldErrors.catDesc}
                  </p>
                )}
              </div>

              {/* Status Switch Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5">
                  <Label htmlFor="category-status-switch" className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Status</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Allow this category to be selected for gate passes when active</p>
                </div>
                <Switch
                  id="category-status-switch"
                  checked={isActiveCat}
                  onCheckedChange={setIsActiveCat}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingCatId && (
                  <Button type="button" variant="outline" onClick={resetCatForm} className="h-8 text-xs font-bold rounded-xl">
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={catSubmitting} className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 rounded-xl shadow-xs">
                  {catSubmitting ? "Saving..." : editingCatId ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">Configure Pass Categories Master</h4>
              <DataTable
                columns={categoryColumns}
                data={categories}
                pageSize={5}
                searchPlaceholder="Search categories..."
                emptyMessage="No categories defined"
                emptyDescription="Create a new pass category using the form above."
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Image Modal */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImageModal(null)}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl max-w-2xl w-full max-h-[85vh] relative flex flex-col items-center shadow-2xl space-y-3 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-sky-600 dark:text-sky-450" /> Attached Gate Pass Image
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewImageModal(null)}
                className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Image src={previewImageModal} alt="Gate Pass Image Preview" width={800} height={600} className="max-h-[70vh] w-auto object-contain rounded-xl border border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      )}
      {/* Confirm Delete Category Dialog */}
      <ConfirmDialog
        open={deleteCatConfirmOpen}
        onOpenChange={setDeleteCatConfirmOpen}
        title="Delete Pass Category?"
        description="Are you sure you want to delete this pass category? This action cannot be undone."
        confirmText="Delete Category"
        onConfirm={confirmDeleteCategory}
        loading={deleteCatLoading}
      />
    </div>
  );
}

