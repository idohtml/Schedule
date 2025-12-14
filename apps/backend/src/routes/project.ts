import { betterAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import {
  project as projectTable,
  schedule as scheduleTable,
} from "../db/schema/index.js";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

// Extend from the middleware to get auth macro types
export const projectRoutes = betterAuth.group("/api/project", (app) =>
  app
    // GET /api/project - Get all projects for the current user (protected)
    .get(
      "/",
      async ({ user, status }) => {
        if (!user) {
          return status(401);
        }

        const projects = await db
          .select()
          .from(projectTable)
          .where(eq(projectTable.userId, user.id))
          .orderBy(projectTable.name);

        return {
          success: true,
          data: projects,
        };
      },
      {
        auth: true,
      }
    )
    // GET /api/project/:id - Get a specific project with total hours (protected)
    .get(
      "/:id",
      async ({ user, params, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;

        const project = await db
          .select()
          .from(projectTable)
          .where(and(eq(projectTable.id, id), eq(projectTable.userId, user.id)))
          .limit(1);

        if (project.length === 0) {
          return status(404, { error: "Project not found" });
        }

        // Get total hours for this project
        const totals = await db
          .select({
            totalHours: sql<string>`COALESCE(SUM(${scheduleTable.totalHours})::numeric, 0)`,
            entryCount: sql<number>`COUNT(*)::int`,
          })
          .from(scheduleTable)
          .where(
            and(
              eq(scheduleTable.userId, user.id),
              eq(scheduleTable.projectId, id)
            )
          );

        // Get all schedule entries for this project
        const schedules = await db
          .select()
          .from(scheduleTable)
          .where(
            and(
              eq(scheduleTable.userId, user.id),
              eq(scheduleTable.projectId, id)
            )
          )
          .orderBy(desc(scheduleTable.date), desc(scheduleTable.startTime));

        return {
          success: true,
          data: {
            ...project[0],
            totalHours: totals[0]?.totalHours || "0.00",
            entryCount: totals[0]?.entryCount || 0,
            schedules,
          },
        };
      },
      {
        auth: true,
      }
    )
    // POST /api/project - Create a new project (protected)
    .post(
      "/",
      async ({ user, body, status }) => {
        if (!user) {
          return status(401);
        }

        const { name, companyName, description, hourlyRate } = body as {
          name: string;
          companyName?: string;
          description?: string;
          hourlyRate?: number | string;
        };

        if (!name) {
          return status(400, {
            error: "Missing required field: name",
          });
        }

        const id = randomBytes(16).toString("hex");

        const newProject = await db
          .insert(projectTable)
          .values({
            id,
            userId: user.id,
            name,
            companyName: companyName || null,
            description: description || null,
            hourlyRate: hourlyRate ? hourlyRate.toString() : null,
          })
          .returning();

        return {
          success: true,
          data: newProject[0],
        };
      },
      {
        auth: true,
      }
    )
    // PUT /api/project/:id - Update a project (protected)
    .put(
      "/:id",
      async ({ user, params, body, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;
        const { name, companyName, description, hourlyRate } = body as {
          name?: string;
          companyName?: string;
          description?: string;
          hourlyRate?: number | string | null;
        };

        // Check if project exists and belongs to user
        const existingProject = await db
          .select()
          .from(projectTable)
          .where(and(eq(projectTable.id, id), eq(projectTable.userId, user.id)))
          .limit(1);

        if (existingProject.length === 0) {
          return status(404, { error: "Project not found" });
        }

        const updateData: {
          name?: string;
          companyName?: string | null;
          description?: string | null;
          hourlyRate?: string | null;
          updatedAt: Date;
        } = {
          updatedAt: new Date(),
        };

        if (name !== undefined) {
          updateData.name = name;
        }

        if (companyName !== undefined) {
          updateData.companyName = companyName || null;
        }

        if (description !== undefined) {
          updateData.description = description || null;
        }

        if (hourlyRate !== undefined) {
          updateData.hourlyRate = hourlyRate ? hourlyRate.toString() : null;
        }

        const updatedProject = await db
          .update(projectTable)
          .set(updateData)
          .where(eq(projectTable.id, id))
          .returning();

        return {
          success: true,
          data: updatedProject[0],
        };
      },
      {
        auth: true,
      }
    )
    // DELETE /api/project/:id - Delete a project (protected)
    .delete(
      "/:id",
      async ({ user, params, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;

        // Check if project exists and belongs to user
        const existingProject = await db
          .select()
          .from(projectTable)
          .where(and(eq(projectTable.id, id), eq(projectTable.userId, user.id)))
          .limit(1);

        if (existingProject.length === 0) {
          return status(404, { error: "Project not found" });
        }

        await db.delete(projectTable).where(eq(projectTable.id, id));

        return {
          success: true,
          message: "Project deleted successfully",
        };
      },
      {
        auth: true,
      }
    )
    // GET /api/project/:id/hours - Get hours breakdown for a project (protected)
    .get(
      "/:id/hours",
      async ({ user, params, query, status }) => {
        if (!user) {
          return status(401);
        }

        const { id } = params;
        const { period } = query as { period?: "month" | "all" };

        // Check if project exists and belongs to user
        const existingProject = await db
          .select()
          .from(projectTable)
          .where(and(eq(projectTable.id, id), eq(projectTable.userId, user.id)))
          .limit(1);

        if (existingProject.length === 0) {
          return status(404, { error: "Project not found" });
        }

        let startDate: Date | null = null;
        const endDate = new Date();

        if (period === "month") {
          startDate = new Date();
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
        }

        const conditions = [
          eq(scheduleTable.userId, user.id),
          eq(scheduleTable.projectId, id),
        ];

        if (startDate) {
          conditions.push(gte(scheduleTable.date, startDate));
        }

        const totals = await db
          .select({
            totalHours: sql<string>`COALESCE(SUM(${scheduleTable.totalHours})::numeric, 0)`,
            entryCount: sql<number>`COUNT(*)::int`,
          })
          .from(scheduleTable)
          .where(and(...conditions));

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
