import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/stats", (_req, res) => {
  res.json({
    message: "Admin stats endpoint",
    stats: {
      totalUsers: 0,
      activeSessions: 0,
    },
  });
});

router.get("/me", (req, res) => {
  res.json({ user: req.user });
});

export default router;
