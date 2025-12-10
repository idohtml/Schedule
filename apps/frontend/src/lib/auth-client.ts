import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Your backend URL
  fetchOptions: {
    credentials: "include", // Important for cookies
  },
});

export const { signIn, signUp, useSession } = authClient;
