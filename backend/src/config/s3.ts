import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client;

/**
 * Lazily initializes and returns a singleton S3 client.
 *
 * Why singleton:
 * - Creating AWS clients per request is unnecessary overhead.
 * - Reusing a single instance is the recommended pattern.
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        // These are read from env. If missing, AWS SDK will throw at request time.
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

/**
 * Reads and validates the bucket name.
 *
 * Routes that upload/download testcases call this first so misconfiguration
 * fails fast (instead of producing confusing AWS errors later).
 */
export function getS3Bucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET is not defined in environment variables.");
  return bucket;
}
