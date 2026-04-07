import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { getDb } from "../config/db.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any;

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
    plugins: [admin()],
  });
}

export function getAuth() {
  if (!_auth) throw new Error("Auth not initialized. Call initAuth() first.");
  return _auth;
}
