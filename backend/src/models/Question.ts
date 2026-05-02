import mongoose, { Document, Schema } from "mongoose";

/**
 * Question schema (an OJ problem).
 *
 * Notes:
 * - `sampleInput` / `sampleOutput` are used by `/api/run` and as a fallback testcase
 *   when S3 testcases are missing/unavailable.
 * - `s3TestCaseKey` / `testCaseFileName` point to a `.zip` uploaded by admins.
 * - `createdBy` records the admin user id that created the question.
 */
export interface IQuestion extends Document {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
  s3TestCaseKey: string;
  testCaseFileName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    sampleInput: {
      type: String,
      default: "",
    },
    sampleOutput: {
      type: String,
      default: "",
    },
    constraints: {
      type: String,
      default: "",
    },
    s3TestCaseKey: {
      type: String,
      default: "",
    },
    testCaseFileName: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient tag-based and difficulty-based filtering
// Used by `GET /api/questions?tags=...&difficulty=...`.
questionSchema.index({ tags: 1 });
questionSchema.index({ difficulty: 1 });

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;
