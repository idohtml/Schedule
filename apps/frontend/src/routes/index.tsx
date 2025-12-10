import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";
import { AppSidebar } from "@/components/app-sidebar";
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

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Protect the route - show login message if not authenticated
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
            <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground">Widget 1</span>
            </div>
            <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground">Widget 2</span>
            </div>
            <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
              <span className="text-muted-foreground">Widget 3</span>
            </div>
          </div>
          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min flex items-center justify-center">
            <span className="text-muted-foreground">Main Content Area</span>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
