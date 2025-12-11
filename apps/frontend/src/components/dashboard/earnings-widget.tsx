import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSettings } from "@/hooks/use-settings";
import { calculateTotalEarnings } from "@/lib/utils";
import type { ScheduleEntry } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

type ViewType = "daily" | "weekly" | "monthly";

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface EarningsWidgetProps {
  refreshKey?: number;
}

interface Project {
  id: string;
  hourlyRate?: string | null;
}

export function EarningsWidget({ refreshKey }: EarningsWidgetProps) {
  const { settings } = useSettings();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>("daily");

  useEffect(() => {
    fetchSchedules();
    fetchProjects();
  }, [viewType, refreshKey]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/project", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const result = await response.json();
      if (result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();

      // Calculate date range based on view type
      switch (viewType) {
        case "daily":
          startDate.setDate(startDate.getDate() - 6); // Last 7 days
          break;
        case "weekly":
          startDate.setDate(startDate.getDate() - 27); // Last 4 weeks (28 days)
          break;
        case "monthly":
          startDate.setMonth(startDate.getMonth() - 5); // Last 6 months
          break;
      }

      const response = await fetch(
        `http://localhost:3000/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const result = await response.json();
      if (result.success) {
        setSchedules(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a map of projectId -> hourlyRate, with fallback to default rate
  const projectRatesMap = useMemo(() => {
    const map = new Map<string | null, number>();
    const defaultRate = settings.hourlyRate;

    // Set default rate for entries without a project
    map.set(null, defaultRate);

    // Set project-specific rates
    projects.forEach((project) => {
      if (project.hourlyRate) {
        map.set(project.id, parseFloat(project.hourlyRate));
      } else {
        // Use default rate if project doesn't have one
        map.set(project.id, defaultRate);
      }
    });

    return map;
  }, [projects, settings.hourlyRate]);

  // Group schedules by period and calculate earnings
  const chartData = useMemo(() => {
    const calculateEarnings = (entries: ScheduleEntry[]) => {
      return entries.reduce((sum, entry) => {
        const hours = parseFloat(entry.totalHours);
        const rate =
          projectRatesMap.get(entry.projectId) || settings.hourlyRate;
        return sum + hours * rate;
      }, 0);
    };

    if (viewType === "daily") {
      // Get last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dayNumber = date.getDate();
        const label = `${dayName} ${dayNumber}`;

        // Find all entries for this date
        const dayEntries = schedules.filter((entry) => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === date.getTime();
        });

        const earnings = calculateEarnings(dayEntries);

        days.push({
          period: label,
          earnings: Math.round(earnings),
        });
      }
      return days;
    } else if (viewType === "weekly") {
      // Get last 4 weeks
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);

        const label = `Week ${i + 1}`;

        // Find all entries for this week
        const weekEntries = schedules.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });

        const earnings = calculateEarnings(weekEntries);

        weeks.push({
          period: label,
          earnings: Math.round(earnings),
        });
      }
      return weeks;
    } else {
      // Get last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        month.setDate(1);
        month.setHours(0, 0, 0, 0);

        const monthEnd = new Date(month);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const label = month.toLocaleDateString("en-US", { month: "short" });

        // Find all entries for this month
        const monthEntries = schedules.filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate >= month && entryDate <= monthEnd;
        });

        const earnings = calculateEarnings(monthEntries);

        months.push({
          period: label,
          earnings: Math.round(earnings),
        });
      }
      return months;
    }
  }, [schedules, viewType, projectRatesMap, settings.hourlyRate]);

  // Calculate total earnings for the current period (today, this week, or this month)
  const totalEarnings = useMemo(() => {
    return calculateTotalEarnings(schedules, viewType, projectRatesMap);
  }, [schedules, viewType, projectRatesMap]);

  const totalTaxes = useMemo(() => {
    return totalEarnings * settings.taxRate;
  }, [totalEarnings, settings.taxRate]);

  const afterTaxEarnings = useMemo(() => {
    return totalEarnings - totalTaxes;
  }, [totalEarnings, totalTaxes]);

  // Show skeleton during initial load (Suspense will handle this)
  // Keep internal loading for viewType changes
  if (isLoading && schedules.length === 0) {
    return null; // Suspense fallback will show
  }

  const getDescription = () => {
    switch (viewType) {
      case "daily":
        return "Last 7 days";
      case "weekly":
        return "Last 4 weeks";
      case "monthly":
        return "Last 6 months";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Earnings</CardTitle>
            <CardDescription>
              {getDescription()} - Project-specific rates
            </CardDescription>
          </div>
          <ButtonGroup>
            <Button
              variant={viewType === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("daily")}
            >
              Daily
            </Button>
            <Button
              variant={viewType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={viewType === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("monthly")}
            >
              Monthly
            </Button>
          </ButtonGroup>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="earnings"
              fill="var(--color-earnings)"
              radius={8}
              style={{ cursor: "pointer" }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col w-full gap-1.5 text-sm">
        <div className="flex items-center justify-between w-full leading-none">
          <span className="text-muted-foreground">Earnings</span>
          <span className="font-medium tabular-nums">
            {totalEarnings.toFixed(0)} SEK
          </span>
        </div>
        <div className="flex items-center justify-between w-full leading-none">
          <span className="text-muted-foreground">Taxes</span>
          <span className="font-medium tabular-nums">
            {totalTaxes.toFixed(1)} SEK
          </span>
        </div>
        <div className="flex items-center justify-between w-full leading-none border-t pt-1.5 mt-0.5">
          <span className="text-muted-foreground">After</span>
          <span className="font-semibold tabular-nums">
            {afterTaxEarnings.toFixed(0)} SEK
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
