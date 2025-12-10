import { betterAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { user as userTable } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

// Extend from the middleware to get auth macro types
export const userRoutes = betterAuth.group("/api/user", (app) =>
  app
    // GET /api/user - Get current user (protected)
    .get(
      "/",
      ({ user, session }) => {
        return {
          user,
          session,
        };
      },
      {
        auth: true,
      }
    )
    // PUT /api/user - Update current user profile (protected)
    .put(
      "/",
      async ({ user, body, status }) => {
        if (!user) {
          return status(401);
        }

        const { name, image } = body as { name?: string; image?: string };

        const updatedUser = await db
          .update(userTable) // Use userTable instead of user
          .set({
            name: name || user.name,
            image: image || user.image,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, user.id)) // Use userTable.id and user.id
          .returning();

        return {
          success: true,
          user: updatedUser[0],
        };
      },
      {
        auth: true,
      }
    )
    // GET /api/user/:id - Get user by ID (public or protected)
    .get("/:id", async ({ params }) => {
      const { id } = params;
      const foundUser = await db
        .select()
        .from(userTable) // Use userTable
        .where(eq(userTable.id, id)) // Use userTable.id
        .limit(1);

      if (foundUser.length === 0) {
        return { error: "User not found" };
      }

      return foundUser[0];
    })
    // DELETE /api/user - Delete current user account (protected)
    .delete(
      "/",
      async ({ user, status }) => {
        if (!user) {
          return status(401);
        }

        await db.delete(userTable).where(eq(userTable.id, user.id)); // Use userTable

        return {
          success: true,
          message: "User deleted successfully",
        };
      },
      {
        auth: true,
      }
    )
);
