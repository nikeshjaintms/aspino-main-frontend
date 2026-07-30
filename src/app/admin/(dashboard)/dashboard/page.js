"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import {
  ChartCard,
  AreaChartWidget,
  PieChartWidget,
} from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Truck,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
  Tags,
  Building2,
  Loader2,
} from "lucide-react";

const statusConfig = {
  GATE_IN: {
    label: "Inside",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  COMPLETED: {
    label: "Timed Out",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  },
};

const alertIcons = {
  warning: AlertTriangle,
  danger: XCircle,
  info: AlertCircle,
  success: CheckCircle2,
};

const alertColors = {
  warning: "text-aspino-warning",
  danger: "text-aspino-danger",
  info: "text-aspino-primary",
  success: "text-aspino-success",
};

export default function AdminDashboard() {
  const [gatePasses, setGatePasses] = useState([]);
  const [gatePassStats, setGatePassStats] = useState({ total: 0, totalInward: 0, totalOutward: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [user, setUser] = useState({ name: "Aspino Admin", email: "admin@aspino.com", role: "ADMIN" });
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  useEffect(() => {
    // Load user cookie
    if (typeof window !== "undefined") {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
      };

      const cookieUser = getCookie("adminUser");
      if (cookieUser) {
        try {
          setUser(JSON.parse(decodeURIComponent(cookieUser)));
        } catch (e) {
          console.error("Failed to parse user cookie", e);
        }
      }
    }

    const fetchData = async () => {
      try {
        const [passRes, supplierRes, catRes, bankRes] = await Promise.all([
          fetch(`${backendUrl}/gate-pass?limit=1000`),
          fetch(`${backendUrl}/supplier`),
          fetch(`${backendUrl}/pass-category`),
          fetch(`${backendUrl}/bank`),
        ]);

        const [passData, supplierData, catData, bankData] = await Promise.all([
          passRes.json(),
          supplierRes.json(),
          catRes.json(),
          bankRes.json(),
        ]);

        setGatePasses(passData.data || []);
        setGatePassStats({
          total: passData.total || 0,
          totalInward: passData.totalInward || 0,
          totalOutward: passData.totalOutward || 0,
        });
        setSuppliers(supplierData || []);
        setCategories(catData || []);
        setBanks(bankData || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backendUrl]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
      ? "Good Afternoon"
      : "Good Evening";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-aspino-primary animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading Dashboard Operations...</span>
      </div>
    );
  }

  // Process monthly pass chart data
  const getMonthlyPassData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];
      counts[monthName] = { name: monthName, inward: 0, outward: 0 };
    }
    
    gatePasses.forEach(pass => {
      const date = new Date(pass.timeIn || pass.createdAt);
      const monthName = months[date.getMonth()];
      if (counts[monthName]) {
        if (pass.type === "INWARD") counts[monthName].inward++;
        else if (pass.type === "OUTWARD") counts[monthName].outward++;
      }
    });
    
    return Object.values(counts);
  };

  // Process category distribution chart data
  const getCategoryDistribution = () => {
    const counts = {};
    gatePasses.forEach(pass => {
      const catName = pass.category?.name || "Uncategorized";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    
    const colors = ["#2A93D2", "#29447B", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6", "#10B981"];
    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return [{ name: "No Passes", value: 1, color: "#cbd5e1" }];
    }
    return entries.map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  };

  // Process alerts dynamically
  const getDynamicAlerts = () => {
    const alertsList = [];
    const now = new Date();
    
    // 1. Overstay Warning
    const overstayVehicles = gatePasses.filter(pass => {
      if (pass.status !== "GATE_IN") return false;
      const timeDiff = now - new Date(pass.timeIn);
      return timeDiff > 4 * 60 * 60 * 1000;
    });
    overstayVehicles.forEach(pass => {
      alertsList.push({
        type: "danger",
        message: `Vehicle ${pass.vehicleNumber} (${pass.driverName}) has been inside for over 4 hours`,
        time: "Overstay Alert",
      });
    });
    
    // 2. Vehicles currently inside
    const activeInside = gatePasses.filter(pass => pass.status === "GATE_IN").length;
    if (activeInside > 0) {
      alertsList.push({
        type: "info",
        message: `${activeInside} vehicle${activeInside > 1 ? "s are" : " is"} currently inside the premises`,
        time: "Live Security Status",
      });
    }
    
    // 3. Inward passes missing PO / GRN
    const missingPo = gatePasses.filter(pass => pass.type === "INWARD" && !pass.poNumber).length;
    if (missingPo > 0) {
      alertsList.push({
        type: "warning",
        message: `${missingPo} Inward Gate Pass${missingPo > 1 ? "es are" : " is"} missing PO/GRN reference`,
        time: "Action Required",
      });
    }
    
    // Default fallback
    if (alertsList.length < 4) {
      alertsList.push({
        type: "success",
        message: "Gate operation protocols are completely aligned",
        time: "System Clear",
      });
    }
    
    return alertsList.slice(0, 4);
  };

  const revenueData = getMonthlyPassData();
  const inventoryData = getCategoryDistribution();
  const alerts = getDynamicAlerts();
  const recentOrders = gatePasses.slice(0, 5); // top 5 recent gate passes

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aspino-secondary via-[#2a5a9d] to-aspino-primary p-6 sm:p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-white/15 text-white border-white/20 text-xs font-semibold"
              >
                {user.role || "Admin"}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {greeting}, {user.name || "Aspino Admin"}! 👋
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-lg">
              Here&apos;s what&apos;s happening across your digital gate pass
              operations today. You have{" "}
              <span className="text-white font-semibold font-black">
                {gatePasses.filter(p => p.status === "GATE_IN").length} active vehicles
              </span>{" "}
              inside the premises to monitor.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/gate-pass">
              <Button
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-white border-white/20 font-bold"
              >
                <Activity className="h-4 w-4 mr-2" />
                Manage Gate Passes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <StatCard
            title="Digital Gate Passes"
            value={gatePassStats.total.toLocaleString()}
            change={gatePassStats.total > 0 ? Number(((gatePassStats.totalInward / gatePassStats.total) * 100).toFixed(1)) : 0}
            changeLabel="% Inward Passes"
            icon={ClipboardList}
            variant="blue"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <StatCard
            title="Active Suppliers"
            value={suppliers.length.toLocaleString()}
            change={100}
            changeLabel="Approval rate"
            icon={Truck}
            variant="navy"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <StatCard
            title="Pass Categories"
            value={categories.length.toLocaleString()}
            change={categories.filter(c => c.isActive).length}
            changeLabel="Active categories"
            icon={Tags}
            variant="amber"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <StatCard
            title="Registered Banks"
            value={banks.length.toLocaleString()}
            change={banks.filter(b => b.isActive).length}
            changeLabel="Active banks"
            icon={Building2}
            variant="green"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Gate Pass Traffic Trends"
          description="Inward vs Outward Monthly overview"
          className="lg:col-span-2"
          action={
            <Link href="/admin/gate-pass">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          }
        >
          <AreaChartWidget
            data={revenueData}
            dataKeys={[
              { key: "inward", label: "Inward Passes", color: "#2A93D2" },
              { key: "outward", label: "Outward Passes", color: "#29447B" },
            ]}
            height={280}
          />
        </ChartCard>

        <ChartCard
          title="Gate Passes by Category"
          description="Category distribution of passes"
        >
          <PieChartWidget data={inventoryData} height={280} />
        </ChartCard>
      </div>

      {/* Recent Passes and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Passes */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Gate Passes
              </CardTitle>
              <Link href="/admin/gate-pass">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-xs font-semibold text-slate-500 py-6 text-center">No gate passes created yet.</p>
              ) : (
                recentOrders.map((pass) => {
                  const status = statusConfig[pass.status] || { label: pass.status, className: "" };
                  return (
                    <div
                      key={pass.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-aspino-primary/10 text-aspino-primary text-xs font-semibold">
                            {pass.type === "INWARD" ? "IN" : "OU"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {pass.vehicleNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pass.driverName} • {pass.passNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                System Alerts
              </CardTitle>
              <Badge variant="destructive" className="text-[10px]">
                {alerts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, i) => {
                const AlertIcon = alertIcons[alert.type] || AlertCircle;
                return (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <AlertIcon
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${alertColors[alert.type]}`}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm leading-snug">{alert.message}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
