"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AspinoLogo, AspinoIcon } from "@/components/aspino-logo";
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
} from "lucide-react";

const adminMenuItems = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
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
      },
    ],
  },
  {
    group: "Masters",
    items: [
      {
        title: "Pass Categories",
        href: "/admin/pass-categories",
        icon: Tags,
      },
      {
        title: "Bank Master",
        href: "/admin/banks",
        icon: Building2,
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
      },
      {
        title: "Gate Pass",
        href: "/admin/gate-pass",
        icon: ClipboardList,
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
      },
    ],
  },
];

export function AppSidebar({ variant = "admin" }) {
  const pathname = usePathname();
  const menuItems = variant === "admin" ? adminMenuItems : userMenuItems;

  return (
    <Sidebar collapsible="icon" className="border-r">
     <SidebarHeader className="border-b px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-3">
  <Link
    href={`/${variant}/dashboard`}
    className="flex items-center justify-center gap-2.5 w-full overflow-hidden transition-all"
  >
    <AspinoIcon size={34} className="shrink-0" />

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

      <SidebarContent className="px-2 py-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 px-2 mb-0.5">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-9 rounded-lg transition-all duration-200"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
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

      <SidebarFooter className="border-t px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="font-medium truncate group-data-[collapsible=icon]:hidden">
            Aspino Pharma ERP
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
