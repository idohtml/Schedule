import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";

// Get trusted origins - allow localhost and common development IPs
const getTrustedOrigins = () => {
  const origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL || "http://localhost:5173",
  ];

  // Add environment variable origins if provided
  if (process.env.CORS_ORIGINS) {
    origins.push(
      ...process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    );
  }

  return origins;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
      }/api/auth/callback/google`,
    },
  },
});
