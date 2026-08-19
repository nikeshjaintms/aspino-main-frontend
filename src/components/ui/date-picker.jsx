"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className = "",
  error = false,
  fromYear = 1970,
  toYear = 2050,
}) {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    // Handle YYYY-MM-DD string cleanly without timezone offset bugs
    if (typeof value === "string" && value.includes("-")) {
      const parts = value.split("T")[0].split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  // Calendar navigation state (year & month)
  const [viewDate, setViewDate] = React.useState(() => {
    return selectedDate || new Date();
  });

  // Sync viewDate when popover opens or value changes
  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate, open]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, viewMonth, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(viewYear, newMonth, 1));
  };

  const handleSelectDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd}`;
    onChange?.(formatted);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  // Generate calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth, day),
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth + 1, day),
      isCurrentMonth: false,
    });
  }

  // Format date display (e.g. 19 Aug 2026)
  const displayLabel = React.useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate]);

  const isToday = (d) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d) => {
    if (!selectedDate) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Year range list for dropdown
  const years = React.useMemo(() => {
    const list = [];
    for (let y = fromYear; y <= toYear; y++) {
      list.push(y);
    }
    return list;
  }, [fromYear, toYear]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border bg-background px-3 py-2 text-xs transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-500 focus-visible:ring-red-500" : "border-border",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate font-medium", value ? "text-foreground font-semibold" : "text-muted-foreground")}>
              {displayLabel || placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                title="Clear date"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-50" />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[268px] p-3 rounded-2xl shadow-xl border border-border/70 bg-popover text-popover-foreground"
        align="start"
        sideOffset={6}
      >
        {/* Shadcn UI Dropdown Caption Navigation Bar */}
        <div className="flex items-center justify-between gap-1 pb-2">
          {/* Previous Month Button */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Month & Year Dropdowns (Dropdown Caption Layout) */}
          <div className="flex items-center gap-1.5">
            {/* Month Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                aria-label="Select month"
                className="h-7 appearance-none rounded-md bg-transparent pl-2 pr-5 text-xs font-semibold text-foreground hover:bg-muted/60 focus:bg-muted focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-popover text-foreground">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3 text-muted-foreground" />
            </div>

            {/* Year Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={viewYear}
                onChange={handleYearChange}
                aria-label="Select year"
                className="h-7 appearance-none rounded-md bg-transparent pl-2 pr-5 text-xs font-semibold text-foreground font-mono hover:bg-muted/60 focus:bg-muted focus:outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-popover text-foreground">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {/* Next Month Button */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 pt-1 pb-1 text-center border-t border-border/40">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="text-[11px] font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center pt-0.5">
          {calendarDays.map((item, idx) => {
            const isSelectedDay = isSelected(item.date);
            const isTodayDay = isToday(item.date);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDate(item.date)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors mx-auto cursor-pointer",
                  !item.isCurrentMonth && "text-muted-foreground/30 hover:text-muted-foreground",
                  item.isCurrentMonth && !isSelectedDay && "text-foreground hover:bg-muted",
                  isTodayDay && !isSelectedDay && "border border-primary/50 font-bold text-primary",
                  isSelectedDay && "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary"
                )}
              >
                {item.date.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
