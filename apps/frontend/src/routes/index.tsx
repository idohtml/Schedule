import { Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";
import { AppSidebar } from "@/components/app-sidebar";
import { ScheduleList } from "@/components/dashboard/schedule-list";
import { EarningsWidget } from "@/components/dashboard/earnings-widget";
import { EarningsWidgetSkeleton } from "@/components/dashboard/earnings-widget-skeleton";
import { ScheduleListSkeleton } from "@/components/dashboard/schedule-list-skeleton";
import { HoursWidget } from "@/components/dashboard/hours-widget";
import { HoursWidgetSkeleton } from "@/components/dashboard/hours-widget-skeleton";
import { ProjectHoursWidget } from "@/components/dashboard/project-hours-widget";
import { ProjectHoursWidgetSkeleton } from "@/components/dashboard/project-hours-widget-skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  // Always call hooks in the same order
  useEffect(() => {
    if (!isPending && !session?.session) {
      navigate({ to: "/login", replace: true });
    }
  }, [session, isPending, navigate]);

  // Always render something - don't conditionally return early before hooks
  if (isPending) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session?.session) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // User is authenticated - show dashboard with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Suspense fallback={<EarningsWidgetSkeleton />}>
              <EarningsWidget />
            </Suspense>
            <Suspense fallback={<HoursWidgetSkeleton />}>
              <HoursWidget />
            </Suspense>
            <Suspense fallback={<ProjectHoursWidgetSkeleton />}>
              <ProjectHoursWidget />
            </Suspense>
          </div>
          <Suspense fallback={<ScheduleListSkeleton />}>
            <ScheduleList />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
