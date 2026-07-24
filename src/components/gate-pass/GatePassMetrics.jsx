"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Tags, Layers } from "lucide-react";

export function GatePassMetrics({ inwardCount, outwardCount, categoriesCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-sky-50/40 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inward Deliveries</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{inwardCount}</h3>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Raw material & visitors
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outward Movement</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{outwardCount}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Sales & Returnables
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-purple-50/40 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Configured Categories</p>
            <h3 className="text-2xl font-black text-purple-800 dark:text-purple-300">{categoriesCount}</h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Dynamic CRUD Categories
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Tags className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
