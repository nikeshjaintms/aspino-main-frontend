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
       {
        title: "Activity Logs",
        href: "/admin/activity-logs",
        icon: Activity,
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
        {menuItems.map((group) => (
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
