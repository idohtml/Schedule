import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ScheduleEntry } from "@/types";
import { useSettings } from "@/hooks/use-settings";

const chartConfig = {
  hours: {
    label: "Hours",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface HoursWidgetProps {
  refreshKey?: number;
}

export function HoursWidget({ refreshKey }: HoursWidgetProps) {
  const { settings } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [totalHours, setTotalHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyHours();
  }, [selectedMonth, refreshKey]);

  const fetchMonthlyHours = async () => {
    try {
      setIsLoading(true);

      // Calculate start and end dates for the selected month
      const startDate = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );
      const endDate = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const response = await fetch(
        `http://localhost:3000/api/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch monthly hours");
      }

      const result = await response.json();
      if (result.success) {
        const schedules = (result.data || []) as ScheduleEntry[];
        const total = schedules.reduce((sum, entry) => {
          return sum + parseFloat(entry.totalHours);
        }, 0);
        setTotalHours(total);
      }
    } catch (error) {
      console.error("Error fetching monthly hours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedMonth.getMonth() === now.getMonth() &&
      selectedMonth.getFullYear() === now.getFullYear()
    );
  };

  if (isLoading) {
    return null; // Suspense will handle loading
  }

  const chartData = [
    {
      hours: totalHours,
      fill: "var(--color-hours)",
    },
  ];

  const monthDisplay = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-start flex-1">
            <CardTitle>Hours Worked</CardTitle>
            <CardDescription>{monthDisplay}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!isCurrentMonth() && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="h-8"
              >
                Today
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              disabled={
                selectedMonth.getMonth() === new Date().getMonth() &&
                selectedMonth.getFullYear() === new Date().getFullYear()
              }
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar
              dataKey="hours"
              background
              cornerRadius={10}
              max={settings.monthlyGoalHours}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalHours.toFixed(1)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Hours
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <div className="flex items-center justify-between w-full text-sm">
          <span className="text-muted-foreground">Goal Progress</span>
          <span className="font-semibold tabular-nums">
            {((totalHours / settings.monthlyGoalHours) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${Math.min(
                (totalHours / settings.monthlyGoalHours) * 100,
                100
              )}%`,
              backgroundColor: "oklch(var(--chart-1))",
            }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>
            {totalHours >= settings.monthlyGoalHours
              ? "Goal reached!"
              : `${(settings.monthlyGoalHours - totalHours).toFixed(
                  1
                )}h remaining`}
          </span>
          <span>{settings.monthlyGoalHours}h target</span>
        </div>
      </CardFooter>
    </Card>
  );
}
