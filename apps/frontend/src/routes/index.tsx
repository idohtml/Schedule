import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return <div className="flex flex-col min-h-screen">Hello, World</div>;
}
