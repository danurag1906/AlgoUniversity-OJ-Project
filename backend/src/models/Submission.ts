import mongoose, { Document, Schema } from "mongoose";

/**
 * Submission schema (a persisted judge run).
 *
 * This is created by `POST /api/submissions` after code is executed.
 * It stores:
 * - the user's code + language
 * - which question it was for
 * - the rolled-up verdict (`status`)
 */
export interface ISubmission extends Document {
  questionId: mongoose.Types.ObjectId;
  userId: string;
  language: "cpp" | "java" | "python";
  code: string;
  status: "Pending" | "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded";
  createdAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["cpp", "java", "python"],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ userId: 1 });
submissionSchema.index({ questionId: 1 });

const Submission = mongoose.model<ISubmission>("Submission", submissionSchema);

export default Submission;
