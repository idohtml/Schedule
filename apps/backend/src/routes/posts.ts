import { Elysia } from "elysia";
import { db } from "../db/index.js";
import { posts } from "../db/schema/index.js";

export const postsRoutes = new Elysia({ prefix: "/api/posts" }).get(
  "/",
  async () => {
    const allPosts = await db.select().from(posts);
    return allPosts;
  }
);
