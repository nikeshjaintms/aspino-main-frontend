"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { Switch } from "@/components/ui/switch";
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from "lucide-react";

import { DataTable } from "@/components/data-table";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { generatePassCategoryCode } from "@/lib/code-generator";

export default function PassCategoriesPage() {
  const dispatch = useDispatch();

  // Redux State
  const { categories, totalCount, totalPages, totalInward, totalOutward, loading, submitting, error: reduxError } = useSelector(
    (state) => state.passCategory
  );

  const [activeTab, setActiveTab] = useState("all");

  // Pagination and Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("INWARD");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Validation & Feedback State
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    dispatch(fetchCategories({ search: debouncedSearch, page: currentPage, limit: pageSize, type: activeTab }));
  }, [dispatch, debouncedSearch, currentPage, pageSize, activeTab]);

  // Live name sync
  const handleNameChange = (val) => {
    setName(val);
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
    if (!isCodeManual) {
      const generated = generatePassCategoryCode(val, type);
      setCode(generated);
      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (!isCodeManual && name.trim()) {
      const generated = generatePassCategoryCode(name, newType);
      setCode(generated);
      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFieldErrors({});

    const errors = {};
    if (!name.trim()) {
      errors.name = "Category Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Category Name must be at least 2 characters long.";
    }

    if (!code.trim()) {
      errors.code = "Category Code is required.";
    } else if (!/^[A-Z0-9_]{2,20}$/i.test(code.trim())) {
      errors.code = "Category Code must be 2 to 20 uppercase alphanumeric characters or underscores (e.g. IN_MAT, OUT_SALES).";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fix the validation errors marked in red below.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      description: description.trim(),
      isActive,
    };

    let resultAction;
    if (editingId) {
      resultAction = await dispatch(updateCategory({ id: editingId, catData: payload }));
    } else {
      resultAction = await dispatch(createCategory(payload));
    }

    if (createCategory.fulfilled.match(resultAction) || updateCategory.fulfilled.match(resultAction)) {
      const msg = `Pass Category '${resultAction.payload.name}' ${editingId ? "updated" : "created"} successfully!`;
      setFormSuccess(msg);
      customToast.success(msg);
      dispatch(fetchCategories({ search: debouncedSearch, page: currentPage, limit: pageSize, type: activeTab }));
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1000);
    } else {
      setFormError(resultAction.payload || "Error saving category. Check backend connection.");
      customToast.error(resultAction.payload || "Error saving category. Check backend connection.");
    }
  };

  const promptDeleteCat = (cat) => {
    setCatToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCat = async () => {
    if (!catToDelete) return;
    setDeleteLoading(true);
    const resultAction = await dispatch(deleteCategory(catToDelete.id));
    setDeleteLoading(false);
    if (deleteCategory.fulfilled.match(resultAction)) {
      customToast.success(`Category '${catToDelete.name}' deleted successfully!`);
      setDeleteConfirmOpen(false);
      setCatToDelete(null);
      dispatch(fetchCategories({ search: debouncedSearch, page: currentPage, limit: pageSize, type: activeTab }));
    } else {
      customToast.error(`Failed to delete category '${catToDelete.name}'`);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setCode(cat.code);
    setType(cat.type);
    setDescription(cat.description || "");
    setIsActive(cat.isActive ?? true);
    setIsCodeManual(true);
    setFormError("");
    setFormSuccess("");
    setFieldErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setType("INWARD");
    setDescription("");
    setIsActive(true);
    setIsCodeManual(false);
    setFormError("");
    setFormSuccess("");
    setFieldErrors({});
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          {row.name}
        </span>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-900/50">
          {row.code}
        </Badge>
      ),
    },
    {
      accessorKey: "type",
      header: "Movement Type",
      cell: (row) => (
        <Badge
          variant="secondary"
          className={`font-bold text-[10px] px-2 py-0.5 ${
            row.type === "INWARD"
              ? "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50"
              : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
          }`}
        >
          {row.type}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (row) => (
        <span className="max-w-sm text-slate-600 dark:text-slate-400">
          {row.description || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`font-bold text-[10px] px-2 py-0.5 ${
            row.isActive ?? true
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50"
              : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          {row.isActive ?? true ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteCat(row)}
            className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
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
      onClick={() => dispatch(fetchCategories({ search: debouncedSearch, page: currentPage, limit: pageSize, type: activeTab }))}
      className="h-9 w-9 rounded-xl text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
      title="Refresh"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </Button>
  );

  const inwardCount = totalInward;
  const outwardCount = totalOutward;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Tags className="h-6 w-6" />
            </div>
            Pass Category Master
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Configure dynamic inward & outward movement categories for facility gate passes
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 gap-2 h-11"
        >
          <Plus className="h-4 w-4" />
          Add Pass Category
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Categories</p>
              <h3 className="text-2xl font-black text-purple-900 dark:text-purple-300">{totalCount}</h3>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Active dynamic types
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Tags className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inward Categories</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{inwardCount}</h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Material & Visitors
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outward Categories</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{outwardCount}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Sales & Returnables
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Categories Card & Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Gate Pass Category Master</CardTitle>
            <CardDescription className="text-xs">Filter, search, sort, and manage pass categories</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-transparent">
          <Tabs value={activeTab} onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1);
          }} className="w-full">
            <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-2">
              <TabsList className="bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs font-bold px-4 rounded-lg">
                  All Categories ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="inward" className="text-xs font-bold px-4 rounded-lg">
                  Inward Categories ({inwardCount})
                </TabsTrigger>
                <TabsTrigger value="outward" className="text-xs font-bold px-4 rounded-lg">
                  Outward Categories ({outwardCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="all" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={categories}
                  loading={loading}
                  searchPlaceholder="Search all pass categories..."
                  emptyMessage="No Categories Found"
                  emptyDescription="Click 'Add Pass Category' to define new gate movement types."
                  actions={tableActions}
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
              </TabsContent>
              <TabsContent value="inward" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={categories}
                  loading={loading}
                  searchPlaceholder="Search Inward categories..."
                  emptyMessage="No Inward Categories Found"
                  emptyDescription="Click 'Add Pass Category' to define new inward movement types."
                  actions={tableActions}
                  isServerSide={true}
                  totalCount={totalInward}
                  totalPages={Math.ceil(totalInward / pageSize) || 1}
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
              </TabsContent>
              <TabsContent value="outward" className="m-0 focus-visible:outline-none">
                <DataTable
                  columns={columns}
                  data={categories}
                  loading={loading}
                  searchPlaceholder="Search Outward categories..."
                  emptyMessage="No Outward Categories Found"
                  emptyDescription="Click 'Add Pass Category' to define new outward movement types."
                  actions={tableActions}
                  isServerSide={true}
                  totalCount={totalOutward}
                  totalPages={Math.ceil(totalOutward / pageSize) || 1}
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
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl flex items-center gap-2">
                  <Tags className="h-6 w-6 text-purple-600 dark:text-purple-450" />
                  {editingId ? "Edit Pass Category" : "Add Pass Category"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure custom categories with strict validation rules</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

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

            <form onSubmit={handleSave} noValidate className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name *</Label>
                <Input
                  placeholder="e.g. Courier / Sample Dispatch"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 ${
                    fieldErrors.name ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-medium" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Code *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = generatePassCategoryCode(name, type);
                        if (auto) {
                          setCode(auto);
                          setIsCodeManual(false);
                          if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
                        }
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title="Auto-derive code from name"
                    >
                      <Sparkles className="h-3 w-3" />
                      Auto-derive
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. OUT_SAMPLE, IN_MAT"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setIsCodeManual(true);
                      if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: null }));
                    }}
                    className={`h-10 text-xs font-mono uppercase rounded-xl bg-transparent text-slate-900 dark:text-slate-100 ${
                      fieldErrors.code ? "border-red-500 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-medium" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                  {fieldErrors.code && (
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.code}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Movement Type *</Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Select Movement Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INWARD">INWARD</SelectItem>
                      <SelectItem value="OUTWARD">OUTWARD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</Label>
                <Input
                  placeholder="Details about this pass category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-transparent text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                />
              </div>

              {/* Status Switch Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5">
                  <Label htmlFor="category-status-switch" className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Status</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Allow this category to be selected for gate passes when active</p>
                </div>
                <Switch
                  id="category-status-switch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

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
                  disabled={submitting}
                  className="h-10 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20"
                >
                  {submitting ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Custom Alert Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Pass Category?"
        description={catToDelete ? `Are you sure you want to delete category '${catToDelete.name}'? Passes created with this category might be affected.` : "Are you sure you want to delete this category?"}
        confirmText="Delete Category"
        onConfirm={confirmDeleteCat}
        loading={deleteLoading}
      />
    </div>
  );
}
