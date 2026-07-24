"use client";

import { AspinoLogo } from "@/components/aspino-logo";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  ChartCard,
  BarChartWidget,
  AreaChartWidget,
  PieChartWidget,
} from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pill,
  Package,
  Truck,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
  Tags,
  Building2,
} from "lucide-react";

// Mock data
const revenueData = [
  { name: "Jan", revenue: 42000, orders: 320 },
  { name: "Feb", revenue: 38000, orders: 290 },
  { name: "Mar", revenue: 51000, orders: 410 },
  { name: "Apr", revenue: 47000, orders: 380 },
  { name: "May", revenue: 53000, orders: 420 },
  { name: "Jun", revenue: 58000, orders: 450 },
  { name: "Jul", revenue: 62000, orders: 490 },
];

const inventoryData = [
  { name: "Antibiotics", value: 320, color: "#2A93D2" },
  { name: "Analgesics", value: 280, color: "#29447B" },
  { name: "Antipyretics", value: 190, color: "#22C55E" },
  { name: "Vitamins", value: 240, color: "#F59E0B" },
  { name: "Others", value: 150, color: "#8B5CF6" },
];

const recentOrders = [
  {
    id: "ORD-2024-001",
    medicine: "Amoxicillin 500mg",
    supplier: "PharmaCorp Ltd",
    amount: "₹45,000",
    status: "completed",
    time: "2 hours ago",
  },
  {
    id: "ORD-2024-002",
    medicine: "Paracetamol 650mg",
    supplier: "MediSupply Inc",
    amount: "₹28,000",
    status: "processing",
    time: "5 hours ago",
  },
  {
    id: "ORD-2024-003",
    medicine: "Cetirizine 10mg",
    supplier: "HealthDist Co",
    amount: "₹15,500",
    status: "pending",
    time: "8 hours ago",
  },
  {
    id: "ORD-2024-004",
    medicine: "Metformin 500mg",
    supplier: "GlobalMed Pvt",
    amount: "₹62,000",
    status: "completed",
    time: "1 day ago",
  },
  {
    id: "ORD-2024-005",
    medicine: "Ibuprofen 400mg",
    supplier: "PharmaCorp Ltd",
    amount: "₹33,000",
    status: "cancelled",
    time: "1 day ago",
  },
];

const alerts = [
  {
    type: "warning",
    message: "12 medicines are running low on stock",
    time: "10 min ago",
  },
  {
    type: "danger",
    message: "3 medicines expired today",
    time: "1 hour ago",
  },
  {
    type: "info",
    message: "New supplier registration pending approval",
    time: "2 hours ago",
  },
  {
    type: "success",
    message: "Monthly inventory audit completed",
    time: "5 hours ago",
  },
];

const statusConfig = {
  completed: {
    label: "Completed",
    variant: "default",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  processing: {
    label: "Processing",
    variant: "default",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  },
  pending: {
    label: "Pending",
    variant: "default",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  },
  cancelled: {
    label: "Cancelled",
    variant: "default",
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
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
      ? "Good Afternoon"
      : "Good Evening";

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
              {/* <AspinoLogo size="sm" className="[&_span]:text-white" /> */}
              <Badge
                variant="secondary"
                className="bg-white/15 text-white border-white/20 text-xs"
              >
                Admin
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {greeting}, Dr. Sarah! 👋
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-lg">
              Here&apos;s what&apos;s happening across your pharmaceutical
              operations today. You have{" "}
              <span className="text-white font-semibold">3 alerts</span> and{" "}
              <span className="text-white font-semibold">5 pending orders</span>{" "}
              to review.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-white border-white/20"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <StatCard
            title="Digital Gate Passes"
            value="1,420"
            change={14.2}
            changeLabel="vs last month"
            icon={ClipboardList}
            variant="blue"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <StatCard
            title="Active Suppliers"
            value="156"
            change={4.2}
            changeLabel="vs last month"
            icon={Truck}
            variant="navy"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <StatCard
            title="Pass Categories"
            value="24"
            change={8.5}
            changeLabel="vs last month"
            icon={Tags}
            variant="amber"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <StatCard
            title="Registered Banks"
            value="18"
            change={5.0}
            changeLabel="vs last month"
            icon={Building2}
            variant="green"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Revenue & Orders"
          description="Monthly performance overview"
          className="lg:col-span-2"
          action={
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        >
          <AreaChartWidget
            data={revenueData}
            dataKeys={[
              { key: "revenue", label: "Revenue (₹)", color: "#2A93D2" },
              { key: "orders", label: "Orders", color: "#29447B" },
            ]}
            height={280}
          />
        </ChartCard>

        <ChartCard
          title="Inventory by Category"
          description="Stock distribution"
        >
          <PieChartWidget data={inventoryData} height={280} />
        </ChartCard>
      </div>

      {/* Recent Orders and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Purchase Orders
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status];
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-aspino-primary/10 text-aspino-primary text-xs font-semibold">
                          {order.medicine.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {order.medicine}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.supplier} • {order.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold hidden sm:block">
                        {order.amount}
                      </span>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
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
                const AlertIcon = alertIcons[alert.type];
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
