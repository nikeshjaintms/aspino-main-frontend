import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";

export const metadata = {
  title: "Admin Dashboard - Aspino ERP",
  description: "Aspino Pharmaceutical ERP Admin Dashboard",
};

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("adminUser");
  
  let user = {
    name: "Aspino Admin",
    role: "Administrator",
    email: "admin@aspino.com",
  };

  if (userCookie && userCookie.value) {
    try {
      // Decode the cookie value just like the profile page
      let cookieValue = userCookie.value;
      try {
        cookieValue = decodeURIComponent(cookieValue);
      } catch (e) {}

      const parsed = JSON.parse(cookieValue);
      user = {
        name: parsed.name || user.name,
        role: parsed.role || user.role,
        email: parsed.email || user.email,
      };
    } catch (e) {
      console.error("Failed to parse user cookie in layout", e);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="admin" />
      <SidebarInset>
        <Navbar user={user} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">{children}</main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
