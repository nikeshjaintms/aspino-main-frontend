"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePermissions, RouteGuard } from "@/context/PermissionContext";
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Check,
  X,
  Users,
  KeyRound,
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { toast } from "sonner";

export default function RolesManagementPage() {
  return (
    <RouteGuard subject="roles" action="read">
      <RolesManagerContent />
    </RouteGuard>
  );
}

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

/**
 * Parses normal permission strings (e.g. "create-user", "update-user", "read-visitor")
 * into backend-compatible { name, action, module, application, description }
 */
function parsePermissionCode(rawCode) {
  const code = (rawCode || "").trim().toLowerCase();
  let action = "read";
  let module = "general";

  if (code.includes("-")) {
    const parts = code.split("-");
    action = parts[0];
    module = parts.slice(1).join("-");
  } else if (code.includes(":")) {
    const parts = code.split(":");
    action = parts[0];
    module = parts.slice(1).join(":");
  } else if (code.includes("_")) {
    const parts = code.split("_");
    action = parts[0];
    module = parts.slice(1).join("_");
  } else if (code.includes(" ")) {
    const parts = code.split(" ");
    action = parts[0];
    module = parts.slice(1).join(" ");
  } else {
    module = code;
    action = "manage";
  }

  return {
    name: code,
    action: action || "read",
    module: module || "general",
    application: "GLOBAL",
    description: "",
  };
}

export function RolesManagerContent() {
  const { can, refreshPermissions } = usePermissions();
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' | 'roles' | 'permissions'
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Role Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState("create"); // 'create' | 'edit'
  const [roleNameInput, setRoleNameInput] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");

  // Permission Modal State
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMode, setPermModalMode] = useState("create"); // 'create' | 'edit'
  const [permInputCodes, setPermInputCodes] = useState("");
  const [editingPermId, setEditingPermId] = useState(null);
  const [permModalLoading, setPermModalLoading] = useState(false);
  const [permFormError, setPermFormError] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Fetch initial roles & permissions
  const fetchData = async (targetRoleId = null) => {
    try {
      setLoading(true);
      const token = getCookie("adminToken") || getCookie("userToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${backendUrl}/roles`, { headers }),
        fetch(`${backendUrl}/permissions`, { headers }),
      ]);

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error("Failed to load roles and permissions from backend");
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      const rolesList = Array.isArray(rolesData) ? rolesData : [];
      const permsList = Array.isArray(permsData)
        ? permsData
        : Array.isArray(permsData?.permissions)
        ? permsData.permissions
        : [];

      setRoles(rolesList);
      setAllPermissions(permsList);

      if (rolesList.length > 0) {
        const roleToSelect = targetRoleId
          ? rolesList.find((r) => r.id === targetRoleId)
          : selectedRoleId
          ? rolesList.find((r) => r.id === selectedRoleId)
          : rolesList[0];

        const activeRole = roleToSelect || rolesList[0];
        setSelectedRoleId(activeRole.id);
        setSelectedPermissionIds(new Set(getRolePermissionIds(activeRole)));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load roles data");
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissionIds = (role) => {
    if (!role) return [];
    if (Array.isArray(role.permissionIds)) return role.permissionIds;
    if (Array.isArray(role.rolePermissions)) {
      return role.rolePermissions.map((rp) => rp.permissionId || rp.id || rp);
    }
    if (Array.isArray(role.permissions)) {
      return role.permissions.map((p) => p.id || p);
    }
    return [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRole = useMemo(() => {
    const list = Array.isArray(roles) ? roles : [];
    return list.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const handleSelectRole = (role) => {
    setSelectedRoleId(role.id);
    const permIds = new Set(getRolePermissionIds(role));
    setSelectedPermissionIds(permIds);
  };

  // Group permissions directly by subject (e.g. user, gatepass, visitor, role)
  const groupedPermissions = useMemo(() => {
    const groups = {};
    const list = Array.isArray(allPermissions) ? allPermissions : [];

    list.forEach((perm) => {
      let subject = perm.module;
      if (!subject && perm.name) {
        const parsed = parsePermissionCode(perm.name);
        subject = parsed.module;
      }
      let key = (subject || "General").toLowerCase().trim();
      if (key === "banks") key = "bank";
      if (key === "suppliers") key = "supplier";
      if (key === "customers") key = "customer";
      if (key === "vendors") key = "vendor";
      if (key === "storage_locations") key = "storage_location";
      if (key === "products") key = "product";
      if (key === "product_categories") key = "product_category";
      if (key === "product_sub_categories") key = "product_sub_category";
      if (key === "uoms") key = "uom";
      if (key === "packing_materials") key = "packing_material";
      if (key === "qc_specifications") key = "qc_specification";
      if (key === "pass_categories") key = "pass_category";
      if (key === "departments") key = "department";
      if (key === "users") key = "user";
      if (key === "roles") key = "role";
      if (key === "vouchers") key = "voucher";
      if (key === "accounts") key = "account";
      if (key === "audit") key = "activity_logs";

      if (!groups[key]) {
        groups[key] = [];
      }

      // Check if permission with same name already exists in this group
      const existing = groups[key].find(
        (p) => (p.name || "").toLowerCase().trim() === (perm.name || "").toLowerCase().trim()
      );

      if (existing) {
        if (!existing.allIds) existing.allIds = [existing.id];
        if (!existing.allIds.includes(perm.id)) existing.allIds.push(perm.id);
      } else {
        groups[key].push({
          ...perm,
          allIds: [perm.id],
        });
      }
    });

    // Sort permissions inside each group: sidebar -> create -> read -> update -> delete -> others
    const actionOrder = { sidebar: 1, create: 2, read: 3, update: 4, edit: 4, delete: 5, approve: 6, export: 7 };
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => {
        const aAct = (a.action || "").toLowerCase();
        const bAct = (b.action || "").toLowerCase();
        const orderA = a.name?.startsWith("sidebar-") ? 1 : actionOrder[aAct] || 50;
        const orderB = b.name?.startsWith("sidebar-") ? 1 : actionOrder[bAct] || 50;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
    });

    return groups;
  }, [allPermissions]);

  // Toggle single permission chip
  const togglePermission = (perm) => {
    if (!can("update", "roles")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    const ids = perm?.allIds || (perm?.id ? [perm.id] : []);
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const isAnyChecked = ids.some((id) => next.has(id));
      if (isAnyChecked) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Toggle entire subject group
  const toggleSubjectGroup = (groupPermissions) => {
    if (!can("update", "roles")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    const allSelected = groupPermissions.every((p) =>
      (p.allIds || [p.id]).some((id) => selectedPermissionIds.has(id))
    );

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupPermissions.forEach((p) => {
          (p.allIds || [p.id]).forEach((id) => next.delete(id));
        });
      } else {
        groupPermissions.forEach((p) => {
          (p.allIds || [p.id]).forEach((id) => next.add(id));
        });
      }
      return next;
    });
  };

  // Quick preset templates
  const handleApplyPreset = (presetType) => {
    if (!can("update", "roles")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    const list = Array.isArray(allPermissions) ? allPermissions : [];
    if (presetType === "READ_ONLY") {
      const readIds = new Set(
        list
          .filter(
            (p) =>
              ["read", "export", "view", "sidebar"].includes((p.action || "").toLowerCase()) ||
              p.name?.startsWith("read-") ||
              p.name?.startsWith("sidebar-")
          )
          .map((p) => p.id)
      );
      setSelectedPermissionIds(readIds);
      toast.success(`Applied Read-Only preset (${readIds.size} active rules)`);
    } else if (presetType === "CRUD") {
      const crudIds = new Set(
        list
          .filter(
            (p) =>
              ["read", "create", "update", "delete", "sidebar"].includes((p.action || "").toLowerCase()) ||
              p.name?.startsWith("read-") ||
              p.name?.startsWith("create-") ||
              p.name?.startsWith("update-") ||
              p.name?.startsWith("delete-") ||
              p.name?.startsWith("sidebar-")
          )
          .map((p) => p.id)
      );
      setSelectedPermissionIds(crudIds);
      toast.success(`Applied Standard CRUD preset (${crudIds.size} active rules)`);
    } else if (presetType === "FULL") {
      const allIds = new Set(list.map((p) => p.id));
      setSelectedPermissionIds(allIds);
      toast.success(`Applied Full Access preset (${allIds.size} active rules)`);
    } else if (presetType === "CLEAR") {
      setSelectedPermissionIds(new Set());
      toast.info("Cleared all permission selections");
    }
  };

  // Subject Level Quick Actions
  const handleSubjectQuickAction = (subjectPermissions, actionType) => {
    if (!can("update", "roles")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (actionType === "ALL") {
        subjectPermissions.forEach((p) => {
          (p.allIds || [p.id]).forEach((id) => next.add(id));
        });
      } else if (actionType === "CLEAR") {
        subjectPermissions.forEach((p) => {
          (p.allIds || [p.id]).forEach((id) => next.delete(id));
        });
      } else if (actionType === "READ") {
        subjectPermissions.forEach((p) => {
          const ids = p.allIds || [p.id];
          if (
            ["read", "export", "view", "sidebar"].includes((p.action || "").toLowerCase()) ||
            p.name?.startsWith("read-") ||
            p.name?.startsWith("sidebar-")
          ) {
            ids.forEach((id) => next.add(id));
          } else {
            ids.forEach((id) => next.delete(id));
          }
        });
      } else if (actionType === "CRUD") {
        subjectPermissions.forEach((p) => {
          const ids = p.allIds || [p.id];
          if (
            ["read", "create", "update", "delete", "sidebar"].includes((p.action || "").toLowerCase()) ||
            p.name?.startsWith("read-") ||
            p.name?.startsWith("create-") ||
            p.name?.startsWith("update-") ||
            p.name?.startsWith("delete-") ||
            p.name?.startsWith("sidebar-")
          ) {
            ids.forEach((id) => next.add(id));
          } else {
            ids.forEach((id) => next.delete(id));
          }
        });
      }
      return next;
    });
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    if (!can("update", "roles")) {
      toast.error("You do not have permission to update role permissions.");
      return;
    }

    try {
      setSaving(true);
      const token = getCookie("adminToken") || getCookie("userToken");
      const res = await fetch(
        `${backendUrl}/roles/${selectedRoleId}/permissions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissionIds),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update permissions");
      }

      toast.success("Role permissions updated successfully!");
      await fetchData(selectedRoleId);
      await refreshPermissions();
    } catch (err) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Create / Edit Role
  const handleOpenRoleModal = (mode, role = null) => {
    setRoleModalMode(mode);
    setRoleFormError("");
    if (mode === "edit" && role) {
      setEditingRoleId(role.id);
      setRoleNameInput(role.displayName || role.name || "");
    } else {
      setEditingRoleId(null);
      setRoleNameInput("");
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setRoleFormError("");
    const trimmed = roleNameInput.trim();
    if (!trimmed) {
      setRoleFormError("Role name is required.");
      return;
    }

    try {
      setRoleModalLoading(true);
      const token = getCookie("adminToken") || getCookie("userToken");
      const url =
        roleModalMode === "create"
          ? `${backendUrl}/roles`
          : `${backendUrl}/roles/${editingRoleId}`;
      const method = roleModalMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmed.toUpperCase().replace(/\s+/g, "_"),
          displayName: trimmed,
          description: "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save role");
      }

      const savedRole = await res.json();
      toast.success(
        roleModalMode === "create" ? "Role created successfully!" : "Role updated successfully!"
      );
      setShowRoleModal(false);
      await fetchData(savedRole?.id || selectedRoleId);
    } catch (err) {
      setRoleFormError(err.message || "Failed to save role");
    } finally {
      setRoleModalLoading(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      toast.error("System roles cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete role '${role.name}'?`)) {
      return;
    }

    try {
      const token = getCookie("adminToken") || getCookie("userToken");
      const res = await fetch(`${backendUrl}/roles/${role.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete role");
      }

      toast.success("Role deleted successfully");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  // Direct Permission Handlers
  const handleOpenPermModal = (mode, perm = null) => {
    setPermModalMode(mode);
    setPermFormError("");
    if (mode === "edit" && perm) {
      setEditingPermId(perm.id);
      setPermInputCodes(perm.name || "");
    } else {
      setEditingPermId(null);
      setPermInputCodes("");
    }
    setShowPermModal(true);
  };

  const handleSavePerm = async (e) => {
    e.preventDefault();
    setPermFormError("");

    const trimmed = permInputCodes.trim();
    if (!trimmed) {
      setPermFormError("Please enter a permission name (e.g. create-user).");
      return;
    }

    try {
      setPermModalLoading(true);
      const token = getCookie("adminToken") || getCookie("userToken");

      // Edit single permission
      if (permModalMode === "edit" && editingPermId) {
        const parsed = parsePermissionCode(trimmed);
        const res = await fetch(`${backendUrl}/permissions/${editingPermId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: parsed.name,
            action: parsed.action,
            module: parsed.module,
            application: parsed.application,
            description: "",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update permission");
        }

        toast.success("Permission updated successfully!");
        setShowPermModal(false);
        await fetchData(selectedRoleId);
        return;
      }

      // Create one or multiple permissions (comma/space/newline separated)
      const codes = trimmed
        .split(/[,\n]+/)
        .map((c) => c.trim())
        .filter(Boolean);

      if (codes.length === 0) {
        setPermFormError("Please provide a valid permission name.");
        return;
      }

      let successCount = 0;
      const errors = [];

      for (const rawCode of codes) {
        const parsed = parsePermissionCode(rawCode);
        const res = await fetch(`${backendUrl}/permissions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: parsed.name,
            action: parsed.action,
            module: parsed.module,
            application: parsed.application,
            description: "",
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const data = await res.json().catch(() => ({}));
          errors.push(`${parsed.name}: ${data.message || "Failed"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} permission${successCount > 1 ? "s" : ""}!`);
        setShowPermModal(false);
        await fetchData(selectedRoleId);
      } else {
        setPermFormError(errors.join("; ") || "Failed to create permissions.");
      }
    } catch (err) {
      setPermFormError(err.message || "Failed to save permission");
    } finally {
      setPermModalLoading(false);
    }
  };

  const handleDeletePerm = async (perm) => {
    if (!confirm(`Are you sure you want to delete permission '${perm.name}'?`)) {
      return;
    }

    try {
      const token = getCookie("adminToken") || getCookie("userToken");
      const res = await fetch(`${backendUrl}/permissions/${perm.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete permission");
      }

      toast.success("Permission deleted successfully");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete permission");
    }
  };

  // Color helper for actions in permission cards
  const getActionColorStyle = (action, isChecked) => {
    const act = (action || "").toLowerCase();
    if (!isChecked) {
      return "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50";
    }
    switch (act) {
      case "read":
        return "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-xs font-bold ring-1 ring-sky-500/20";
      case "create":
        return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold ring-1 ring-emerald-500/20";
      case "update":
      case "edit":
        return "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-xs font-bold ring-1 ring-amber-500/20";
      case "delete":
        return "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs font-bold ring-1 ring-rose-500/20";
      case "approve":
        return "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold ring-1 ring-indigo-500/20";
      default:
        return "border-aspino-primary bg-aspino-primary/10 text-aspino-primary shadow-xs font-bold ring-1 ring-aspino-primary/20";
    }
  };

  const getCheckboxStyle = (action, isChecked) => {
    if (!isChecked) {
      return "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent";
    }
    const act = (action || "").toLowerCase();
    switch (act) {
      case "read":
        return "bg-sky-600 text-white border border-sky-600 shadow-xs";
      case "create":
        return "bg-emerald-600 text-white border border-emerald-600 shadow-xs";
      case "update":
      case "edit":
        return "bg-amber-600 text-white border border-amber-600 shadow-xs";
      case "delete":
        return "bg-rose-600 text-white border border-rose-600 shadow-xs";
      case "approve":
        return "bg-indigo-600 text-white border border-indigo-600 shadow-xs";
      default:
        return "bg-aspino-primary text-white border border-aspino-primary shadow-xs";
    }
  };

  const rolesColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Role Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aspino-primary/20 to-sky-500/20 text-aspino-primary border border-aspino-primary/20 font-bold shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{row.displayName || row.name}</span>
                {row.isSystem ? (
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[10px] font-bold text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 px-1.5 py-0">
                    SYSTEM
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 text-[10px] font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-1.5 py-0">
                    CUSTOM
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{row.name}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Assigned Users",
        cell: ({ row }) => {
          const count = row.userCount ?? (Array.isArray(row.users) ? row.users.length : 0);
          return (
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Users className="h-3.5 w-3.5" />
              </div>
              <span>{count} user{count === 1 ? "" : "s"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "permissionCount",
        header: "Active Rules",
        cell: ({ row }) => {
          const count = typeof row.permissionCount === "number" ? row.permissionCount : getRolePermissionIds(row).length;
          const total = allPermissions.length || 1;
          const pct = Math.round((count / total) * 100);

          return (
            <div className="space-y-1.5 min-w-[120px]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300">{count} / {total}</span>
                <span className="font-semibold text-aspino-primary text-[10px]">{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-aspino-primary to-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSelectRole(row);
                setActiveTab("matrix");
              }}
              className="h-7 text-[11px] px-2.5 gap-1.5 border-slate-200 dark:border-slate-700 hover:border-aspino-primary text-slate-700 dark:text-slate-200 hover:text-aspino-primary font-medium cursor-pointer"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Matrix
            </Button>
            {can("update", "roles") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenRoleModal("edit", row)}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                title="Edit Role"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}
            {!row.isSystem && can("delete", "roles") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRole(row)}
                className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                title="Delete Custom Role"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [allPermissions.length, can]
  );

  const permissionsColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Permission Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {row.name}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "module",
        header: "Target Entity",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
            {row.module || "General"}
          </Badge>
        ),
      },
      {
        accessorKey: "action",
        header: "Action Type",
        cell: ({ row }) => {
          const act = (row.action || "read").toLowerCase();
          const badgeStyle =
            act === "manage" || act === "delete"
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              : act === "create" || act === "approve"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : act === "update" || act === "edit"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800";
          return (
            <Badge className={`${badgeStyle} text-[10px] uppercase font-bold`}>
              {act}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {can("update", "permissions") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenPermModal("edit", row)}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Edit Permission"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}
            {can("delete", "permissions") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePerm(row)}
                className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                title="Delete Permission"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [can]
  );

  const filteredSubjectGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = {};

    Object.entries(groupedPermissions).forEach(([subject, perms]) => {
      const matchingPerms = !q
        ? perms
        : perms.filter(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.action?.toLowerCase().includes(q) ||
              p.module?.toLowerCase().includes(q) ||
              subject.includes(q)
          );

      if (matchingPerms.length > 0) {
        result[subject] = matchingPerms;
      }
    });

    return result;
  }, [groupedPermissions, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-aspino-primary border-t-transparent shadow-md"></div>
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Initializing Access Control Matrix...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-md shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aspino-primary to-sky-600 text-white shadow-md shadow-aspino-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Roles & Permissions
                </h1>
                <Badge className="bg-aspino-primary/10 text-aspino-primary border-aspino-primary/20 text-[10px] font-extrabold uppercase">
                  CASL Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Configure roles and map permissions (e.g. <code className="font-mono text-aspino-primary font-bold">create-user</code>, <code className="font-mono text-aspino-primary font-bold">update-user</code>, <code className="font-mono text-aspino-primary font-bold">read-gatepass</code>).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Tab Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
              <button
                onClick={() => setActiveTab("matrix")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "matrix"
                    ? "bg-white dark:bg-slate-900 text-aspino-primary shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Role Matrix
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "roles"
                    ? "bg-white dark:bg-slate-900 text-aspino-primary shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Roles ({roles.length})
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "permissions"
                    ? "bg-white dark:bg-slate-900 text-aspino-primary shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Permissions ({allPermissions.length})
              </button>
            </div>

            {/* Action Buttons */}
            {can("create", "roles") && (
              <Button
                onClick={() => handleOpenRoleModal("create")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                New Role
              </Button>
            )}
            {can("create", "permissions") && (
              <Button
                onClick={() => handleOpenPermModal("create")}
                className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-md shadow-sky-600/20 gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                New Permission
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "matrix" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Role Selector Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-aspino-primary" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Security Roles
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {roles.length} Roles
                </Badge>
              </div>

              {/* Role Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter role list..."
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Role Cards List */}
              <div className="mt-3 space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {roles
                  .filter((r) =>
                    roleSearchQuery
                      ? r.name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                        r.displayName?.toLowerCase().includes(roleSearchQuery.toLowerCase())
                      : true
                  )
                  .map((role) => {
                    const isSelected = role.id === selectedRoleId;
                    const permCount = getRolePermissionIds(role).length;

                    return (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                          isSelected
                            ? "border-aspino-primary bg-aspino-primary/10 dark:bg-aspino-primary/20 shadow-xs ring-1 ring-aspino-primary/40 text-aspino-primary"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                              isSelected
                                ? "bg-aspino-primary text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {role.displayName || role.name}
                              </span>
                              {role.isSystem && (
                                <span className="text-[9px] font-bold px-1 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                  SYS
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {role.name}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <Badge
                            variant={isSelected ? "default" : "secondary"}
                            className="text-[10px] font-bold"
                          >
                            {permCount} rules
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Direct Permission Matrix Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs backdrop-blur-md space-y-5">
              {/* Active Role Control Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Configuring:</span>
                    <h2 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {selectedRole ? (selectedRole.displayName || selectedRole.name) : "Select a Role"}
                    </h2>
                    {selectedRole?.isSystem && (
                      <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 text-[10px] font-bold">
                        SYSTEM ROLE
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSavePermissions}
                    disabled={saving || !selectedRoleId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-emerald-600/20 gap-1.5 cursor-pointer"
                  >
                    {saving ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Matrix
                  </Button>
                </div>
              </div>

              {/* Quick Presets & Search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset("READ_ONLY")}
                    className="h-7 text-[11px] px-2.5 rounded-lg border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold cursor-pointer"
                  >
                    Read-Only
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset("CRUD")}
                    className="h-7 text-[11px] px-2.5 rounded-lg border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer"
                  >
                    Standard CRUD
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset("FULL")}
                    className="h-7 text-[11px] px-2.5 rounded-lg border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/70 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold cursor-pointer"
                  >
                    Full Access
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPreset("CLEAR")}
                    className="h-7 text-[11px] px-2 rounded-lg text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search e.g. create-user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Direct Grouped Permission Subject Cards */}
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {Object.keys(filteredSubjectGroups).length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      No permissions match "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  Object.entries(filteredSubjectGroups).map(([subject, perms]) => {
                    const allSelected = perms.every((p) => (p.allIds || [p.id]).some((id) => selectedPermissionIds.has(id)));
                    const selectedCount = perms.filter((p) => (p.allIds || [p.id]).some((id) => selectedPermissionIds.has(id))).length;

                    return (
                      <div
                        key={subject}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-3 shadow-xs"
                      >
                        {/* Subject Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-aspino-primary" />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                              {subject}
                            </span>
                            <Badge className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {selectedCount} / {perms.length} active
                            </Badge>
                          </div>

                          {/* Quick Action Buttons for this group */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSubjectQuickAction(perms, "READ")}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 cursor-pointer"
                              title="Enable only Read actions for this entity"
                            >
                              Read
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubjectQuickAction(perms, "CRUD")}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                              title="Enable standard CRUD for this entity"
                            >
                              CRUD
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSubjectGroup(perms)}
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                allSelected
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900"
                                  : "bg-aspino-primary/10 text-aspino-primary border-aspino-primary/20 hover:bg-aspino-primary/20"
                              }`}
                            >
                              {allSelected ? "Clear" : "Select All"}
                            </button>
                          </div>
                        </div>

                        {/* Direct Permission Chips */}
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => {
                            const checked = (perm.allIds || [perm.id]).some((id) => selectedPermissionIds.has(id));
                            const colorStyle = getActionColorStyle(perm.action, checked);

                            return (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm)}
                                className={`group relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all duration-150 cursor-pointer ${colorStyle}`}
                              >
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition-all ${getCheckboxStyle(
                                    perm.action,
                                    checked
                                  )}`}
                                >
                                  {checked && (
                                    <Check className="h-3 w-3 stroke-[3.5] text-white" />
                                  )}
                                </div>
                                <span className="font-mono text-[11px] font-bold">{perm.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "roles" ? (
        /* Roles Registry DataTable View */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
              System Roles
            </h3>
            <p className="text-xs text-slate-500">
              Browse and manage configured system and custom user roles.
            </p>
          </div>

          <DataTable
            columns={rolesColumns}
            data={roles}
            searchable={true}
            searchPlaceholder="Search roles..."
            pageSize={10}
            emptyMessage="No roles found"
            emptyDescription="There are no configured roles matching your search."
          />
        </div>
      ) : (
        /* All Permissions DataTable View & CRUD with Pagination */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
              Permissions Directory
            </h3>
            <p className="text-xs text-slate-500">
              Direct permission rules registered across the system.
            </p>
          </div>

          <DataTable
            columns={permissionsColumns}
            data={allPermissions}
            searchable={true}
            searchPlaceholder="Search permission codes like create-user, read-gatepass..."
            pageSize={10}
            emptyMessage="No permissions found"
            emptyDescription="No permission rules match your search query."
          />
        </div>
      )}

      {/* Clean Role Dialog (Only Role Name) */}
      <Dialog
        open={showRoleModal}
        onOpenChange={(open) => {
          if (!open) {
            setRoleFormError("");
          }
          setShowRoleModal(open);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <Shield className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {roleModalMode === "create" ? "Add New Role" : "Edit Role"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  Enter role name to register access profile.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveRole}
            noValidate
            className="p-6 space-y-4 bg-card"
          >
            {roleFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{roleFormError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="role-name-input" className="text-xs font-bold text-foreground">
                Role Name *
              </Label>
              <Input
                id="role-name-input"
                placeholder="e.g. Supervisor, Manager, Security Officer"
                value={roleNameInput}
                onChange={(e) => setRoleNameInput(e.target.value)}
                required
                className="text-xs h-10 rounded-xl bg-muted/50 border-border focus-visible:ring-sky-500"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRoleModal(false)}
                className="h-9 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={roleModalLoading}
                className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-md cursor-pointer"
              >
                {roleModalLoading
                  ? "Saving..."
                  : roleModalMode === "create"
                  ? "Create Role"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clean Permission Dialog (Only Permission Name) */}
      <Dialog
        open={showPermModal}
        onOpenChange={(open) => {
          if (!open) {
            setPermFormError("");
          }
          setShowPermModal(open);
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <KeyRound className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {permModalMode === "create" ? "Add Permission" : "Edit Permission"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  Enter permission code (e.g. <span className="font-mono text-sky-300">create-user</span>, <span className="font-mono text-sky-300">update-user</span>).
                </DialogDescription>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSavePerm}
            noValidate
            className="p-6 space-y-4 bg-card"
          >
            {permFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{permFormError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="perm-code" className="text-xs font-bold text-foreground">
                Permission Name *
              </Label>
              <Input
                id="perm-code"
                placeholder="e.g. create-user, update-user, delete-user"
                value={permInputCodes}
                onChange={(e) => setPermInputCodes(e.target.value)}
                required
                className="text-xs h-10 rounded-xl bg-muted/50 border-border font-mono font-bold focus-visible:ring-sky-500"
              />
              {permModalMode === "create" && (
                <p className="text-[11px] text-muted-foreground">
                  You can enter multiple comma-separated permissions at once.
                </p>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border/50 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPermModal(false)}
                className="h-9 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={permModalLoading}
                className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-md cursor-pointer"
              >
                {permModalLoading
                  ? "Saving..."
                  : permModalMode === "create"
                  ? "Save Permission"
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
