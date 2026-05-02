import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

/**
 * Returns the native MongoDB driver `Db` instance.
 *
 * This is used by `better-auth` via `mongodbAdapter(getDb())`.
 * It is intentionally separate from Mongoose, because `better-auth` expects
 * a native driver DB handle (not a Mongoose connection).
 */
export function getDb(): Db {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

/**
 * Connects to MongoDB using TWO layers:
 *
 * 1) Native driver (`MongoClient`) so we can pass a `Db` object to better-auth.
 * 2) Mongoose (`mongoose.connect`) so the app can use Mongoose models.
 *
 * Promise flow:
 * - validate env var
 * - `await client.connect()` (native driver connection)
 * - `db = client.db()` (native DB handle)
 * - `await mongoose.connect(uri)` (Mongoose connection)
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables.");

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  await mongoose.connect(uri);

  console.log("MongoDB connected");
}

/**
 * Gracefully disconnects both:
 * - the native driver client
 * - the Mongoose connection
 *
 * Useful for tests or clean shutdown.
 */
export async function disconnectDB(): Promise<void> {
  await client?.close();
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}
