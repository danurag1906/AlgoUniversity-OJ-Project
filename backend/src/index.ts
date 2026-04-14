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

const app = express();
const PORT = Number(process.env.PORT) || 3001;

await connectDB();
initAuth();

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  message: { error: "Too many requests from this IP, please try again later." },
});

const executeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 submissions/runs per 5 minutes
  message: { error: "Too many code executions, calm down and try again later." },
});

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.all("/api/auth/*", toNodeHandler(getAuth()));
app.use(express.json());

app.use("/api/", apiLimiter);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/submissions", executeLimiter, submissionRoutes);
app.use("/api/run", executeLimiter, runRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

