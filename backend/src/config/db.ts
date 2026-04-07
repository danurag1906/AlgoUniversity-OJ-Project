import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

export function getDb(): Db {
  if (!db) throw new Error("Database not initialized. Call connectDB() first.");
  return db;
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables.");

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();

  await mongoose.connect(uri);

  console.log("MongoDB connected");
}

export async function disconnectDB(): Promise<void> {
  await client?.close();
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}
