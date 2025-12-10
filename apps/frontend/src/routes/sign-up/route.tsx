import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <h1>
        WOOOPS! Currently there is no sign up functionality. Please use the
        login page to sign up.
      </h1>
    </div>
  );
}
