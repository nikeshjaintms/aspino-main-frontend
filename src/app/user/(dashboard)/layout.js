import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "User Dashboard - Aspino ERP",
  description: "Aspino Pharmaceutical ERP User Dashboard",
};

export default function UserLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="user" />
      <SidebarInset>
        <Navbar
          user={{
            name: "Rahul Mehta",
            role: "Pharmacist",
            email: "rahul@aspino.com",
          }}
        />
        <main className="flex-1 p-4 sm:p-6 space-y-6">{children}</main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
