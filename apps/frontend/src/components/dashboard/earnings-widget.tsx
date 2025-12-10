"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ScheduleEntry } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const HOURLY_RATE = 147; // SEK per hour before taxes

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function EarningsWidget() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      // Get last 7 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // Last 7 days

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

  // Group schedules by date and calculate daily earnings
  const chartData = useMemo(() => {
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

      // Calculate total hours and earnings for this day
      const totalHours = dayEntries.reduce((sum, entry) => {
        return sum + parseFloat(entry.totalHours);
      }, 0);

      const earnings = totalHours * HOURLY_RATE;

      days.push({
        day: label,
        earnings: Math.round(earnings),
      });
    }

    return days;
  }, [schedules]);

  // Calculate total earnings and trend
  const totalEarnings = useMemo(() => {
    const totalHours = schedules.reduce((sum, entry) => {
      return sum + parseFloat(entry.totalHours);
    }, 0);
    return totalHours * HOURLY_RATE;
  }, [schedules]);

  const previousWeekEarnings = useMemo(() => {
    // Calculate earnings for days 7-13 (previous week)
    const previousWeekEntries = schedules.filter((entry) => {
      const entryDate = new Date(entry.date);
      const daysAgo = Math.floor(
        (new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysAgo >= 7 && daysAgo < 14;
    });

    const totalHours = previousWeekEntries.reduce((sum, entry) => {
      return sum + parseFloat(entry.totalHours);
    }, 0);
    return totalHours * HOURLY_RATE;
  }, [schedules]);

  const trendPercentage = useMemo(() => {
    if (previousWeekEarnings === 0) return "0.0";
    const change =
      ((totalEarnings - previousWeekEarnings) / previousWeekEarnings) * 100;
    return change.toFixed(1);
  }, [totalEarnings, previousWeekEarnings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
        <CardDescription>Last 7 days - {HOURLY_RATE} SEK/hour</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="earnings" fill="var(--color-earnings)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total: {totalEarnings.toFixed(0)} SEK
          {trendPercentage !== "0.0" && (
            <>
              {" "}
              ({parseFloat(trendPercentage) > 0 ? "+" : ""}
              {trendPercentage}% vs previous week)
              {parseFloat(trendPercentage) > 0 && (
                <TrendingUp className="h-4 w-4" />
              )}
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">Before taxes</div>
      </CardFooter>
    </Card>
  );
}
