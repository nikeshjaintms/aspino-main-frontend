"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Plus,
  Building2,
  Edit,
  Trash2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BankMasterPage() {
  const [banks, setBanks] = useState([]);
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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch Banks from NestJS backend
  const fetchBanks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });
      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
      }
      const res = await fetch(`${API_BASE_URL}/bank?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load bank listing");
      const data = await res.json();
      setBanks(data.data || []);
      setTotalCount(data.total || 0);
      setTotalActive(data.totalActive || 0);
      setTotalInactive(data.totalInactive || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      customToast.error("Could not fetch bank list from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBanks = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: pageSize,
        });
        if (debouncedSearch.trim()) {
          queryParams.append("search", debouncedSearch.trim());
        }
        const res = await fetch(`${API_BASE_URL}/bank?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to load bank listing");
        const data = await res.json();
        setBanks(data.data || []);
        setTotalCount(data.total || 0);
        setTotalActive(data.totalActive || 0);
        setTotalInactive(data.totalInactive || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error(error);
        customToast.error("Could not fetch bank list from server.");
      } finally {
        setLoading(false);
      }
    };
    loadBanks();
  }, [currentPage, pageSize, debouncedSearch]);

  const resetForm = () => {
    setName("");
    setIsActive(true);
    setFormError("");
    setFieldErrors({});
  };

  const handleAddClick = () => {
    setEditingBank(null);
    resetForm();
    setFormDialogOpen(true);
  };

  const handleEditClick = (bank) => {
    setEditingBank(bank);
    setName(bank.name);
    setIsActive(bank.isActive);
    setFormDialogOpen(true);
  };

  const promptDeleteBank = (id) => {
    setBankToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteBank = async () => {
    if (!bankToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bank/${bankToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete bank");
      }
      customToast.success("Bank deleted successfully from master!");
      setDeleteConfirmOpen(false);
      setBankToDelete(null);
      fetchBanks();
    } catch (error) {
      console.error(error);
      customToast.error(error.message || "Error deleting bank. It might be linked to suppliers.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const errors = {};
    if (!name.trim()) {
      errors.name = "Bank Institution Name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Bank Name must be at least 2 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fix the highlighted errors below.");
      customToast.error("Please fill in all required fields correctly.");
      return;
    }

    const payload = {
      name: name.trim(),
      isActive,
    };

    try {
      const url = editingBank ? `${API_BASE_URL}/bank/${editingBank.id}` : `${API_BASE_URL}/bank`;
      const method = editingBank ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Failed to save bank");
        throw new Error(errorMsg);
      }

      customToast.success(editingBank ? "Bank master updated successfully!" : "Bank registered successfully in master!");
      setFormDialogOpen(false);
      resetForm();
      fetchBanks();
    } catch (error) {
      console.error(error);
      customToast.error(error.message);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Bank / Institution Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{row.name}</span>
        </div>
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
            onClick={() => handleEditClick(row)}
            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Edit Bank"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteBank(row.id)}
            className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
            title="Delete Bank"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Master Listing"
        description="Configure corporate clearing institutions for vendor bank disbursements"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Master Records", href: "/admin/suppliers" },
          { label: "Bank Master" },
        ]}
      >
        <Button
          size="sm"
          onClick={handleAddClick}
          className="h-9 text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md font-bold rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Bank Institution
        </Button>
      </PageHeader>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Institutions</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalCount}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Configured clearing houses</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Clearing</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                {totalActive}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Available for vendor linkage</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inactive Clearing</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                {totalInactive}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Suspended from vendor routing</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={banks}
        loading={loading}
        searchPlaceholder="Search banks by name..."
        emptyMessage="No bank master records found"
        emptyDescription="Create a new bank clearing catalog record by clicking Add Bank Institution."
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

      {/* Add / Edit Bank Modal */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Building2 className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {editingBank ? `Modify Bank` : "Register Bank Master"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Configure corporate clearing banks for automated settlements.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="bank-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Institution Name *</Label>
                <Input
                  id="bank-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. HDFC Bank Ltd"
                  className={`text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                    fieldErrors.name
                      ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
                      : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="bank-status-switch" className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Clearing Status</Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Allow vendor settlement link when toggled active</p>
                </div>
                <Switch
                  id="bank-status-switch"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="h-10 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 rounded-xl shadow-md"
              >
                {editingBank ? "Save Changes" : "Register Bank"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Custom Alert Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Bank Institution?"
        description="Are you sure you want to delete this bank from the master database? It may affect existing vendor accounts."
        confirmText="Delete Institution"
        onConfirm={confirmDeleteBank}
        loading={deleteLoading}
      />
    </div>
  );
}
