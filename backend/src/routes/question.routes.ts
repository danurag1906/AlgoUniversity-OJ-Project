import { Router, Request, Response } from "express";
import Question from "../models/Question.js";

const router = Router();

/**
 * Public questions routes (no auth required).
 *
 * API examples:
 * - List: `curl "http://localhost:3001/api/questions?difficulty=Easy&tags=DP,Graph&search=two"`
 * - Detail: `curl http://localhost:3001/api/questions/<QUESTION_ID>`
 */

// GET /api/questions — List all questions (public, supports filtering)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { difficulty, tags, search } = req.query;

    // Build the filter object
    const filter: Record<string, unknown> = {};

    if (difficulty && typeof difficulty === "string") {
      filter.difficulty = difficulty;
    }

    if (tags && typeof tags === "string") {
      // tags can be comma-separated: "DP,Graph"
      const tagList = tags.split(",").map((tag) => tag.trim());
      filter.tags = { $in: tagList };
    }

    if (search && typeof search === "string") {
      // Case-insensitive title match.
      filter.title = { $regex: search, $options: "i" };
    }

    const questions = await Question.find(filter)
      .select("title difficulty tags createdAt")
      .sort({ createdAt: -1 });

    res.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// GET /api/questions/:id — Single question detail (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Hide internal S3 key so clients can't see storage implementation details.
    const question = await Question.findById(req.params.id).select(
      "-s3TestCaseKey"
    );

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    res.json({ question });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

export default router;
