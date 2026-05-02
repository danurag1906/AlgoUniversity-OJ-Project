import { Router, Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import AdmZip from "adm-zip";
import { requireAuth } from "../middleware/requireAuth.js";
import { executeCode, type TestCaseInput } from "../services/codeExecutor.js";
import { getS3Client, getS3Bucket } from "../config/s3.js";
import Submission from "../models/Submission.js";
import Question from "../models/Question.js";

const router = Router();

// All submission routes require authentication
router.use(requireAuth);

// Helper: Download test cases zip from S3 and extract input/output pairs
/**
 * Downloads a testcase `.zip` from S3 and extracts test cases by filename convention.
 *
 * Expected files (any folder nesting is allowed):
 * - `input1.txt` and `output1.txt`
 * - `input2.txt` and `output2.txt`
 * - ...
 *
 * Promise flow:
 * - `await s3.send(GetObjectCommand)` returns a response with a streaming Body.
 * - `for await (const chunk of bodyStream)` consumes the stream into a Buffer.
 * - `adm-zip` parses the in-memory zip.
 */
async function getTestCasesFromS3(s3Key: string): Promise<TestCaseInput[]> {
  const s3 = getS3Client();
  const bucket = getS3Bucket();

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    })
  );

  // Read the S3 object into a buffer
  const bodyStream = response.Body;
  if (!bodyStream) throw new Error("Empty response from S3");

  const chunks: Uint8Array[] = [];
  // @ts-expect-error — S3 body is a readable stream
  for await (const chunk of bodyStream) {
    chunks.push(chunk);
  }
  const zipBuffer = Buffer.concat(chunks);

  // Extract the zip
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  // Find all input/output pairs (input1.txt <-> output1.txt)
  const inputFiles = new Map<number, string>();
  const outputFiles = new Map<number, string>();

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    const fileName = entry.entryName.split("/").pop() || "";
    const inputMatch = fileName.match(/^input(\d+)\.txt$/);
    const outputMatch = fileName.match(/^output(\d+)\.txt$/);

    if (inputMatch) {
      inputFiles.set(parseInt(inputMatch[1]), entry.getData().toString("utf-8"));
    }
    if (outputMatch) {
      outputFiles.set(parseInt(outputMatch[1]), entry.getData().toString("utf-8"));
    }
  }

  // Pair them up in order
  const testCases: TestCaseInput[] = [];
  const testCaseNumbers = [...inputFiles.keys()].sort((a, b) => a - b);

  for (const num of testCaseNumbers) {
    const input = inputFiles.get(num);
    const output = outputFiles.get(num);
    if (input !== undefined && output !== undefined) {
      testCases.push({
        input,
        expectedOutput: output,
      });
    }
  }

  return testCases;
}

// POST /api/submissions — Submit code, execute against ALL test cases, save result
// Example:
// curl -X POST http://localhost:3001/api/submissions \
//   -H "content-type: application/json" \
//   --data '{"questionId":"...","language":"cpp","code":"#include <bits/stdc++.h>\\nint main(){...}"}'
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

    // Fetch the question
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    // Get test cases: from S3 if available, otherwise fall back to sample
    let testCases: TestCaseInput[] = [];

    if (question.s3TestCaseKey) {
      try {
        testCases = await getTestCasesFromS3(question.s3TestCaseKey);
      } catch (s3Error) {
        console.error("Failed to fetch test cases from S3:", s3Error);
        // Fall back to sample test case
      }
    }

    // If no S3 test cases, use the sample test case
    if (testCases.length === 0 && (question.sampleInput || question.sampleOutput)) {
      testCases.push({
        input: question.sampleInput || "",
        expectedOutput: question.sampleOutput || "",
      });
    }

    if (testCases.length === 0) {
      res.status(400).json({ error: "No test cases available for this question" });
      return;
    }

    // Execute the code against all test cases
    // This is CPU-bound and uses OS processes. It's rate-limited at the router mount.
    const executionResult = await executeCode(language, code, testCases);

    // Save the submission with the result
    const submission = await Submission.create({
      questionId,
      userId: req.user!.id,
      language,
      code,
      status: executionResult.overallStatus,
    });

    res.status(201).json({
      submission,
      result: executionResult,
    });
  } catch (error) {
    console.error("Error processing submission:", error);
    res.status(500).json({ error: "Failed to process submission" });
  }
});

// GET /api/submissions/me — Get current user's submissions
// Example:
// - `curl "http://localhost:3001/api/submissions/me?questionId=<QUESTION_ID>"`
router.get("/me", async (req: Request, res: Response) => {
  try {
    const { questionId } = req.query;

    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (questionId && typeof questionId === "string") {
      filter.questionId = questionId;
    }

    const submissions = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;
