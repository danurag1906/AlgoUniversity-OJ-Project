import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { executeCode, type TestCaseInput } from "../services/codeExecutor.js";
import Question from "../models/Question.js";

const MAX_CODE_LENGTH = 65_536; // 64 KB — plenty for competitive programming

const router = Router();

// POST /api/run — Run code against sample test case only
// Example:
// curl -X POST http://localhost:3001/api/run \
//   -H "content-type: application/json" \
//   --data '{"questionId":"...","language":"python","code":"print(input())"}'
router.post("/", async (req: Request, res: Response) => {
  try {
    const { questionId, language, code, customInput } = req.body;

    if (!questionId || !language || !code) {
      res.status(400).json({ error: "questionId, language, and code are required" });
      return;
    }

    if (!mongoose.isValidObjectId(questionId)) {
      res.status(400).json({ error: "Invalid questionId" });
      return;
    }

    const validLanguages = ["cpp", "java", "python"];
    if (!validLanguages.includes(language)) {
      res.status(400).json({ error: "language must be one of: cpp, java, python" });
      return;
    }

    if (typeof code !== "string" || code.length > MAX_CODE_LENGTH) {
      res.status(400).json({ error: `Code too long (max ${MAX_CODE_LENGTH} characters)` });
      return;
    }

    if (customInput !== undefined && typeof customInput !== "string") {
      res.status(400).json({ error: "customInput must be a string" });
      return;
    }

    // Fetch the question to confirm it exists
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    let testCases: TestCaseInput[];

    if (typeof customInput === "string") {
      // Custom run: use the user-supplied input; no expected output to compare against
      testCases = [{ input: customInput, expectedOutput: "" }];
    } else {
      // Sample run: use the question's sample input/output
      if (!question.sampleInput && !question.sampleOutput) {
        res.status(400).json({ error: "No sample test case available" });
        return;
      }
      testCases = [
        {
          input: question.sampleInput || "",
          expectedOutput: question.sampleOutput || "",
        },
      ];
    }

    const result = await executeCode(language, code, testCases);

    res.json({ result });
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({ error: "Failed to run code" });
  }
});

export default router;
