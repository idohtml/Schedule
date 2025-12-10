import { Suspense } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { ScheduleList } from "@/components/dashboard/schedule-list";
import { EarningsWidget } from "@/components/dashboard/earnings-widget";
import { EarningsWidgetSkeleton } from "@/components/dashboard/earnings-widget-skeleton";
import { ScheduleListSkeleton } from "@/components/dashboard/schedule-list-skeleton";
import { HoursWidget } from "@/components/dashboard/hours-widget";
import { HoursWidgetSkeleton } from "@/components/dashboard/hours-widget-skeleton";
import { ProjectHoursWidget } from "@/components/dashboard/project-hours-widget";
import { ProjectHoursWidgetSkeleton } from "@/components/dashboard/project-hours-widget-skeleton";

export const Route = createFileRoute("/(dashboard)/")({
  component: DashboardHome,
});

export function DashboardHome() {
  const { refreshKey } = useRouteContext({ from: "/(dashboard)" });

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Suspense
          fallback={<EarningsWidgetSkeleton />}
          key={`earnings-${refreshKey}`}
        >
          <EarningsWidget refreshKey={refreshKey} />
        </Suspense>
        <Suspense
          fallback={<HoursWidgetSkeleton />}
          key={`hours-${refreshKey}`}
        >
          <HoursWidget refreshKey={refreshKey} />
        </Suspense>
        <Suspense
          fallback={<ProjectHoursWidgetSkeleton />}
          key={`projects-${refreshKey}`}
        >
          <ProjectHoursWidget refreshKey={refreshKey} />
        </Suspense>
      </div>
      <Suspense
        fallback={<ScheduleListSkeleton />}
        key={`schedule-${refreshKey}`}
      >
        <ScheduleList refreshKey={refreshKey} />
      </Suspense>
    </>
  );
}

