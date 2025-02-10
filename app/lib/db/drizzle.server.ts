import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize database with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

// Create Drizzle client
export const db = drizzle(client, { schema });

// Helper types
export type DbClient = typeof db;
export type Transaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
