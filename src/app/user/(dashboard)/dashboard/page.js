"use client";

import { AspinoLogo } from "@/components/aspino-logo";
import { StatCard } from "@/components/stat-card";
import { ChartCard, LineChartWidget, PieChartWidget } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  Package,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const salesTrend = [
  { name: "Mon", sales: 120, returns: 8 },
  { name: "Tue", sales: 145, returns: 12 },
  { name: "Wed", sales: 168, returns: 6 },
  { name: "Thu", sales: 134, returns: 9 },
  { name: "Fri", sales: 192, returns: 15 },
  { name: "Sat", sales: 210, returns: 11 },
  { name: "Sun", sales: 85, returns: 4 },
];

const stockByCategory = [
  { name: "Antibiotics", value: 420, color: "#2A93D2" },
  { name: "Analgesics", value: 350, color: "#29447B" },
  { name: "Vitamins", value: 280, color: "#22C55E" },
  { name: "Antacids", value: 190, color: "#F59E0B" },
  { name: "Others", value: 160, color: "#8B5CF6" },
];

const recentActivity = [
  { action: "Dispensed Amoxicillin 500mg", time: "15 min ago", type: "dispensed" },
  { action: "Stock received: Paracetamol 650mg (500 units)", time: "1 hour ago", type: "received" },
  { action: "Low stock alert: Cetirizine 10mg", time: "2 hours ago", type: "alert" },
  { action: "Dispensed Metformin 500mg", time: "3 hours ago", type: "dispensed" },
  { action: "Batch verification completed", time: "4 hours ago", type: "completed" },
];

const activityIcons = {
  dispensed: <Pill className="h-4 w-4 text-aspino-primary" />,
  received: <Package className="h-4 w-4 text-aspino-success" />,
  alert: <AlertTriangle className="h-4 w-4 text-aspino-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-aspino-success" />,
};

export default function UserDashboard() {
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aspino-primary via-[#2a7dc0] to-aspino-secondary p-6 sm:p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/3 -translate-x-1/3" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-2xl translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AspinoLogo size="sm" className="[&_span]:text-white" />
              <Badge
                variant="secondary"
                className="bg-white/15 text-white border-white/20 text-xs"
              >
                Pharmacist
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {greeting}, Rahul! 👋
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-lg">
              You&apos;ve processed{" "}
              <span className="text-white font-semibold">24 prescriptions</span>{" "}
              today.{" "}
              <span className="text-white font-semibold">2 alerts</span> need
              your attention.
            </p>
          </div>
          <Button
            variant="secondary"
            className="bg-white/15 hover:bg-white/25 text-white border-white/20"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            My Tasks
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Dispensed"
          value="24"
          change={8.3}
          changeLabel="vs yesterday"
          icon={Pill}
          variant="blue"
        />
        <StatCard
          title="Pending Orders"
          value="7"
          icon={ClipboardList}
          variant="amber"
        />
        <StatCard
          title="Stock Alerts"
          value="3"
          icon={AlertTriangle}
          variant="red"
        />
        <StatCard
          title="This Week Sales"
          value="₹1.2L"
          change={12.4}
          changeLabel="vs last week"
          icon={TrendingUp}
          variant="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Weekly Sales Trend"
          description="Sales and returns this week"
          className="lg:col-span-2"
        >
          <LineChartWidget
            data={salesTrend}
            dataKeys={[
              { key: "sales", label: "Sales", color: "#2A93D2" },
              { key: "returns", label: "Returns", color: "#EF4444" },
            ]}
            height={280}
          />
        </ChartCard>

        <ChartCard
          title="Stock by Category"
          description="Current inventory distribution"
        >
          <PieChartWidget data={stockByCategory} height={280} />
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5">{activityIcons[activity.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.action}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
