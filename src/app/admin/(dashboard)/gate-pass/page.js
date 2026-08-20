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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SelectContent ,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
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
  Users,
  Building2,
  User,
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
  const selectedCatObj = categories.find((c) => String(c.id) === String(selectedCategoryId));
  const isVisitor = selectedCatObj
    ? selectedCatObj.name.toLowerCase().includes("visitor") || selectedCatObj.code?.toLowerCase().includes("visitor Entry")
    : false;
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

    if (isVisitor) {
      // 2. Visitor Name Validation
      if (!driverName.trim()) {
        errors.driverName = "Visitor Full Name is required.";
      } else if (driverName.trim().length < 2) {
        errors.driverName = "Visitor Name must be at least 2 characters.";
      }

      // 3. Visitor Contact Validation
      if (!driverContact.trim()) {
        errors.driverContact = "Visitor Contact No is required.";
      } else if (!/^\d{10}$/.test(driverContact.trim())) {
        errors.driverContact = "Please enter a valid 10-digit Mobile number.";
      }

      // 4. Visiting From / Organization Validation
      if (!transporterName.trim()) {
        errors.transporterName = "Visiting From / Company / Organization is required.";
      }

      // 5. Vehicle / Entry Mode Validation
      if (!vehicleNumber.trim()) {
        errors.vehicleNumber = "Vehicle Number or Entry Mode (e.g. WALKING) is required.";
      } else if (!/^[A-Z0-9\-\s]{2,20}$/i.test(vehicleNumber.trim())) {
        errors.vehicleNumber = "Invalid Vehicle / Entry Mode format.";
      }

      // 6. Person to Meet / Department Validation
      if (!supplierSource.trim()) {
        errors.supplierSource = "Person to Meet / Host Department is required.";
      }

      // 7. Purpose of Visit Validation
      if (!purpose.trim()) {
        errors.purpose = "Purpose of Visit is required.";
      }
    } else {
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
      } else if (!/^\d{10}$/.test(driverContact.trim())) {
        errors.driverContact = "Please enter a valid 10-digit Mobile number.";
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
    }

    if (Object.keys(errors).length > 0) {
      setPassFieldErrors(errors);
      setFormError("Please correct all highlighted fields in red below.");
      return;
    }

    const resultAction = await dispatch(
      createGatePass({
        type: passType,
        categoryId: selectedCategoryId,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        driverName: driverName.trim(),
        driverContact: driverContact.trim(),
        transporterName: transporterName.trim(),
        supplierSource: supplierSource.trim(),
        deliveryChallanNumber: isVisitor ? (deliveryChallanNumber.trim() || "N/A") : deliveryChallanNumber.trim(),
        declaredQuantity: isVisitor ? (declaredQuantity.trim() || "1 Person") : declaredQuantity.trim(),
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
      header: "Vehicle & Driver / Visitor",
      cell: (row) => {
        const rowIsVis =
          row.category?.name?.toLowerCase().includes("visitor") ||
          row.category?.code?.toLowerCase().includes("vis");
        return (
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
                {rowIsVis ? (
                  <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Truck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                )}
                {row.vehicleNumber}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {row.driverName} {row.driverContact ? `(${row.driverContact})` : ""}
                {rowIsVis && row.transporterName ? ` • ${row.transporterName}` : ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "supplierSource",
      header: "Source / Purpose / Host",
      cell: (row) => {
        const rowIsVis =
          row.category?.name?.toLowerCase().includes("visitor") ||
          row.category?.code?.toLowerCase().includes("vis");
        const isInward = row.type === "INWARD";

        if (rowIsVis) {
          return (
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                To Meet: <span className="font-bold">{row.supplierSource || "N/A"}</span>
              </div>
              <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                {row.purpose || "Official Visit"}
              </div>
            </div>
          );
        }

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
        const rowIsVis =
          row.category?.name?.toLowerCase().includes("visitor") ||
          row.category?.code?.toLowerCase().includes("vis");
        const isInward = row.type === "INWARD";

        if (rowIsVis) {
          return (
            <div className="space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
              <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-medium">
                👤 {row.declaredQuantity || "1 Person"}
              </Badge>
            </div>
          );
        }

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
      onClick={() => dispatch(fetchGatePasses({ search, page: currentPage, limit, type: activeTab }))}
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
      {/* Modal 1: Issue Gate Pass (PERFECT FULL SCREEN VIEW 2-COLUMN LANDSCAPE) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] max-h-[94vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Top Gradient Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-3 opacity-10">
              <Truck className="h-28 w-28" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-sky-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    Issue Digital Gate Pass
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    Record vehicle movement, verify compliance documents & track plant entry/exit.
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
                <span className={`text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-md border flex items-center gap-1.5 ${
                  passType === "INWARD"
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}>
                  {passType === "INWARD" ? (
                    <>
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      9.1 INWARD MOVEMENT
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      9.2 OUTWARD MOVEMENT
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreatePass} noValidate autoComplete="off" className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 bg-card flex-1 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* TOP FULL-WIDTH SECTION: MOVEMENT TYPE SELECTION */}
              <div className="border rounded-2xl p-3.5 bg-muted/20 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-sky-600" />
                    Select Movement Classification *
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {passType === "INWARD" ? "Raw materials, purchases & inbound" : "Sales dispatches, plant transfers & outbound"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPassType("INWARD");
                      const firstInward = categories.find(
                        (c) => c.type === "INWARD" && (c.isActive ?? true)
                      );
                      setSelectedCategoryId(firstInward ? String(firstInward.id) : "");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      passType === "INWARD"
                        ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30 shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${passType === "INWARD" ? "bg-sky-500/20 text-sky-600 dark:text-sky-400" : "bg-muted text-muted-foreground"}`}>
                        <ArrowDownLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">9.1 Inward Gate Pass</div>
                        <div className="text-[11px] font-normal text-muted-foreground">Inbound raw materials & shipments</div>
                      </div>
                    </div>
                    {passType === "INWARD" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-sky-600 ring-4 ring-sky-500/20 shrink-0" />
                    )}
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
                    className={`p-2.5 rounded-xl border text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      passType === "OUTWARD"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${passType === "OUTWARD" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">9.2 Outward Gate Pass</div>
                        <div className="text-[11px] font-normal text-muted-foreground">Outbound dispatches & sales</div>
                      </div>
                    </div>
                    {passType === "OUTWARD" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-500/20 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* 2-COLUMN WIDE LANDSCAPE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* LEFT COLUMN: Vehicle & Driver OR Visitor Identification */}
                <div className="space-y-4">
                  {isVisitor ? (
                    /* VISITOR SPECIFIC LEFT COLUMN */
                    <div className="border border-purple-200 dark:border-purple-900/50 rounded-2xl p-4 bg-purple-50/30 dark:bg-purple-950/10 space-y-3.5 shadow-sm">
                      <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/50 dark:border-purple-800/40">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                            1. Visitor Personal & Contact Details
                          </h4>
                        </div>
                        <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 text-[10px] font-bold">
                          Visitor Pass Mode
                        </Badge>
                      </div>

                      {/* Visitor Full Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="driverName" className="text-xs font-bold text-foreground">
                          Visitor Full Name *
                        </Label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                          <Input
                            id="driverName"
                            placeholder="e.g. Dr. Amit Sharma / Rajesh Verma"
                            value={driverName}
                            onKeyDown={(e) => {
                              if (/[0-9]/.test(e.key)) e.preventDefault();
                            }}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[0-9]/g, "");
                              setDriverName(cleaned);
                              if (passFieldErrors.driverName && cleaned.trim()) {
                                setPassFieldErrors((prev) => ({ ...prev, driverName: null }));
                              }
                            }}
                            className={`h-10 pl-9 text-xs sm:text-sm rounded-xl bg-background ${
                              passFieldErrors.driverName
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                            }`}
                          />
                        </div>
                        {passFieldErrors.driverName && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {passFieldErrors.driverName}
                          </p>
                        )}
                      </div>

                      {/* Visitor Contact & Visiting From / Organization */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="driverContact" className="text-xs font-bold text-foreground">
                            Mobile Contact (10 Digits) *
                          </Label>
                          <Input
                            id="driverContact"
                            placeholder="e.g. 9870011223"
                            value={driverContact}
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
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
                              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setDriverContact(cleaned);
                              if (passFieldErrors.driverContact && cleaned.length === 10) {
                                setPassFieldErrors((prev) => ({ ...prev, driverContact: null }));
                              }
                            }}
                            className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                              passFieldErrors.driverContact
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                            }`}
                          />
                          {passFieldErrors.driverContact && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.driverContact}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="transporterName" className="text-xs font-bold text-foreground">
                            Visiting From / Company *
                          </Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input
                              id="transporterName"
                              placeholder="e.g. FDA Team / Cipla / Self"
                              value={transporterName}
                              onChange={(e) => {
                                setTransporterName(e.target.value);
                                if (passFieldErrors.transporterName) setPassFieldErrors((prev) => ({ ...prev, transporterName: null }));
                              }}
                              className={`h-10 pl-9 text-xs sm:text-sm rounded-xl bg-background ${
                                passFieldErrors.transporterName
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                              }`}
                            />
                          </div>
                          {passFieldErrors.transporterName && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.transporterName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Number / Entry Mode */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="vehicleNumber" className="text-xs font-bold text-foreground">
                            Vehicle No. or Entry Mode *
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              setVehicleNumber("WALKING");
                              if (passFieldErrors.vehicleNumber) setPassFieldErrors((prev) => ({ ...prev, vehicleNumber: null }));
                            }}
                            className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            🚶 Set "WALKING" (Pedestrian)
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="vehicleNumber"
                            placeholder="e.g. MH-12-PQ-2019 or WALKING"
                            value={vehicleNumber}
                            onChange={(e) => {
                              setVehicleNumber(e.target.value.toUpperCase());
                              if (passFieldErrors.vehicleNumber) setPassFieldErrors((prev) => ({ ...prev, vehicleNumber: null }));
                            }}
                            className={`h-10 pr-32 text-xs sm:text-sm font-mono font-bold uppercase rounded-xl bg-background ${
                              passFieldErrors.vehicleNumber
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                            }`}
                          />
                          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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
                              className="h-7 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg px-2.5 gap-1 shadow-xs cursor-pointer"
                            >
                              <Upload className="h-3 w-3" />
                              {imageUrl ? "Change Photo" : "Upload Photo"}
                            </Button>
                          </div>
                        </div>
                        {passFieldErrors.vehicleNumber && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {passFieldErrors.vehicleNumber}
                          </p>
                        )}

                        {/* Attached Photo Thumbnail Card */}
                        {imageUrl && (
                          <div className="mt-2 flex items-center gap-2.5 p-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-background w-fit">
                            <Image
                              src={imageUrl}
                              alt="Gate Pass Photo"
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover rounded-lg border border-purple-200"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-foreground">Photo Attached</p>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="text-red-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" /> Remove Photo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* STANDARD MATERIAL VEHICLE & DRIVER IDENTIFICATION */
                    <div className="border rounded-2xl p-4 bg-muted/20 space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                        <Truck className="h-4 w-4 text-sky-600" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          1. Vehicle & Driver Identification
                        </h4>
                      </div>

                      {/* Vehicle Number with integrated Photo Upload Button */}
                      <div className="space-y-1.5">
                        <Label htmlFor="vehicleNumber" className="text-xs font-bold text-foreground">
                          Vehicle Number *
                        </Label>
                        <div className="relative">
                          <Input
                            id="vehicleNumber"
                            placeholder="e.g. MH-04-JK-8842"
                            value={vehicleNumber}
                            onChange={(e) => {
                              setVehicleNumber(e.target.value.toUpperCase());
                              if (passFieldErrors.vehicleNumber) setPassFieldErrors((prev) => ({ ...prev, vehicleNumber: null }));
                            }}
                            className={`h-10 pr-32 text-xs sm:text-sm font-mono font-bold uppercase rounded-xl bg-background ${
                              passFieldErrors.vehicleNumber
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-border focus-visible:ring-sky-500"
                            }`}
                          />
                          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
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
                              className="h-7 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg px-2.5 gap-1 shadow-xs cursor-pointer"
                            >
                              <Upload className="h-3 w-3" />
                              {imageUrl ? "Change Photo" : "Upload Photo"}
                            </Button>
                          </div>
                        </div>
                        {passFieldErrors.vehicleNumber && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {passFieldErrors.vehicleNumber}
                          </p>
                        )}

                        {/* Attached Photo Thumbnail Card */}
                        {imageUrl && (
                          <div className="mt-2 flex items-center gap-2.5 p-2 rounded-xl border border-border bg-background w-fit">
                            <Image
                              src={imageUrl}
                              alt="Gate Pass Photo"
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover rounded-lg border border-border"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-foreground">Photo Attached</p>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="text-red-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" /> Remove Photo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Driver Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="driverName" className="text-xs font-bold text-foreground">
                            Driver Name *
                          </Label>
                          <div className="relative">
                            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input
                              id="driverName"
                              placeholder="e.g. Rajesh Kumar"
                              value={driverName}
                              onKeyDown={(e) => {
                                if (/[0-9]/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/[0-9]/g, "");
                                setDriverName(cleaned);
                                if (passFieldErrors.driverName && cleaned.trim()) {
                                  setPassFieldErrors((prev) => ({ ...prev, driverName: null }));
                                }
                              }}
                              className={`h-10 pl-9 text-xs sm:text-sm rounded-xl bg-background ${
                                passFieldErrors.driverName
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-border focus-visible:ring-sky-500"
                              }`}
                            />
                          </div>
                          {passFieldErrors.driverName && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.driverName}
                            </p>
                          )}
                        </div>

                        {/* Driver Contact */}
                        <div className="space-y-1.5">
                          <Label htmlFor="driverContact" className="text-xs font-bold text-foreground">
                            Driver Contact (10 Digits) *
                          </Label>
                          <Input
                            id="driverContact"
                            placeholder="e.g. 9820144512"
                            value={driverContact}
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
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
                              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setDriverContact(cleaned);
                              if (passFieldErrors.driverContact && cleaned.length === 10) {
                                setPassFieldErrors((prev) => ({ ...prev, driverContact: null }));
                              }
                            }}
                            className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                              passFieldErrors.driverContact
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-border focus-visible:ring-sky-500"
                            }`}
                          />
                          {passFieldErrors.driverContact && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.driverContact}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Transporter Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="transporterName" className="text-xs font-bold text-foreground">
                          Transporter / Logistics Company *
                        </Label>
                        <Input
                          id="transporterName"
                          placeholder="e.g. VRL Logistics / SafeExpress"
                          value={transporterName}
                          onChange={(e) => {
                            setTransporterName(e.target.value);
                            if (passFieldErrors.transporterName) setPassFieldErrors((prev) => ({ ...prev, transporterName: null }));
                          }}
                          className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                            passFieldErrors.transporterName
                              ? "border-red-500 focus-visible:ring-red-500"
                              : "border-border focus-visible:ring-sky-500"
                          }`}
                        />
                        {passFieldErrors.transporterName && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {passFieldErrors.transporterName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Pass Category, Movement Specifics & Security Notes */}
                <div className="space-y-4">
                  {/* Section 2: Pass Category & Details */}
                  <div className={`border rounded-2xl p-4 space-y-3.5 shadow-sm ${
                    isVisitor
                      ? "border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10"
                      : "bg-muted/20 border-border"
                  }`}>
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <FileText className={`h-4 w-4 ${isVisitor ? "text-purple-600 dark:text-purple-400" : "text-sky-600"}`} />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        {isVisitor
                          ? "2. Pass Category, Host & Purpose of Visit"
                          : `2. Pass Category & ${passType === "INWARD" ? "Inward Shipment Details" : "Outward Dispatch Details"}`}
                      </h4>
                    </div>

                    {/* Pass Category Dropdown */}
                    <div className="space-y-1.5">
                      <Label htmlFor="passCategorySelect" className="text-xs font-bold text-foreground">
                        Pass Category *
                      </Label>
                      <Select
                        value={selectedCategoryId}
                        onValueChange={(value) => {
                          setSelectedCategoryId(value);
                          if (passFieldErrors.category) {
                            setPassFieldErrors((prev) => ({ ...prev, category: null }));
                          }
                        }}
                      >
                        <SelectTrigger
                          id="passCategorySelect"
                          className={`h-10 rounded-xl text-xs sm:text-sm bg-background font-semibold ${
                            passFieldErrors.category
                              ? "border-red-500 focus-visible:ring-red-500"
                              : isVisitor
                              ? "border-purple-300 dark:border-purple-800 focus-visible:ring-purple-500 ring-1 ring-purple-400/30"
                              : "border-border focus-visible:ring-sky-500"
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
                        <SelectContent className="max-h-56">
                          {availableCategoriesForType.length === 0 ? (
                            <div className="py-2 px-3 text-xs text-muted-foreground italic">
                              No categories defined for {passType}
                            </div>
                          ) : (
                            availableCategoriesForType.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)} className="text-xs sm:text-sm">
                                {cat.name} <span className="text-xs text-muted-foreground font-mono">({cat.code})</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {passFieldErrors.category && (
                        <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {passFieldErrors.category}
                        </p>
                      )}
                    </div>

                    {isVisitor ? (
                      /* VISITOR SPECIFIC HOST & PURPOSE FIELDS */
                      <div className="space-y-3">
                        {/* Person to Meet / Department */}
                        <div className="space-y-1.5">
                          <Label htmlFor="supplierSource" className="text-xs font-bold text-foreground">
                            Person to Meet / Host Department *
                          </Label>
                          <Input
                            id="supplierSource"
                            placeholder="e.g. Dr. Rajesh Sharma (QC Head) / Admin Office / HR"
                            value={supplierSource}
                            onChange={(e) => {
                              setSupplierSource(e.target.value);
                              if (passFieldErrors.supplierSource) {
                                setPassFieldErrors((prev) => ({ ...prev, supplierSource: null }));
                              }
                            }}
                            className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                              passFieldErrors.supplierSource
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                            }`}
                          />
                          {passFieldErrors.supplierSource && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.supplierSource}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Purpose of Visit */}
                          <div className="space-y-1.5">
                            <Label htmlFor="purpose" className="text-xs font-bold text-foreground">
                              Purpose of Visit *
                            </Label>
                            <Input
                              id="purpose"
                              placeholder="e.g. GMP Audit / Official Meeting"
                              value={purpose}
                              onChange={(e) => {
                                setPurpose(e.target.value);
                                if (passFieldErrors.purpose) setPassFieldErrors((prev) => ({ ...prev, purpose: null }));
                              }}
                              className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                                passFieldErrors.purpose
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                              }`}
                            />
                            {passFieldErrors.purpose && (
                              <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {passFieldErrors.purpose}
                              </p>
                            )}
                          </div>

                          {/* Number of Persons / Badge ID */}
                          <div className="space-y-1.5">
                            <Label htmlFor="declaredQuantity" className="text-xs font-bold text-foreground">
                              Number of Persons / Badge Ref
                            </Label>
                            <Input
                              id="declaredQuantity"
                              placeholder="e.g. 1 Person / Badge-04"
                              value={declaredQuantity}
                              onChange={(e) => setDeclaredQuantity(e.target.value)}
                              className="h-10 text-xs sm:text-sm rounded-xl bg-background border-purple-200 dark:border-purple-800/60 focus-visible:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : passType === "INWARD" ? (
                      /* STANDARD INWARD SHIPMENT FIELDS */
                      <div className="space-y-3">
                        {/* Supplier Selection */}
                        <div className="space-y-1.5">
                          <Label htmlFor="supplierSource" className="text-xs font-bold text-foreground">
                            Supplier / Source *
                          </Label>
                          <Select
                            value={supplierSource}
                            onValueChange={(value) => {
                              const [name] = value.split("||");
                              setSupplierSource(name);
                              if (passFieldErrors.supplierSource) {
                                setPassFieldErrors((prev) => ({ ...prev, supplierSource: null }));
                              }
                            }}
                          >
                            <SelectTrigger
                              id="supplierSource"
                              className={`h-10 rounded-xl text-xs sm:text-sm bg-background font-semibold ${
                                passFieldErrors.supplierSource
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-border focus-visible:ring-sky-500"
                              }`}
                            >
                              <SelectValue placeholder="Select Registered Supplier" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                              {suppliers.length === 0 ? (
                                <div className="py-2 px-3 text-xs text-muted-foreground italic">
                                  No active suppliers found
                                </div>
                              ) : (
                                suppliers.map((sup) => (
                                  <SelectItem key={sup.id} value={`${sup.name}||${sup.code}`} className="text-xs sm:text-sm">
                                    {sup.name} <span className="text-xs text-muted-foreground font-mono">({sup.code})</span>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {passFieldErrors.supplierSource && (
                            <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {passFieldErrors.supplierSource}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Delivery Challan Number */}
                          <div className="space-y-1.5">
                            <Label htmlFor="deliveryChallanNumber" className="text-xs font-bold text-foreground">
                              Delivery Challan (DC) # *
                            </Label>
                            <Input
                              id="deliveryChallanNumber"
                              placeholder="e.g. DC-99410"
                              value={deliveryChallanNumber}
                              onChange={(e) => {
                                setDeliveryChallanNumber(e.target.value);
                                if (passFieldErrors.deliveryChallanNumber) setPassFieldErrors((prev) => ({ ...prev, deliveryChallanNumber: null }));
                              }}
                              className={`h-10 text-xs sm:text-sm rounded-xl bg-background font-mono ${
                                passFieldErrors.deliveryChallanNumber
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-border focus-visible:ring-sky-500"
                              }`}
                            />
                            {passFieldErrors.deliveryChallanNumber && (
                              <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {passFieldErrors.deliveryChallanNumber}
                              </p>
                            )}
                          </div>

                          {/* Declared Quantity */}
                          <div className="space-y-1.5">
                            <Label htmlFor="declaredQuantity" className="text-xs font-bold text-foreground">
                              Declared Quantity *
                            </Label>
                            <Input
                              id="declaredQuantity"
                              placeholder="e.g. 500 Ltrs / 20 Drums"
                              value={declaredQuantity}
                              onChange={(e) => {
                                setDeclaredQuantity(e.target.value);
                                if (passFieldErrors.declaredQuantity) setPassFieldErrors((prev) => ({ ...prev, declaredQuantity: null }));
                              }}
                              className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                                passFieldErrors.declaredQuantity
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-border focus-visible:ring-sky-500"
                              }`}
                            />
                            {passFieldErrors.declaredQuantity && (
                              <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {passFieldErrors.declaredQuantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* STANDARD OUTWARD SHIPMENT FIELDS */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Invoice Number */}
                          <div className="space-y-1.5">
                            <Label htmlFor="invoiceNumber" className="text-xs font-bold text-foreground">
                              Invoice Number *
                            </Label>
                            <Input
                              id="invoiceNumber"
                              placeholder="e.g. INV-2026-9021"
                              value={invoiceNumber}
                              onChange={(e) => {
                                setInvoiceNumber(e.target.value);
                                if (passFieldErrors.invoiceNumber) setPassFieldErrors((prev) => ({ ...prev, invoiceNumber: null }));
                              }}
                              className={`h-10 text-xs sm:text-sm rounded-xl bg-background font-mono ${
                                passFieldErrors.invoiceNumber
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-border focus-visible:ring-sky-500"
                              }`}
                            />
                            {passFieldErrors.invoiceNumber && (
                              <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {passFieldErrors.invoiceNumber}
                              </p>
                            )}
                          </div>

                          {/* Outward Purpose */}
                          <div className="space-y-1.5">
                            <Label htmlFor="purpose" className="text-xs font-bold text-foreground">
                              Outward Purpose *
                            </Label>
                            <Input
                              id="purpose"
                              placeholder="e.g. Sales Dispatch / Repair"
                              value={purpose}
                              onChange={(e) => {
                                setPurpose(e.target.value);
                                if (passFieldErrors.purpose) setPassFieldErrors((prev) => ({ ...prev, purpose: null }));
                              }}
                              className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                                passFieldErrors.purpose
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-border focus-visible:ring-sky-500"
                              }`}
                            />
                            {passFieldErrors.purpose && (
                              <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                {passFieldErrors.purpose}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* COA Verification Checkbox for Sales */}
                        {isSales && (
                          <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                            passFieldErrors.coaGenerated
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-amber-500/10 border-amber-500/30 text-foreground"
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <Checkbox
                                id="coaCheck"
                                checked={coaGenerated}
                                onCheckedChange={(v) => {
                                  setCoaGenerated(!!v);
                                  if (passFieldErrors.coaGenerated) setPassFieldErrors((prev) => ({ ...prev, coaGenerated: null }));
                                }}
                                className="h-4.5 w-4.5 data-[state=checked]:bg-emerald-600"
                              />
                              <Label htmlFor="coaCheck" className="text-xs font-bold cursor-pointer">
                                Certificate of Analysis (COA) Generated & Verified *
                              </Label>
                            </div>
                            <Badge variant="outline" className="text-[11px] border-amber-500/40 text-amber-500 font-bold">
                              Rule 9.2 Enforced
                            </Badge>
                          </div>
                        )}
                        {passFieldErrors.coaGenerated && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {passFieldErrors.coaGenerated}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Security Notes & Live Timestamps */}
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-3.5 shadow-sm">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/40">
                      <Clock className="h-4 w-4 text-sky-600" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        3. Security Notes & Live Timestamps
                      </h4>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-bold text-foreground">
                        Security & Movement Remarks
                      </Label>
                      <Textarea
                        id="notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Special instructions, seal condition, gate keeper remarks..."
                        className="text-xs sm:text-sm rounded-xl bg-background min-h-[60px] border-border focus-visible:ring-sky-500"
                      />
                    </div>

                    {/* Automatic Time In indicator */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-sky-600" />
                        <span className="text-xs font-bold text-foreground">Entry Timestamp</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-600 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                        Auto-recorded on submit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-border/40 bg-muted/20 shrink-0 flex items-center justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="h-10 text-xs sm:text-sm font-bold rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={passSubmitting}
                className="h-10 text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-7 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {passSubmitting ? "Issuing Gate Pass..." : "Issue Gate Pass"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Pass Category CRUD Management */}
      <Dialog open={showCatModal} onOpenChange={setShowCatModal}>
        <DialogContent className="max-w-5xl xl:max-w-6xl w-[96vw] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Tags className="h-32 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Tags className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white">
                  Pass Category Master Management
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Create, configure, and maintain material and dispatch movement classifications.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 bg-card max-h-[80vh] overflow-y-auto">
            {catError && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-destructive text-xs sm:text-sm font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            {catSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-400 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{catSuccess}</span>
              </div>
            )}

            {/* Category Create/Edit Form */}
            <form onSubmit={handleSaveCategory} noValidate className="p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {editingCatId ? "Edit Pass Category" : "Add New Pass Category"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Category Name *</Label>
                  <Input
                    placeholder="e.g. Courier & Parcel"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (catFieldErrors.catName) setCatFieldErrors((prev) => ({ ...prev, catName: null }));
                    }}
                    className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                      catFieldErrors.catName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {catFieldErrors.catName && (
                    <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {catFieldErrors.catName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Code *</Label>
                  <Input
                    placeholder="e.g. IN_PARCEL"
                    value={catCode}
                    onChange={(e) => {
                      setCatCode(e.target.value.toUpperCase());
                      if (catFieldErrors.catCode) setCatFieldErrors((prev) => ({ ...prev, catCode: null }));
                    }}
                    className={`h-10 text-xs sm:text-sm font-mono uppercase rounded-xl bg-background font-bold ${
                      catFieldErrors.catCode
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-border focus-visible:ring-sky-500"
                    }`}
                  />
                  {catFieldErrors.catCode && (
                    <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {catFieldErrors.catCode}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Type *</Label>
                  <Select value={catType} onValueChange={setCatType}>
                    <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-xs sm:text-sm font-semibold">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INWARD" className="text-xs sm:text-sm font-bold text-sky-600">
                        INWARD
                      </SelectItem>
                      <SelectItem value="OUTWARD" className="text-xs sm:text-sm font-bold text-emerald-600">
                        OUTWARD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Description *</Label>
                <Input
                  placeholder="Short explanation of movement covered under this category"
                  value={catDesc}
                  onChange={(e) => {
                    setCatDesc(e.target.value);
                    if (catFieldErrors.catDesc) setCatFieldErrors((prev) => ({ ...prev, catDesc: null }));
                  }}
                  className={`h-10 text-xs sm:text-sm rounded-xl bg-background ${
                    catFieldErrors.catDesc ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-sky-500"
                  }`}
                />
                {catFieldErrors.catDesc && (
                  <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {catFieldErrors.catDesc}
                  </p>
                )}
              </div>

              {/* Status Switch Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-background border border-border/50">
                <div className="space-y-0.5">
                  <Label htmlFor="category-status-switch" className="text-xs sm:text-sm font-bold text-foreground">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">Allow this category to be selected for gate passes when active</p>
                </div>
                <Switch
                  id="category-status-switch"
                  checked={isActiveCat}
                  onCheckedChange={setIsActiveCat}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingCatId && (
                  <Button type="button" variant="outline" onClick={resetCatForm} className="h-10 text-xs sm:text-sm font-bold rounded-xl px-4">
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={catSubmitting} className="h-10 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold px-6 rounded-xl shadow-lg shadow-purple-600/20">
                  {catSubmitting ? "Saving..." : editingCatId ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Configured Pass Categories
              </h4>
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
        </DialogContent>
      </Dialog>

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

