import "./env.js";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { initAuth, getAuth } from "./lib/auth.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

await connectDB();
initAuth();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.all("/api/auth/*", toNodeHandler(getAuth()));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
