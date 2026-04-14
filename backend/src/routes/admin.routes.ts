import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import adminQuestionRoutes from "./admin.question.routes.js";
import Question from "../models/Question.js";
import Submission from "../models/Submission.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/stats", async (_req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    res.json({
      message: "Admin stats endpoint",
      stats: {
        totalQuestions,
        totalSubmissions,
      },
    });
  } catch {
    res.json({
      message: "Admin stats endpoint",
      stats: {
        totalQuestions: 0,
        totalSubmissions: 0,
      },
    });
  }
});

router.get("/me", (req, res) => {
  res.json({ user: req.user });
});

// Mount question management routes
router.use("/questions", adminQuestionRoutes);

export default router;
