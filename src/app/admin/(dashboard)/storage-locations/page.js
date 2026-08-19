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
import {
  Plus,
  Warehouse,
  Edit,
  Trash2,
  Eye,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Thermometer,
  Sparkles,
  Droplets,
  Building2,
  Boxes,
  MapPin,
  CheckCircle2,
  Snowflake,
  Sun,
  Flame,
  Archive,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generateStorageLocationCode } from "@/lib/code-generator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const STORAGE_CONDITION_CONFIG = {
  AMBIENT: {
    label: "Ambient (15°C - 25°C)",
    temp: "15°C - 25°C",
    humidity: "NMT 60% RH",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: Sun,
  },
  COOL: {
    label: "Cool (8°C - 15°C)",
    temp: "8°C - 15°C",
    humidity: "NMT 55% RH",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    icon: Thermometer,
  },
  COLD_CHAIN: {
    label: "Cold Chain (2°C - 8°C)",
    temp: "2°C - 8°C",
    humidity: "NMT 50% RH",
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    icon: Snowflake,
  },
  FROZEN: {
    label: "Deep Frozen (-20°C ± 5°C)",
    temp: "-25°C to -15°C",
    humidity: "Controlled Dry",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
    icon: Snowflake,
  },
  CONTROLLED_ROOM_TEMPERATURE: {
    label: "Controlled Room Temp (20°C - 25°C)",
    temp: "20°C - 25°C",
    humidity: "NMT 60% RH",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: Thermometer,
  },
};

const STORE_TYPE_OPTIONS = [
  { value: "RAW_MATERIAL_STORE", label: "Raw Material Store" },
  { value: "PACKAGING_STORE", label: "Packaging Material Store" },
  { value: "FINISHED_GOODS_STORE", label: "Finished Goods Store" },
  { value: "QUARANTINE_STORE", label: "Quarantine Store / Holding Bay" },
  { value: "REJECTION_STORE", label: "Rejection / Rejected Goods Store" },
  { value: "IN_TRANSIT_STORE", label: "In-Transit Staging Area" },
];

export default function StorageLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [storeTypeFilter, setStoreTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [ambientCount, setAmbientCount] = useState(0);
  const [coldCount, setColdCount] = useState(0);
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
  const [viewLocation, setViewLocation] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [locationCode, setLocationCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [warehouse, setWarehouse] = useState("Main Warehouse");
  const [storageCondition, setStorageCondition] = useState("AMBIENT");
  const [capacity, setCapacity] = useState("");
  const [linkedStoreType, setLinkedStoreType] = useState("RAW_MATERIAL_STORE");
  const [temperatureRange, setTemperatureRange] = useState("15°C - 25°C");
  const [humidityRange, setHumidityRange] = useState("NMT 60% RH");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Storage Locations
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) queryParams.append("search", debouncedSearch.trim());
      if (conditionFilter && conditionFilter !== "ALL") queryParams.append("storageCondition", conditionFilter);
      if (storeTypeFilter && storeTypeFilter !== "ALL") queryParams.append("linkedStoreType", storeTypeFilter);

      const res = await fetch(`${API_BASE_URL}/storage-location?${queryParams.toString()}`);
      if (!res.ok) {
        setLocations([]);
        return;
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      const meta = json.meta || {};

      setLocations(list);
      setTotalCount(meta.total ?? list.length);
      setActiveCount(meta.active ?? list.filter((l) => l.isActive).length);
      setAmbientCount(meta.ambient ?? list.filter((l) => l.storageCondition === "AMBIENT").length);
      setColdCount(meta.cold ?? list.filter((l) => ["COLD_CHAIN", "COOL", "FROZEN"].includes(l.storageCondition)).length);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      customToast.error("Failed to fetch storage locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [debouncedSearch, conditionFilter, storeTypeFilter, currentPage, pageSize]);

  // Handle Location Name & Store Type Code Auto-generation
  const handleLocationNameChange = (e) => {
    const val = e.target.value;
    setLocationName(val);
    if (!isCodeManual && !editingLocation) {
      setLocationCode(generateStorageLocationCode(linkedStoreType, val));
    }
    if (fieldErrors.locationName) {
      setFieldErrors((prev) => ({ ...prev, locationName: null }));
    }
  };

  const handleStoreTypeChange = (val) => {
    setLinkedStoreType(val);
    if (fieldErrors.linkedStoreType) {
      setFieldErrors((prev) => ({ ...prev, linkedStoreType: null }));
    }
    if (!isCodeManual && !editingLocation && locationName) {
      setLocationCode(generateStorageLocationCode(val, locationName));
      if (fieldErrors.locationCode) {
        setFieldErrors((prev) => ({ ...prev, locationCode: null }));
      }
    }
  };

  const handleConditionChange = (val) => {
    setStorageCondition(val);
    if (fieldErrors.storageCondition) {
      setFieldErrors((prev) => ({ ...prev, storageCondition: null }));
    }
    const config = STORAGE_CONDITION_CONFIG[val];
    if (config) {
      setTemperatureRange(config.temp);
      setHumidityRange(config.humidity);
    }
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingLocation(null);
    setLocationCode("");
    setLocationName("");
    setWarehouse("");
    setStorageCondition("");
    setCapacity("");
    setLinkedStoreType("");
    setTemperatureRange("");
    setHumidityRange("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setLocationCode(loc.locationCode || "");
    setLocationName(loc.locationName || "");
    setWarehouse(loc.warehouse || "");
    setStorageCondition(loc.storageCondition || "");
    setCapacity(loc.capacity || "");
    setLinkedStoreType(loc.linkedStoreType || "");
    setTemperatureRange(loc.temperatureRange || "");
    setHumidityRange(loc.humidityRange || "");
    setIsActive(loc.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFieldErrors({});
    setFormDialogOpen(true);
  };

  // Open View Dialog
  const handleOpenView = (loc) => {
    setViewLocation(loc);
    setDetailsDialogOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};

    if (!linkedStoreType) {
      errors.linkedStoreType = "Store Department is required.";
    }

    if (!warehouse.trim()) {
      errors.warehouse = "Warehouse / Building is required.";
    }

    if (!locationName.trim()) {
      errors.locationName = "Location / Bay Name is required.";
    } else if (locationName.trim().length < 2) {
      errors.locationName = "Location Name must be at least 2 characters.";
    }

    if (!locationCode.trim()) {
      errors.locationCode = "Location Code is required.";
    } else if (!/^[A-Z0-9_-]{2,30}$/i.test(locationCode.trim())) {
      errors.locationCode = "Location Code must be 2-30 alphanumeric characters.";
    }

    if (!storageCondition) {
      errors.storageCondition = "Storage Condition is required.";
    }

    if (!capacity.trim()) {
      errors.capacity = "Capacity is required (e.g. 500 Pallets).";
    }

    if (!temperatureRange.trim()) {
      errors.temperatureRange = "Temperature Range is required.";
    }

    if (!humidityRange.trim()) {
      errors.humidityRange = "Humidity Specification (RH) is required.";
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
        locationCode: locationCode.trim().toUpperCase(),
        locationName: locationName.trim(),
        warehouse: warehouse.trim() || "Main Warehouse",
        storageCondition,
        capacity: capacity.trim(),
        linkedStoreType,
        temperatureRange: temperatureRange.trim() || undefined,
        humidityRange: humidityRange.trim() || undefined,
        isActive,
      };

      const url = editingLocation
        ? `${API_BASE_URL}/storage-location/${editingLocation.id}`
        : `${API_BASE_URL}/storage-location`;
      const method = editingLocation ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save storage location");
      }

      customToast.success(
        editingLocation
          ? "Storage Location updated successfully"
          : "Storage Location created successfully"
      );
      setFormDialogOpen(false);
      fetchLocations();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred");
      customToast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (loc) => {
    try {
      const res = await fetch(`${API_BASE_URL}/storage-location/${loc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !loc.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setLocations((prev) =>
        prev.map((item) =>
          item.id === loc.id ? { ...item, isActive: !item.isActive } : item
        )
      );
      customToast.success(`Location ${!loc.isActive ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      customToast.error(err.message || "Failed to toggle status");
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/storage-location/${locationToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete storage location");
      }

      customToast.success("Storage Location deleted successfully");
      setDeleteConfirmOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (err) {
      customToast.error(err.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: "Location Code",
      accessorKey: "locationCode",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs border border-orange-200 dark:border-orange-800">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm tracking-wide">
                {item?.locationCode}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Location Name",
      accessorKey: "locationName",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div>
            <span className="font-semibold text-xs text-foreground block">
              {item?.locationName}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {item?.warehouse || "Main Warehouse"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Storage Condition",
      accessorKey: "storageCondition",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const cond = item?.storageCondition || "AMBIENT";
        const config = STORAGE_CONDITION_CONFIG[cond] || STORAGE_CONDITION_CONFIG.AMBIENT;
        const IconComp = config.icon;
        return (
          <Badge variant="outline" className={`font-semibold px-2 py-0.5 text-xs flex items-center gap-1 w-fit ${config.color}`}>
            <IconComp className="h-3 w-3" />
            {cond.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      header: "Linked Store Type",
      accessorKey: "linkedStoreType",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        const storeType = item?.linkedStoreType || "";
        let color = "bg-muted text-foreground";
        if (storeType === "RAW_MATERIAL_STORE") color = "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
        if (storeType === "PACKAGING_STORE") color = "bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
        if (storeType === "FINISHED_GOODS_STORE") color = "bg-blue-100/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
        if (storeType === "QUARANTINE_STORE") color = "bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
        if (storeType === "REJECTION_STORE") color = "bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";

        return (
          <Badge variant="secondary" className={`font-medium text-[11px] ${color}`}>
            {storeType.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <span className="font-semibold text-xs text-foreground flex items-center gap-1">
            <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
            {item?.capacity}
          </span>
        );
      },
    },
    {
      header: "Temp / RH Range",
      accessorKey: "temperatureRange",
      cell: (row) => {
        const item = row?.original || row?.row?.original || row;
        return (
          <div className="text-[11px] text-muted-foreground font-medium">
            <div>{item?.temperatureRange || "Ambient"}</div>
            {item?.humidityRange && <div className="text-[10px] text-muted-foreground/80">{item.humidityRange}</div>}
          </div>
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
        const loc = row?.original || row?.row?.original || row;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="View Details"
              onClick={() => handleOpenView(loc)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
              title="Edit Location"
              onClick={() => handleOpenEdit(loc)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              title="Delete Location"
              onClick={() => {
                setLocationToDelete(loc);
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
        title="Warehouse / Storage Location Master"
        description="Configure pharmaceutical storage bays, warehouse zones, temperature conditions (ambient, cold chain) & store capacities."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Masters", href: "#" },
          { label: "Storage Locations" },
        ]}
      >
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Storage Location
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Locations</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Warehouse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ambient Storage</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{ambientCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sun className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cold Chain / Cool</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{coldCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Snowflake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Locations</p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
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
              <CardTitle className="text-base font-semibold">Warehouse Storage Locations Directory</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Browse, monitor, and configure plant warehouse storage locations and temperature conditions
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <Select value={conditionFilter} onValueChange={(val) => { setConditionFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Storage Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Conditions</SelectItem>
                    <SelectItem value="AMBIENT">Ambient (15°C - 25°C)</SelectItem>
                    <SelectItem value="COOL">Cool (8°C - 15°C)</SelectItem>
                    <SelectItem value="COLD_CHAIN">Cold Chain (2°C - 8°C)</SelectItem>
                    <SelectItem value="FROZEN">Deep Frozen (&lt; -20°C)</SelectItem>
                    <SelectItem value="CONTROLLED_ROOM_TEMPERATURE">Controlled Room Temp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select value={storeTypeFilter} onValueChange={(val) => { setStoreTypeFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Linked Store Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Store Types</SelectItem>
                    {STORE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={locations}
            loading={loading}
            searchKey="locationName"
            searchValue={search}
            onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
            searchPlaceholder="Search location code, bay name, warehouse, or capacity..."
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
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormError("");
            setFieldErrors({});
          }
          setFormDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-6xl w-[96vw] max-h-[92vh] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 px-6 py-4 text-white relative shrink-0">
            <div className="absolute right-8 top-2 opacity-10 pointer-events-none">
              <Warehouse className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 shadow-inner">
                  <Warehouse className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    {editingLocation ? "Modify Storage Location" : "Add Storage Location"}
                    {editingLocation && (
                      <span className="text-xs font-mono font-normal bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md">
                        {editingLocation.locationCode}
                      </span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    {editingLocation
                      ? `Update configuration, environmental conditions, and capacity for this bay.`
                      : "Create a new warehouse storage bay, cold chain room, or pallet rack master."}
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2.5">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-xl backdrop-blur-md border ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {isActive ? "● Active Location" : "○ Inactive"}
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
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-destructive text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 2-COLUMN WIDESCREEN LANDSCAPE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* LEFT COLUMN: Store Identity & Bay Details */}
                <div className="space-y-4">
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        1. Store & Location Identity
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Linked Store Type */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Store Department <span className="text-rose-500">*</span>
                        </Label>
                        <Select value={linkedStoreType} onValueChange={handleStoreTypeChange}>
                          <SelectTrigger className={`h-10 text-xs rounded-xl bg-background shadow-xs ${fieldErrors.linkedStoreType ? "border-red-500" : "border-border"}`}>
                            <SelectValue placeholder="Select Store Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {STORE_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.linkedStoreType && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.linkedStoreType}
                          </p>
                        )}
                      </div>

                      {/* Warehouse / Building */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Warehouse / Building <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={warehouse}
                            onChange={(e) => {
                              setWarehouse(e.target.value);
                              if (fieldErrors.warehouse) {
                                setFieldErrors((prev) => ({ ...prev, warehouse: null }));
                              }
                            }}
                            placeholder="e.g. Main Warehouse, Block B"
                            className={`h-10 text-xs pl-9 rounded-xl bg-background ${
                              fieldErrors.warehouse ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                            }`}
                          />
                        </div>
                        {fieldErrors.warehouse && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.warehouse}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Location Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Location / Bay Name <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={locationName}
                            onChange={handleLocationNameChange}
                            placeholder="e.g. Bay A-01 Racks"
                            className={`h-10 text-xs pl-9 rounded-xl bg-background ${
                              fieldErrors.locationName ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                            }`}
                          />
                        </div>
                        {fieldErrors.locationName && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.locationName}
                          </p>
                        )}
                      </div>

                      {/* Location Code */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground">
                            Location Code <span className="text-rose-500">*</span>
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              if (locationName) {
                                setLocationCode(generateStorageLocationCode(linkedStoreType, locationName));
                                setIsCodeManual(false);
                              } else {
                                setIsCodeManual(!isCodeManual);
                              }
                              if (fieldErrors.locationCode) {
                                setFieldErrors((prev) => ({ ...prev, locationCode: null }));
                              }
                            }}
                            className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            {isCodeManual ? "Auto-derive" : "Custom Code"}
                          </button>
                        </div>
                        <Input
                          value={locationCode}
                          onChange={(e) => {
                            setLocationCode(e.target.value.toUpperCase());
                            setIsCodeManual(true);
                            if (fieldErrors.locationCode) {
                              setFieldErrors((prev) => ({ ...prev, locationCode: null }));
                            }
                          }}
                          placeholder="e.g. LOC-RM-BAY-A"
                          className={`h-10 text-xs font-mono font-bold uppercase rounded-xl bg-background tracking-wider ${
                            fieldErrors.locationCode ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                          }`}
                        />
                        {fieldErrors.locationCode && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.locationCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Storage Conditions & Environmental Specs */}
                <div className="space-y-4">
                  <div className="border rounded-2xl p-4 bg-muted/20 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                      <Thermometer className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        2. Environmental & Storage Specs
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Storage Condition */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground">
                            Storage Condition <span className="text-rose-500">*</span>
                          </Label>
                          {storageCondition && STORAGE_CONDITION_CONFIG[storageCondition] && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-1.5 py-0 ${STORAGE_CONDITION_CONFIG[storageCondition].color}`}
                            >
                              {STORAGE_CONDITION_CONFIG[storageCondition].temp}
                            </Badge>
                          )}
                        </div>
                        <Select value={storageCondition} onValueChange={handleConditionChange}>
                          <SelectTrigger className={`h-10 text-xs rounded-xl bg-background shadow-xs ${fieldErrors.storageCondition ? "border-red-500" : "border-border"}`}>
                            <SelectValue placeholder="Select Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMBIENT" className="text-xs">
                              Ambient (15°C - 25°C)
                            </SelectItem>
                            <SelectItem value="COOL" className="text-xs">
                              Cool (8°C - 15°C)
                            </SelectItem>
                            <SelectItem value="COLD_CHAIN" className="text-xs">
                              Cold Chain (2°C - 8°C)
                            </SelectItem>
                            <SelectItem value="FROZEN" className="text-xs">
                              Deep Frozen (&lt; -20°C)
                            </SelectItem>
                            <SelectItem value="CONTROLLED_ROOM_TEMPERATURE" className="text-xs">
                              Controlled Room Temp
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldErrors.storageCondition && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.storageCondition}
                          </p>
                        )}
                      </div>

                      {/* Capacity */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Storage Capacity <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Boxes className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={capacity}
                            onChange={(e) => {
                              setCapacity(e.target.value);
                              if (fieldErrors.capacity) {
                                setFieldErrors((prev) => ({ ...prev, capacity: null }));
                              }
                            }}
                            placeholder="e.g. 500 Pallets"
                            className={`h-10 text-xs pl-9 rounded-xl bg-background ${
                              fieldErrors.capacity ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                            }`}
                          />
                        </div>
                        {fieldErrors.capacity && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.capacity}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Temperature & Humidity Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Temperature Range <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Thermometer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={temperatureRange}
                            onChange={(e) => {
                              setTemperatureRange(e.target.value);
                              if (fieldErrors.temperatureRange) {
                                setFieldErrors((prev) => ({ ...prev, temperatureRange: null }));
                              }
                            }}
                            placeholder="e.g. 15°C - 25°C"
                            className={`h-10 text-xs pl-9 rounded-xl bg-background font-medium ${
                              fieldErrors.temperatureRange ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                            }`}
                          />
                        </div>
                        {fieldErrors.temperatureRange && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.temperatureRange}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">
                          Humidity Limit (RH) <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Droplets className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={humidityRange}
                            onChange={(e) => {
                              setHumidityRange(e.target.value);
                              if (fieldErrors.humidityRange) {
                                setFieldErrors((prev) => ({ ...prev, humidityRange: null }));
                              }
                            }}
                            placeholder="e.g. NMT 60% RH"
                            className={`h-10 text-xs pl-9 rounded-xl bg-background font-medium ${
                              fieldErrors.humidityRange ? "border-red-500 focus-visible:ring-red-500" : "border-border"
                            }`}
                          />
                        </div>
                        {fieldErrors.humidityRange && (
                          <p className="text-red-500 text-xs font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {fieldErrors.humidityRange}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Operational Status Switch */}
                    <div className="p-2.5 px-3.5 rounded-xl bg-background border border-border flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">
                          Operational Status
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Active for gate pass inwarding & dispatch
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                        <span
                          className={`text-xs font-bold ${
                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE SUMMARY CARD */}
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {locationCode || "LOC-XXXX"}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-foreground">
                        {locationName || "Unnamed Location"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {warehouse || "Main Warehouse"} • {capacity || "No capacity set"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {linkedStoreType.replace(/_/g, " ")}
                  </Badge>
                  {storageCondition && STORAGE_CONDITION_CONFIG[storageCondition] && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${STORAGE_CONDITION_CONFIG[storageCondition].color}`}
                    >
                      {storageCondition.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={submitting}
                className="h-10 px-4 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
              >
                {submitting ? (
                  "Saving Location..."
                ) : editingLocation ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Update Location
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Storage Location
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-3xl lg:max-w-4xl w-[94vw] p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card flex flex-col">
          {/* Header Gradient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 px-6 py-4 text-white relative shrink-0">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 shadow-inner">
                  <Warehouse className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    {viewLocation?.locationCode}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300">
                    {viewLocation?.locationName}
                  </DialogDescription>
                </div>
              </div>

              {viewLocation && (
                <Badge
                  variant="outline"
                  className={
                    viewLocation.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs"
                  }
                >
                  {viewLocation.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>

          {viewLocation && (
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Warehouse / Facility
                  </span>
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {viewLocation.warehouse || "Main Warehouse"}
                  </span>
                </div>

                <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Storage Capacity
                  </span>
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    {viewLocation.capacity}
                  </span>
                </div>

                <div className="p-3 bg-muted/30 rounded-2xl border border-border/50 sm:col-span-2">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Linked Store Department
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-semibold text-xs py-1 px-2.5">
                      {viewLocation.linkedStoreType?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Storage Condition
                  </span>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`font-semibold text-xs py-1 px-2.5 ${
                        STORAGE_CONDITION_CONFIG[viewLocation.storageCondition]?.color || ""
                      }`}
                    >
                      {viewLocation.storageCondition?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                  <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block mb-1">
                    Environmental Range
                  </span>
                  <div className="space-y-1 mt-1 text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      {viewLocation.temperatureRange || "15°C - 25°C"}
                    </span>
                    <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-blue-500" />
                      {viewLocation.humidityRange || "NMT 60% RH"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsDialogOpen(false)}
              className="rounded-xl px-4 text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Storage Location"
        description={`Are you sure you want to permanently delete storage location "${locationToDelete?.locationCode}"?`}
        confirmText="Delete Location"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
