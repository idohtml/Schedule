import { createAuthClient } from "better-auth/react";

// Detect API URL: use environment variable, or detect from current hostname
const getApiUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // For development: detect hostname and use port 3000
  // This works for both localhost and mobile access (e.g., 192.168.x.x:5173 -> 192.168.x.x:3000)
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // If accessing via localhost, use localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  // Otherwise use the same hostname with port 3000
  return `${protocol}//${hostname}:3000`;
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  fetchOptions: {
    credentials: "include", // Important for cookies
  },
});

export const { signIn, signUp, useSession } = authClient;
