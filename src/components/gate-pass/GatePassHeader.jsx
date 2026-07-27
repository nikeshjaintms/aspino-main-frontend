"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, Download, Tags, Plus } from "lucide-react";

export function GatePassHeader({
  categoriesCount,
  onExportPDF,
  onOpenCategoryModal,
  onOpenIssueModal,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          Digital Gate Pass & Category Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Enterprise Logistics & Gate Movement Control • Aspino Speciality Chemicals
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* <Button
          variant="outline"
          onClick={onExportPDF}
          className="rounded-xl font-bold gap-2 text-xs border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 h-11"
        >
          <Download className="h-4 w-4 text-sky-600 dark:text-sky-450" />
          Export Register PDF
        </Button> */}

        <Button
          variant="outline"
          onClick={onOpenCategoryModal}
          className="rounded-xl font-bold gap-2 text-xs border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-11"
        >
          <Tags className="h-4 w-4 text-sky-600 dark:text-sky-450" />
          Category CRUD ({categoriesCount})
        </Button>

        <Button
          onClick={onOpenIssueModal}
          className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 gap-2 h-11"
        >
          <Plus className="h-4 w-4" />
          Issue Gate Pass
        </Button>
      </div>
    </div>
  );
}
