import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { executeCode, type TestCaseInput } from "../services/codeExecutor.js";
import Question from "../models/Question.js";

const router = Router();

// All run routes require authentication
router.use(requireAuth);

// POST /api/run — Run code against sample test case only
// Example:
// curl -X POST http://localhost:3001/api/run \
//   -H "content-type: application/json" \
//   --data '{"questionId":"...","language":"python","code":"print(input())"}'
router.post("/", async (req: Request, res: Response) => {
  try {
    const { questionId, language, code } = req.body;

    if (!questionId || !language || !code) {
      res
        .status(400)
        .json({ error: "questionId, language, and code are required" });
      return;
    }

    const validLanguages = ["cpp", "java", "python"];
    if (!validLanguages.includes(language)) {
      res
        .status(400)
        .json({ error: "language must be one of: cpp, java, python" });
      return;
    }

    // Fetch the question to get sample test case
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    if (!question.sampleInput && !question.sampleOutput) {
      res.status(400).json({ error: "No sample test case available" });
      return;
    }

    // Build the test case from sample input/output
    const testCases: TestCaseInput[] = [
      {
        input: question.sampleInput || "",
        expectedOutput: question.sampleOutput || "",
      },
    ];

    // Execute the code
    // This runs code locally using OS child processes (see `src/services/codeExecutor.ts`).
    const result = await executeCode(language, code, testCases);

    res.json({ result });
  } catch (error) {
    console.error("Error running code:", error);
    res.status(500).json({ error: "Failed to run code" });
  }
});

export default router;
