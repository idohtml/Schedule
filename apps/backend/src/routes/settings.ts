import { betterAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { userSettings as userSettingsTable } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Extend from the middleware to get auth macro types
export const settingsRoutes = betterAuth.group("/api/settings", (app) =>
  app
    // GET /api/settings - Get current user settings (protected)
    .get(
      "/",
      async ({ user, status }) => {
        if (!user) {
          return status(401);
        }

        try {
          const settings = await db
            .select()
            .from(userSettingsTable)
            .where(eq(userSettingsTable.userId, user.id))
            .limit(1);

          // If no settings exist, create default settings
          if (settings.length === 0) {
            const defaultSettings = await db
              .insert(userSettingsTable)
              .values({
                id: randomBytes(16).toString("hex"),
                userId: user.id,
                hourlyRate: "147.00",
                taxRate: "0.3000",
                monthlyGoalHours: "160.00",
                dateFormat: "en-US",
                timeFormat: "24h",
                timezone: "Europe/Stockholm",
                notificationsEnabled: true,
                emailNotifications: false,
              })
              .returning();

            return {
              success: true,
              data: defaultSettings[0],
            };
          }

          return {
            success: true,
            data: settings[0],
          };
        } catch (error) {
          console.error("Error fetching settings:", error);
          return status(500, {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch settings",
          });
        }
      },
      {
        auth: true,
      }
    )
    // PUT /api/settings - Update current user settings (protected)
    .put(
      "/",
      async ({ user, body, status }) => {
        if (!user) {
          return status(401);
        }

        try {
          const {
            hourlyRate,
            taxRate,
            monthlyGoalHours,
            dateFormat,
            timeFormat,
            timezone,
            notificationsEnabled,
            emailNotifications,
          } = body as {
            hourlyRate?: number | string;
            taxRate?: number | string;
            monthlyGoalHours?: number | string;
            dateFormat?: string;
            timeFormat?: string;
            timezone?: string;
            notificationsEnabled?: boolean;
            emailNotifications?: boolean;
          };

          // Check if settings exist
          const existingSettings = await db
            .select()
            .from(userSettingsTable)
            .where(eq(userSettingsTable.userId, user.id))
            .limit(1);

          let updatedSettings;

          if (existingSettings.length === 0) {
            // Create new settings
            updatedSettings = await db
              .insert(userSettingsTable)
              .values({
                id: randomBytes(16).toString("hex"),
                userId: user.id,
                hourlyRate: hourlyRate?.toString() || "147.00",
                taxRate: taxRate?.toString() || "0.3000",
                monthlyGoalHours: monthlyGoalHours?.toString() || "160.00",
                dateFormat: dateFormat || "en-US",
                timeFormat: timeFormat || "24h",
                timezone: timezone || "Europe/Stockholm",
                notificationsEnabled: notificationsEnabled ?? true,
                emailNotifications: emailNotifications ?? false,
              })
              .returning();
          } else {
            // Update existing settings
            const updateData: Partial<typeof userSettingsTable.$inferInsert> = {
              updatedAt: new Date(),
            };

            if (hourlyRate !== undefined) {
              updateData.hourlyRate = hourlyRate.toString();
            }
            if (taxRate !== undefined) {
              updateData.taxRate = taxRate.toString();
            }
            if (monthlyGoalHours !== undefined) {
              updateData.monthlyGoalHours = monthlyGoalHours.toString();
            }
            if (dateFormat !== undefined) {
              updateData.dateFormat = dateFormat;
            }
            if (timeFormat !== undefined) {
              updateData.timeFormat = timeFormat;
            }
            if (timezone !== undefined) {
              updateData.timezone = timezone;
            }
            if (notificationsEnabled !== undefined) {
              updateData.notificationsEnabled = notificationsEnabled;
            }
            if (emailNotifications !== undefined) {
              updateData.emailNotifications = emailNotifications;
            }

            updatedSettings = await db
              .update(userSettingsTable)
              .set(updateData)
              .where(eq(userSettingsTable.userId, user.id))
              .returning();
          }

          return {
            success: true,
            data: updatedSettings[0],
          };
        } catch (error) {
          console.error("Error updating settings:", error);
          return status(500, {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update settings",
          });
        }
      },
      {
        auth: true,
      }
    )
);
