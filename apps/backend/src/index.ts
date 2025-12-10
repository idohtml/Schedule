import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import { betterAuth } from "./middleware/auth.js";
import { userRoutes } from "./routes/user.js";
import { scheduleRoutes } from "./routes/schedule.js";

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .use(betterAuth)
  .use(userRoutes)
  .use(scheduleRoutes)
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
