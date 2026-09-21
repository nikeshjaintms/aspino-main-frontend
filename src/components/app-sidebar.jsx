"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AspinoLogo, AspinoIcon } from "@/components/aspino-logo";
import { usePermissions } from "@/context/PermissionContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Pill,
  Truck,
  Package,
  BarChart3,
  Settings,
  Users,
  FileText,
  ShieldCheck,
  Building2,
  ClipboardList,
  Activity,
  Tags,
  FolderTree,
  Layers,
  Boxes,
  Scale,
  Handshake,
  ClipboardCheck,
  Warehouse,
  Landmark,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Coins,
  KeyRound,
} from "lucide-react";

const adminMenuItems = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        sidebarPermission: "sidebar-dashboard",
      },
    ],
  },
  {
    group: "Security & Access",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        subject: "users",
        action: "read",
        sidebarPermission: "sidebar-users",
      },
      {
        title: "Roles & Permissions",
        href: "/admin/roles",
        icon: KeyRound,
        subject: "roles",
        action: "read",
        sidebarPermission: "sidebar-roles",
      },
    ],
  },
  {
    group: "Finance & Accounts",
    items: [
      {
        title: "Chart of Accounts",
        href: "/admin/accounts",
        icon: Landmark,
        subject: "bank",
        action: "read",
        sidebarPermission: "sidebar-accounts",
      },
      {
        title: "Voucher Engine",
        href: "/admin/vouchers",
        icon: Receipt,
        subject: "bank",
        action: "read",
        sidebarPermission: "sidebar-vouchers",
      },
      {
        title: "Customer Ledger (AR)",
        href: "/admin/customer-ledger",
        icon: CreditCard,
        subject: "customer",
        action: "read",
        sidebarPermission: "sidebar-customer-ledger",
      },
      {
        title: "Supplier Ledger (AP)",
        href: "/admin/supplier-ledger",
        icon: Coins,
        subject: "supplier",
        action: "read",
        sidebarPermission: "sidebar-supplier-ledger",
      },
      {
        title: "Financial Statements",
        href: "/admin/financial-reports",
        icon: BarChart3,
        subject: "bank",
        action: "read",
        sidebarPermission: "sidebar-financial-reports",
      },
    ],
  },
  {
    group: "Masters",
    items: [
      {
        title: "Product Categories",
        href: "/admin/product-categories",
        icon: FolderTree,
        subject: "product_category",
        action: "read",
        sidebarPermission: "sidebar-product-categories",
      },
      {
        title: "Product Sub-Categories",
        href: "/admin/product-sub-categories",
        icon: Layers,
        subject: "product_sub_category",
        action: "read",
        sidebarPermission: "sidebar-product-sub-categories",
      },
      {
        title: "UOM Master",
        href: "/admin/uoms",
        icon: Scale,
        subject: "uom",
        action: "read",
        sidebarPermission: "sidebar-uoms",
      },
      {
        title: "Product Master",
        href: "/admin/products",
        icon: Package,
        subject: "product",
        action: "read",
        sidebarPermission: "sidebar-products",
      },
      {
        title: "Packing Materials",
        href: "/admin/packing-materials",
        icon: Boxes,
        subject: "packing_material",
        action: "read",
        sidebarPermission: "sidebar-packing-materials",
      },
      {
        title: "QC Specifications",
        href: "/admin/qc-specifications",
        icon: ClipboardCheck,
        subject: "qc_specification",
        action: "read",
        sidebarPermission: "sidebar-qc-specifications",
      },
      {
        title: "Storage Locations",
        href: "/admin/storage-locations",
        icon: Warehouse,
        subject: "storage_location",
        action: "read",
        sidebarPermission: "sidebar-storage-locations",
      },
      {
        title: "Pass Categories",
        href: "/admin/pass-categories",
        icon: Tags,
        subject: "pass_category",
        action: "read",
        sidebarPermission: "sidebar-pass-categories",
      },
      {
        title: "Bank Master",
        href: "/admin/banks",
        icon: Building2,
        subject: "bank",
        action: "read",
        sidebarPermission: "sidebar-banks",
      },
      {
        title: "Vendor",
        href: "/admin/vendors",
        icon: Handshake,
        subject: "vendor",
        action: "read",
        sidebarPermission: "sidebar-vendors",
      },
      {
        title: "Customer Master",
        href: "/admin/customers",
        icon: Users,
        subject: "customer",
        action: "read",
        sidebarPermission: "sidebar-customers",
      },
    ],
  },
  {
    group: "Modules",
    items: [
      {
        title: "Suppliers",
        href: "/admin/suppliers",
        icon: Truck,
        subject: "supplier",
        action: "read",
        sidebarPermission: "sidebar-suppliers",
      },
      {
        title: "Gate Pass",
        href: "/admin/gate-pass",
        icon: ClipboardList,
        subject: "gatepass",
        action: "read",
        sidebarPermission: "sidebar-gatepass",
      },
      {
        title: "Activity Logs",
        href: "/admin/activity-logs",
        icon: Activity,
        subject: "audit",
        action: "read",
        sidebarPermission: "sidebar-activity-logs",
      },
    ],
  },
];

const userMenuItems = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/user/dashboard",
        icon: LayoutDashboard,
        sidebarPermission: "sidebar-dashboard",
      },
    ],
  },
  {
    group: "Finance & Accounts",
    items: [
      {
        title: "Chart of Accounts",
        href: "/user/accounts",
        icon: Landmark,
        subject: "bank",
        action: "read",
        sidebarPermission: "sidebar-accounts",
      },
      {
        title: "Customer Ledger",
        href: "/user/customer-ledger",
        icon: CreditCard,
        subject: "customer",
        action: "read",
        sidebarPermission: "sidebar-customer-ledger",
      },
      {
        title: "Supplier Ledger",
        href: "/user/supplier-ledger",
        icon: Coins,
        subject: "supplier",
        action: "read",
        sidebarPermission: "sidebar-supplier-ledger",
      },
    ],
  },
  {
    group: "Modules",
    items: [
      {
        title: "Suppliers",
        href: "/user/suppliers",
        icon: Truck,
        subject: "supplier",
        action: "read",
        sidebarPermission: "sidebar-suppliers",
      },
      {
        title: "Gate Pass",
        href: "/user/gate-pass",
        icon: ClipboardList,
        subject: "gatepass",
        action: "read",
        sidebarPermission: "sidebar-gatepass",
      },
    ],
  },
];

export function AppSidebar({ variant = "admin" }) {
  const pathname = usePathname();
  const { can, isSuperAdmin } = usePermissions();
  const menuItems = variant === "admin" ? adminMenuItems : userMenuItems;

  const filteredMenuItems = menuItems
    .map((group) => {
      const visibleItems = group.items.filter((item) => {
        if (isSuperAdmin) return true;
        if (item.sidebarPermission) {
          const mod = item.sidebarPermission.replace(/^sidebar-/, "");
          if (
            can("sidebar", mod) ||
            can("read", item.sidebarPermission) ||
            can("sidebar", item.sidebarPermission) ||
            can("view", item.sidebarPermission)
          ) {
            return true;
          }
        }
        if (!item.subject) return true;
        return can(item.action || "read", item.subject);
      });
      return { ...group, items: visibleItems };
    })
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-14 border-b px-3 flex items-center justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href={`/${variant}/dashboard`}
          className="flex items-center justify-center gap-3 w-full overflow-hidden transition-all"
        >
          <AspinoIcon size={38} className="shrink-0" />

          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-aspino-primary to-aspino-secondary bg-clip-text text-transparent leading-none">
              ASPINO
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-tight leading-tight mt-1 truncate">
              {variant === "admin" ? "Admin ERP" : "Pharma ERP"}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-2 group-data-[collapsible=icon]:px-0">
        {filteredMenuItems.map((group) => (
          <SidebarGroup key={group.group} className="px-2 py-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-1">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 px-2 mb-1 group-data-[collapsible=icon]:hidden">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent className="group-data-[collapsible=icon]:w-full">
              <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-10 rounded-xl transition-all duration-200 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                      >
                        <Link href={item.href} className="flex items-center justify-start group-data-[collapsible=icon]:justify-center gap-3">
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badge === "New" ? "default" : "secondary"}
                              className="ml-auto text-[10px] h-5 px-1.5 group-data-[collapsible=icon]:hidden"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="h-14 border-t px-3 flex items-center justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground justify-start group-data-[collapsible=icon]:justify-center w-full">
          <Building2 className="h-5 w-5 shrink-0 text-aspino-primary" />
          <span className="font-medium truncate group-data-[collapsible=icon]:hidden">
            Aspino Pharma ERP
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

