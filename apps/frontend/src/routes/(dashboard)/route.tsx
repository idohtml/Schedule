import {
  createFileRoute,
  Outlet,
  useNavigate,
  Link,
  useMatches,
} from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo, createContext, useContext } from "react";

const RefreshKeyContext = createContext<{ refreshKey: number }>({
  refreshKey: 0,
});

export const useRefreshKey = () => useContext(RefreshKeyContext);

export const Route = createFileRoute("/(dashboard)")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const matches = useMatches();

  useEffect(() => {
    if (!isPending && !session?.session) {
      navigate({ to: "/login", replace: true });
    }
  }, [session, isPending, navigate]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const currentPageName = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    const pathname = lastMatch?.pathname || "/";
    if (pathname === "/") return "Home";
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
      : "Dashboard";
  }, [matches]);

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3 flex-1">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <RefreshKeyContext.Provider value={{ refreshKey }}>
            <Outlet />
          </RefreshKeyContext.Provider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
