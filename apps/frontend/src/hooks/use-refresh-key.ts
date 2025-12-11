import { useContext } from "react";
import { RefreshKeyContext } from "@/routes/(dashboard)/route";

export const useRefreshKey = () => {
  const context = useContext(RefreshKeyContext);
  if (!context) {
    throw new Error("useRefreshKey must be used within DashboardLayout");
  }
  return context;
};
