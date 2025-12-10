import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "../lib/auth-client";

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
          {/* You can add a login button/link here when you create a login route */}
        </div>
      </div>
    );
  }

  // User is authenticated - show protected content
  return (
    <div className="flex flex-col min-h-screen">
      <div>Hello, {session.user?.name || session.user?.email || "World"}</div>
    </div>
  );
}
