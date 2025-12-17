import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import { betterAuth } from "./middleware/auth.js";
import { userRoutes } from "./routes/user.js";
import { scheduleRoutes } from "./routes/schedule.js";
import { projectRoutes } from "./routes/project.js";
import { settingsRoutes } from "./routes/settings.js";

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: [
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, // localhost on any port
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/, // local network IPs on port 5173
        (request) => {
          const origin = request.headers.get("origin");
          return origin
            ? process.env.CORS_ORIGINS?.split(",")
                .map((o) => o.trim())
                .includes(origin) ?? false
            : true;
        },
      ],
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
  .use(projectRoutes)
  .use(settingsRoutes)
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
