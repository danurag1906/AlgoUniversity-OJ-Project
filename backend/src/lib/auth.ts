import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { getDb } from "../config/db.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any;

/**
 * Initializes the `better-auth` singleton.
 *
 * IMPORTANT: This must be called AFTER `connectDB()` because it calls `getDb()`.
 *
 * Auth routes:
 * - In `src/index.ts`, `/api/auth/*` is forwarded to `toNodeHandler(getAuth())`.
 *
 * Session usage:
 * - `requireAuth` calls `getAuth().api.getSession({ headers })` to resolve the current user.
 */
export function initAuth() {
  _auth = betterAuth({
    database: mongodbAdapter(getDb()),
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    // The admin plugin enables admin capabilities/fields handled internally by better-auth.
    plugins: [admin()],
  });
}

/**
 * Returns the initialized auth instance.
 * Throws if `initAuth()` hasn't been called yet (startup ordering bug).
 */
export function getAuth() {
  if (!_auth) throw new Error("Auth not initialized. Call initAuth() first.");
  return _auth;
}
