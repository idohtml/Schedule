import { createFileRoute } from "@tanstack/react-router";
import ProfileForm from "./profile-form";

export const Route = createFileRoute("/(dashboard)/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProfileForm />;
}
