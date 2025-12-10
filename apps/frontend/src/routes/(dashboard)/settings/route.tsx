import { createFileRoute } from "@tanstack/react-router";
import SettingsForm from "./settings-form";

export const Route = createFileRoute("/(dashboard)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SettingsForm />;
}
