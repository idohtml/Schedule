import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import openapi from "@elysiajs/openapi";
import cors from "@elysiajs/cors";
import { betterAuth } from "./middleware/auth.js";
import { userRoutes } from "./routes/user.js";
import { scheduleRoutes } from "./routes/schedule.js";
import { projectRoutes } from "./routes/project.js";
import { settingsRoutes } from "./routes/settings.js";

// Check if origin is allowed (for development, allow localhost and local network IPs)
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;

  // Allow localhost
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return true;
  }

  // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) on port 5173
  const localNetworkPattern =
    /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/;
  if (localNetworkPattern.test(origin)) {
    return true;
  }

  // Check environment variable
  if (process.env.CORS_ORIGINS) {
    const allowedOrigins = process.env.CORS_ORIGINS.split(",").map((o) =>
      o.trim()
    );
    return allowedOrigins.includes(origin);
  }

  return false;
};

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: (origin) => isOriginAllowed(origin),
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
