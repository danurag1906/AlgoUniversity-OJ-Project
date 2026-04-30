import "./env.js";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { initAuth, getAuth } from "./lib/auth.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import questionRoutes from "./routes/question.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import runRoutes from "./routes/run.routes.js";
import rateLimit from "express-rate-limit";

/**
 * Express app bootstrap.
 *
 * High-level responsibilities:
 * - Load env + apply DNS workaround (via `./env.js`)
 * - Connect to MongoDB (native driver + Mongoose)
 * - Initialize `better-auth` (depends on DB connection)
 * - Set up middleware: CORS, JSON parsing, rate limiting
 * - Mount routers under `/api/*`
 *
 * Example:
 * - Health check: `curl http://localhost:3001/api/health`
 * - Questions list: `curl "http://localhost:3001/api/questions?difficulty=Easy&tags=DP,Graph&search=two"`
 */
const app = express();
const PORT = Number(process.env.PORT) || 3001;

// IMPORTANT ORDERING:
// - `connectDB()` must run before `initAuth()` because `better-auth` uses `getDb()`,
//   and `getDb()` throws if the database isn't initialized.
await connectDB();
initAuth();

// Rate limiting
// This limiter is applied to all `/api/*` routes to reduce abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { error: "Too many requests from this IP, please try again later." },
});

// Stricter limiter specifically for endpoints that execute user code.
// This protects CPU/memory by limiting how often an IP can invoke the judge.
const executeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 submissions/runs per 5 minutes
  message: { error: "Too many code executions, calm down and try again later." },
});

// Allow the frontend origin to make cross-origin requests and send cookies (sessions).
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

/**
 * Auth routes are owned by `better-auth`.
 *
 * This forwards *any* request under `/api/auth/*` to better-auth's request handler.
 * The backend does not implement login/logout endpoints itself.
 *
 * Example (exact endpoints depend on better-auth configuration/version):
 * - `GET /api/auth/session` (commonly used to read current session)
 * - OAuth flows under `/api/auth/sign-in/*`
 */
app.all("/api/auth/*", toNodeHandler(getAuth()));

// Parse JSON bodies for all non-multipart endpoints.
app.use(express.json());

// Apply general API limiter for everything under `/api/*`.
app.use("/api/", apiLimiter);

// Simple liveness check used by deployments / local dev.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Route mounting (see files under `src/routes/*` for per-endpoint behavior).
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", questionRoutes);

// Execution endpoints also get the stricter limiter.
app.use("/api/submissions", executeLimiter, submissionRoutes);
app.use("/api/run", executeLimiter, runRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
