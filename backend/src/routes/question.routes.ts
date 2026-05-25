import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Question from "../models/Question.js";

const router = Router();

// Escapes special regex characters in a user-supplied string.
// Prevents ReDoS: without this, a search like ".*.*.*.*" would cause
// catastrophic backtracking in the MongoDB regex engine.
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];

// GET /api/questions — List all questions (public, supports filtering)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { difficulty, tags, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (difficulty && typeof difficulty === "string") {
      // Whitelist difficulty values — rejects anything outside the enum.
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        res.status(400).json({ error: "difficulty must be Easy, Medium, or Hard" });
        return;
      }
      filter.difficulty = difficulty;
    }

    if (tags && typeof tags === "string") {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
      filter.tags = { $in: tagList };
    }

    if (search && typeof search === "string") {
      if (search.length > 100) {
        res.status(400).json({ error: "search query too long (max 100 chars)" });
        return;
      }
      // Escape user input before using it as a regex to prevent ReDoS.
      filter.title = { $regex: escapeRegex(search), $options: "i" };
    }

    const questions = await Question.find(filter)
      .select("title difficulty tags createdAt")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// GET /api/questions/:id — Single question detail (public)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: "Invalid question ID" });
      return;
    }

    const question = await Question.findById(req.params.id)
      .select("-s3TestCaseKey -testCaseFileName -createdBy -__v");

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
