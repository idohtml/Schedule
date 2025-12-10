import { betterAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { schedule as scheduleTable } from "../db/schema/index.js";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

// Helper function to calculate total hours from start and end time
function calculateTotalHours(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  let diffMinutes = endTotalMinutes - startTotalMinutes;

  // Handle overnight shifts (end time is next day)
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Add 24 hours
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const totalHours = hours + minutes / 60;

  return totalHours.toFixed(2);
}

// Extend from the middleware to get auth macro types
export const scheduleRoutes = betterAuth.group("/api/schedule", (app) =>
  app
    // GET /api/schedule - Get all schedule entries for the current user (protected)
    .get(
      "/",
      async ({ user, query, status }) => {
        if (!user) {
          return status(401);
        }

        const { startDate, endDate } = query as {
          startDate?: string;
          endDate?: string;
        };

        const conditions = [eq(scheduleTable.userId, user.id)];

        if (startDate) {
          conditions.push(gte(scheduleTable.date, new Date(startDate)));
        }

        if (endDate) {
          conditions.push(lte(scheduleTable.date, new Date(endDate)));
        }

        const schedules = await db
          .select()
          .from(scheduleTable)
          .where(and(...conditions))
          .orderBy(desc(scheduleTable.date), desc(scheduleTable.startTime));

        return {
          success: true,
          data: schedules,
        };
      },
      {
        auth: true,
      }
    )
    // GET /api/schedule/:id - Get a specific schedule entry (protected)
    .get(
      "/:id",
      async ({ user, params, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;

        const scheduleEntry = await db
          .select()
          .from(scheduleTable)
          .where(
            and(eq(scheduleTable.id, id), eq(scheduleTable.userId, user.id))
          )
          .limit(1);

        if (scheduleEntry.length === 0) {
          return status(404, { error: "Schedule entry not found" });
        }

        return {
          success: true,
          data: scheduleEntry[0],
        };
      },
      {
        auth: true,
      }
    )
    // POST /api/schedule - Create a new schedule entry (protected)
    .post(
      "/",
      async ({ user, body, status }) => {
        if (!user) {
          return status(401);
        }

        const { date, startTime, endTime, notes } = body as {
          date: string;
          startTime: string;
          endTime: string;
          notes?: string;
        };

        if (!date || !startTime || !endTime) {
          return status(400, {
            error: "Missing required fields: date, startTime, endTime",
          });
        }

        const totalHours = calculateTotalHours(startTime, endTime);
        const id = randomBytes(16).toString("hex");

        const newSchedule = await db
          .insert(scheduleTable)
          .values({
            id,
            userId: user.id,
            date: new Date(date),
            startTime,
            endTime,
            totalHours,
            notes: notes || null,
          })
          .returning();

        return {
          success: true,
          data: newSchedule[0],
        };
      },
      {
        auth: true,
      }
    )
    // PUT /api/schedule/:id - Update a schedule entry (protected)
    .put(
      "/:id",
      async ({ user, params, body, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;
        const { date, startTime, endTime, notes } = body as {
          date?: string;
          startTime?: string;
          endTime?: string;
          notes?: string;
        };

        // Check if schedule exists and belongs to user
        const existingSchedule = await db
          .select()
          .from(scheduleTable)
          .where(
            and(eq(scheduleTable.id, id), eq(scheduleTable.userId, user.id))
          )
          .limit(1);

        if (existingSchedule.length === 0) {
          return status(404, { error: "Schedule entry not found" });
        }

        const updateData: {
          date?: Date;
          startTime?: string;
          endTime?: string;
          totalHours?: string;
          notes?: string | null;
          updatedAt: Date;
        } = {
          updatedAt: new Date(),
        };

        if (date) {
          updateData.date = new Date(date);
        }

        if (startTime || endTime) {
          const finalStartTime = startTime || existingSchedule[0].startTime;
          const finalEndTime = endTime || existingSchedule[0].endTime;
          updateData.startTime = finalStartTime;
          updateData.endTime = finalEndTime;
          updateData.totalHours = calculateTotalHours(
            finalStartTime,
            finalEndTime
          );
        }

        if (notes !== undefined) {
          updateData.notes = notes || null;
        }

        const updatedSchedule = await db
          .update(scheduleTable)
          .set(updateData)
          .where(eq(scheduleTable.id, id))
          .returning();

        return {
          success: true,
          data: updatedSchedule[0],
        };
      },
      {
        auth: true,
      }
    )
    // DELETE /api/schedule/:id - Delete a schedule entry (protected)
    .delete(
      "/:id",
      async ({ user, params, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;

        // Check if schedule exists and belongs to user
        const existingSchedule = await db
          .select()
          .from(scheduleTable)
          .where(
            and(eq(scheduleTable.id, id), eq(scheduleTable.userId, user.id))
          )
          .limit(1);

        if (existingSchedule.length === 0) {
          return status(404, { error: "Schedule entry not found" });
        }

        await db
          .delete(scheduleTable)
          .where(eq(scheduleTable.id, id));

        return {
          success: true,
          message: "Schedule entry deleted successfully",
        };
      },
      {
        auth: true,
      }
    )
    // GET /api/schedule/stats/totals - Get aggregated totals (protected)
    .get(
      "/stats/totals",
      async ({ user, query, status }) => {
        if (!user) {
          return status(401);
        }

        const { period } = query as { period?: "day" | "week" | "month" };

        let startDate: Date;
        const endDate = new Date();

        switch (period) {
          case "day":
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            startDate = new Date();
            startDate.setDate(startDate.getDate() - startDate.getDay());
            startDate.setHours(0, 0, 0, 0);
            break;
          case "month":
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            break;
          default:
            // Default to all time
            startDate = new Date(0);
        }

        const totals = await db
          .select({
            totalHours: sql<string>`SUM(${scheduleTable.totalHours})::numeric`,
            entryCount: sql<number>`COUNT(*)::int`,
          })
          .from(scheduleTable)
          .where(
            and(
              eq(scheduleTable.userId, user.id),
              gte(scheduleTable.date, startDate),
              lte(scheduleTable.date, endDate)
            )
          );

        return {
          success: true,
          data: {
            totalHours: totals[0]?.totalHours || "0.00",
            entryCount: totals[0]?.entryCount || 0,
            period: period || "all",
          },
        };
      },
      {
        auth: true,
      }
    )
);

