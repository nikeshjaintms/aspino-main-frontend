"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  HelpCircle,
  ChevronDown,
  KeyRound,
} from "lucide-react";

export function Navbar({ user: initialUser = {} }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const currentUser = initialUser;

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      // Clear Cookies
      document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "adminUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

      // Clear localStorage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }

    router.push("/admin/login");
  };

  const displayName = currentUser?.name || currentUser?.displayName || "Aspino Admin";
  const role = currentUser?.role || "Administrator";
  const email = currentUser?.email || "admin@aspino.com";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="-ml-1" />

        {/* Search */}
        <div className="flex-1 flex items-center">
          <div className="relative hidden md:block w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers, gate passes..."
              className="pl-10 h-9 bg-muted/40 border-0 focus:bg-background focus:border-border transition-all"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-aspino-danger text-[10px] font-bold text-white">
              3
            </span>
          </Button> */}

          {/* Help */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex h-9 w-9 rounded-lg"
          >
            <HelpCircle className="h-4 w-4" />
          </Button> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 rounded-lg hover:bg-accent"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-sky-600 to-blue-700 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {role}
                  </span>
                </div>
                <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
