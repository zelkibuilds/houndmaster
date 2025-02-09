import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

if (!process.env.DATABASE_PATH) {
  throw new Error("DATABASE_PATH environment variable is required");
}

// Initialize database
const sqlite = new Database(process.env.DATABASE_PATH);

// Create Drizzle client
export const db = drizzle(sqlite, { schema });

// Helper types
export type DbClient = typeof db;
export type Transaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
