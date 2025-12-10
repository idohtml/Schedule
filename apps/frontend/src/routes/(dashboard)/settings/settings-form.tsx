import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Settings {
  id: string;
  userId: string;
  hourlyRate: string;
  taxRate: string;
  monthlyGoalHours: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

export default function SettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState<Settings>({
    id: "",
    userId: "",
    hourlyRate: "147.00",
    taxRate: "0.30",
    monthlyGoalHours: "160.00",
    dateFormat: "en-US",
    timeFormat: "24h",
    timezone: "Europe/Stockholm",
    notificationsEnabled: true,
    emailNotifications: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsFetching(true);
      const response = await fetch("http://localhost:3000/api/settings", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const result = await response.json();
      if (result.success && result.data) {
        const settings = result.data;
        setFormData({
          id: settings.id || "",
          userId: settings.userId || "",
          hourlyRate: settings.hourlyRate || "147.00",
          taxRate: settings.taxRate || "0.30",
          monthlyGoalHours: settings.monthlyGoalHours || "160.00",
          dateFormat: settings.dateFormat || "en-US",
          timeFormat: settings.timeFormat || "24h",
          timezone: settings.timezone || "Europe/Stockholm",
          notificationsEnabled: settings.notificationsEnabled ?? true,
          emailNotifications: settings.emailNotifications ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          hourlyRate: parseFloat(formData.hourlyRate),
          taxRate: parseFloat(formData.taxRate),
          monthlyGoalHours: parseFloat(formData.monthlyGoalHours),
          dateFormat: formData.dateFormat,
          timeFormat: formData.timeFormat,
          timezone: formData.timezone,
          notificationsEnabled: formData.notificationsEnabled,
          emailNotifications: formData.emailNotifications,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update settings";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        toast.error("Failed to update settings");
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Settings updated successfully!");
        // Refresh the page to update widgets
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your application settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {/* Financial Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Financial Settings
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your hourly rate and tax information
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="hourlyRate">Hourly Rate (SEK)</FieldLabel>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  placeholder="147.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your hourly rate in Swedish Krona
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="taxRate">Tax Rate (%)</FieldLabel>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(parseFloat(formData.taxRate) * 100).toFixed(2)}
                  onChange={(e) => {
                    const percentage = parseFloat(e.target.value) / 100;
                    setFormData({
                      ...formData,
                      taxRate: percentage.toFixed(4),
                    });
                  }}
                  placeholder="30.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tax rate as a percentage (e.g., 30 for 30%)
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="monthlyGoalHours">
                  Monthly Goal Hours
                </FieldLabel>
                <Input
                  id="monthlyGoalHours"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyGoalHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyGoalHours: e.target.value,
                    })
                  }
                  placeholder="160.00"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Target hours to work per month
                </p>
              </Field>
            </div>

            <Separator />

            {/* Date & Time Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Date & Time Preferences
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how dates and times are displayed
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="dateFormat">Date Format</FieldLabel>
                <Select
                  value={formData.dateFormat}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dateFormat: value })
                  }
                >
                  <SelectTrigger id="dateFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">
                      English (US) - MM/DD/YYYY
                    </SelectItem>
                    <SelectItem value="sv-SE">Swedish - YYYY-MM-DD</SelectItem>
                    <SelectItem value="en-GB">
                      English (UK) - DD/MM/YYYY
                    </SelectItem>
                    <SelectItem value="de-DE">German - DD.MM.YYYY</SelectItem>
                    <SelectItem value="fr-FR">French - DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How dates are formatted throughout the application
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="timeFormat">Time Format</FieldLabel>
                <Select
                  value={formData.timeFormat}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timeFormat: value })
                  }
                >
                  <SelectTrigger id="timeFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How times are displayed
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <Input
                  id="timezone"
                  type="text"
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  placeholder="Europe/Stockholm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your timezone (e.g., Europe/Stockholm, America/New_York)
                </p>
              </Field>
            </div>

            <Separator />

            {/* Notification Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Notification Preferences
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage how you receive notifications
                </p>
              </div>

              <Field>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FieldLabel htmlFor="notificationsEnabled">
                      Enable Notifications
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Receive in-app notifications
                    </p>
                  </div>
                  <Switch
                    id="notificationsEnabled"
                    checked={formData.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notificationsEnabled: checked,
                      })
                    }
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FieldLabel htmlFor="emailNotifications">
                      Email Notifications
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        emailNotifications: checked,
                      })
                    }
                    disabled={!formData.notificationsEnabled}
                  />
                </div>
                {!formData.notificationsEnabled && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Enable notifications first to use email notifications
                  </p>
                )}
              </Field>
            </div>

            <Separator />

            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
