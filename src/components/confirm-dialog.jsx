"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the selected item from the master record.",
  confirmText = "Delete Record",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
  variant = "destructive",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card text-foreground">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </div>
        </div>

        <DialogFooter className="m-0 p-4 bg-muted/40 border-t border-border/40 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="h-10 text-xs font-bold rounded-xl border-border hover:bg-muted"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              onConfirm();
            }}
            className="h-10 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 rounded-xl shadow-md gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? "Deleting..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
