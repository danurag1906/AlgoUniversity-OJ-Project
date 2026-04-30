import { Router, Request, Response } from "express";
import multer from "multer";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getS3Bucket } from "../config/s3.js";
import Question from "../models/Question.js";

const router = Router();

// Configure multer for zip file uploads
// - Uses memory storage so we can directly send the buffer to S3 (no local disk writes).
// - Size limit prevents very large uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    // Accept only zip files
    // Note: some browsers use `application/octet-stream` for unknown types,
    // so we also allow `.zip` by filename suffix.
    const allowedMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ];
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed for test cases"));
    }
  },
});

// POST /api/admin/questions — Create a new question
// Example:
// curl -X POST http://localhost:3001/api/admin/questions \
//   -H "content-type: application/json" \
//   --data '{"title":"Two Sum","description":"...","difficulty":"Easy","tags":["Array"],"sampleInput":"...","sampleOutput":"..."}'
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      sampleInput,
      sampleOutput,
      constraints,
    } = req.body;

    if (!title || !description || !difficulty) {
      res
        .status(400)
        .json({ error: "title, description, and difficulty are required" });
      return;
    }

    // Persist the question. `createdBy` uses the authenticated admin user's id.
    const question = await Question.create({
      title,
      description,
      difficulty,
      tags: tags || [],
      sampleInput: sampleInput || "",
      sampleOutput: sampleOutput || "",
      constraints: constraints || "",
      createdBy: req.user!.id,
    });

    res.status(201).json({ question });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
});

// PUT /api/admin/questions/:id — Update a question
// Partial update: only fields present in the request body are written.
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      difficulty,
      tags,
      sampleInput,
      sampleOutput,
      constraints,
    } = req.body;

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        // Conditional spreads avoid overwriting fields with `undefined`.
        ...(title && { title }),
        ...(description && { description }),
        ...(difficulty && { difficulty }),
        ...(tags && { tags }),
        ...(sampleInput !== undefined && { sampleInput }),
        ...(sampleOutput !== undefined && { sampleOutput }),
        ...(constraints !== undefined && { constraints }),
      },
      { new: true }
    );

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    res.json({ question });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// DELETE /api/admin/questions/:id — Delete a question
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    // If there are test cases in S3, delete them
    if (question.s3TestCaseKey) {
      try {
        const s3 = getS3Client();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: getS3Bucket(),
            Key: question.s3TestCaseKey,
          })
        );
      } catch (s3Error) {
        // S3 deletion is best-effort. If it fails, still delete the DB record.
        console.error(
          "Failed to delete S3 test cases, continuing with DB deletion:",
          s3Error
        );
      }
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// POST /api/admin/questions/:id/testcases — Upload test cases zip to S3
// Expected zip file format (by convention, used when grading submissions):
// - input1.txt + output1.txt
// - input2.txt + output2.txt
// - ...
// Folders inside the zip are allowed; pairing is based on filename basename.
router.post(
  "/:id/testcases",
  upload.single("testcases"),
  async (req: Request, res: Response) => {
    try {
      const question = await Question.findById(req.params.id);

      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      if (!req.file) {
        res
          .status(400)
          .json({ error: "No file uploaded. Please upload a .zip file." });
        return;
      }

      const s3 = getS3Client();
      const bucket = getS3Bucket();
      // Deterministic key structure: groups testcases by question id.
      const key = `testcases/${question._id}/${req.file.originalname}`;

      // Delete old test case file from S3 if it exists
      if (question.s3TestCaseKey) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: question.s3TestCaseKey,
            })
          );
        } catch {
          // Ignore — old file may not exist
        }
      }

      // Upload new file to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // Update the question with the S3 key
      question.s3TestCaseKey = key;
      question.testCaseFileName = req.file.originalname;
      await question.save();

      res.json({
        message: "Test cases uploaded successfully",
        testCaseFileName: req.file.originalname,
        // s3Key: key,
      });
    } catch (error) {
      console.error("Error uploading test cases:", error);
      res.status(500).json({ error: "Failed to upload test cases" });
    }
  }
);

export default router;
