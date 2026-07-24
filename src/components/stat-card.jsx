"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "blue",
  className,
}) {
  const variantClasses = {
    blue: "stat-card-blue",
    navy: "stat-card-navy",
    green: "stat-card-green",
    amber: "stat-card-amber",
    red: "stat-card-red",
  };

  const iconBgClasses = {
    blue: "bg-blue-50 text-aspino-primary dark:bg-blue-950/50",
    navy: "bg-indigo-50 text-aspino-secondary dark:bg-indigo-950/50",
    green: "bg-emerald-50 text-aspino-success dark:bg-emerald-950/50",
    amber: "bg-amber-50 text-aspino-warning dark:bg-amber-950/50",
    red: "bg-red-50 text-aspino-danger dark:bg-red-950/50",
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card
      className={cn(
        "card-hover overflow-hidden",
        variantClasses[variant],
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {isPositive && (
                  <div className="flex items-center gap-0.5 text-aspino-success">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">+{change}%</span>
                  </div>
                )}
                {isNegative && (
                  <div className="flex items-center gap-0.5 text-aspino-danger">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{change}%</span>
                  </div>
                )}
                {!isPositive && !isNegative && (
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">0%</span>
                  </div>
                )}
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "rounded-xl p-3 transition-transform duration-200 hover:scale-105",
                iconBgClasses[variant]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
