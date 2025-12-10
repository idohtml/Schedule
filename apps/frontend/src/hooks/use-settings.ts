import { useState, useEffect } from "react";

interface Settings {
  hourlyRate: number;
  taxRate: number;
  monthlyGoalHours: number;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

const defaultSettings: Settings = {
  hourlyRate: 147,
  taxRate: 0.3,
  monthlyGoalHours: 160,
  dateFormat: "en-US",
  timeFormat: "24h",
  timezone: "Europe/Stockholm",
  notificationsEnabled: true,
  emailNotifications: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/settings", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setSettings({
          hourlyRate: parseFloat(data.hourlyRate || "147"),
          taxRate: parseFloat(data.taxRate || "0.3"),
          monthlyGoalHours: parseFloat(data.monthlyGoalHours || "160"),
          dateFormat: data.dateFormat || "en-US",
          timeFormat: data.timeFormat || "24h",
          timezone: data.timezone || "Europe/Stockholm",
          notificationsEnabled: data.notificationsEnabled ?? true,
          emailNotifications: data.emailNotifications ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use default settings on error
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading, refetch: fetchSettings };
}
