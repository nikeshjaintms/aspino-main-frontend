"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Edit,
  Trash2,
  Sparkles,
  UserCheck,
  AlertCircle,
  Key,
} from "lucide-react";
import { customToast } from "@/components/custom-toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { fetchUsers, createUser, updateUser, deleteUser, clearError } from "@/redux/slices/usersSlice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
  const dispatch = useDispatch();
  const { users, loading, submitting, error } = useSelector((state) => state.users);

  // Pagination & Search States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");

  // Validation States
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Filter and paginate locally since backend returns all users currently
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalAdmins = users.filter((u) => u.role === "ADMIN").length;

  useEffect(() => {
    if (error) {
      customToast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (formDialogOpen && !editingUser) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setFormError("");
      setFieldErrors({});
    }
  }, [formDialogOpen, editingUser]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setFormError("");
    setFieldErrors({});
  };

  const handleAddClick = () => {
    setEditingUser(null);
    resetForm();
    setFormDialogOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Leave empty unless changing
    setRole(user.role);
    setFormDialogOpen(true);
  };

  const promptDeleteUser = (id) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await dispatch(deleteUser(userToDelete)).unwrap();
      customToast.success("User deleted successfully!");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      customToast.error(err || "Failed to delete user.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = "Valid email is required.";
    if (!editingUser && !password.trim()) errors.password = "Password is required for new users.";
    if (password && password.length < 6) errors.password = "Password must be at least 6 characters.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please fix the highlighted errors below.");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role,
    };
    if (password) payload.password = password;

    try {
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, ...payload })).unwrap();
        customToast.success("User updated successfully!");
      } else {
        await dispatch(createUser(payload)).unwrap();
        customToast.success("User created successfully!");
      }
      setFormDialogOpen(false);
      resetForm();
    } catch (err) {
      customToast.error(err || "Failed to save user.");
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "User Details",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{row.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: (row) => (
        <Badge
          variant="outline"
          className={`font-bold text-[10px] px-2 py-0.5 ${
            row.role === "ADMIN"
              ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50"
              : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          {row.role}
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
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => promptDeleteUser(row.id)}
            className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
            title="Delete User"
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
        title="User Management"
        description="Manage system access, roles, and administrative accounts."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Security & Access", href: "/admin/users" },
          { label: "Users" },
        ]}
      >
        <Button
          size="sm"
          onClick={handleAddClick}
          className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white shadow-lg shadow-sky-600/20 font-bold rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Users</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{users.length}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">All registered system users</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center">
              <Users className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Administrators</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{totalAdmins}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Users with elevated permissions</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={paginatedUsers}
        loading={loading}
        searchPlaceholder="Search users by name or email..."
        emptyMessage="No users found"
        emptyDescription="Create a new user by clicking Add User."
        isServerSide={false}
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

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white relative">
            <div className="absolute right-6 top-6 opacity-10">
              <Users className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {editingUser ? "Modify User Account" : "Register New User"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-1">
                  Manage user profile and access levels.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate autoComplete="off" className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</Label>
                <Input
                  id="user-name"
                  value={name}
                  autoComplete="off"
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. John Doe"
                  className={`text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                    fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                  }`}
                />
                {fieldErrors.name && <p className="text-red-500 text-[11px] font-bold mt-1">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  autoComplete="off"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="john.doe@aspino.com"
                  className={`text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                    fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                  }`}
                />
                {fieldErrors.email && <p className="text-red-500 text-[11px] font-bold mt-1">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {editingUser ? "New Password (Optional)" : "Password *"}
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="user-password"
                    type="password"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                    }}
                    placeholder={editingUser ? "Leave blank to keep unchanged" : "Create strong password"}
                    className={`pl-10 text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${
                      fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 dark:border-slate-700 focus-visible:ring-sky-500"
                    }`}
                  />
                </div>
                {fieldErrors.password && <p className="text-red-500 text-[11px] font-bold mt-1">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-role" className="text-xs font-bold text-slate-700 dark:text-slate-300">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full text-xs h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User (Standard Access)</SelectItem>
                    <SelectItem value="ADMIN">Administrator (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
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
                disabled={submitting}
                className="h-10 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-lg shadow-sky-600/20"
              >
                {submitting ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete User Account?"
        description="Are you sure you want to delete this user? They will lose access to the system immediately."
        confirmText="Delete User"
        onConfirm={confirmDeleteUser}
        loading={submitting}
      />
    </div>
  );
}
