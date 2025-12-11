import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ScheduleEntry } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(":");
  return `${hours}:${minutes}`;
}

type ViewType = "daily" | "weekly" | "monthly";

/**
 * Calculate total earnings for the current period based on view type
 * @param schedules - Array of schedule entries
 * @param viewType - The view type (daily, weekly, or monthly)
 * @param projectRates - Map of projectId to hourly rate, or default hourly rate number
 * @returns Total earnings for the current period
 */
export function calculateTotalEarnings(
  schedules: ScheduleEntry[],
  viewType: ViewType,
  projectRates: Map<string | null, number> | number
): number {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // Calculate date range for the CURRENT period
  switch (viewType) {
    case "daily":
      // Today only
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      // Current week (Monday to Sunday)
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get to Monday
      startDate.setDate(startDate.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Sunday (6 days after Monday)
      endDate.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      // Current month (first day to last day)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  // Filter schedules to match the current period
  const filteredSchedules = schedules.filter((entry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const entryDateOnly = entryDate.getTime();

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return entryDateOnly >= startTime && entryDateOnly <= endTime;
  });

  // Calculate earnings using project-specific rates
  const totalEarnings = filteredSchedules.reduce((sum, entry) => {
    const hours = parseFloat(entry.totalHours);
    let rate: number;

    if (typeof projectRates === "number") {
      // Fallback: use single rate for all entries
      rate = projectRates;
    } else {
      // Use project-specific rate or fallback to default
      rate = projectRates.get(entry.projectId) || projectRates.get(null) || 0;
    }

    return sum + hours * rate;
  }, 0);

  return totalEarnings;
}
