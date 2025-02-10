import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize database with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Max idle time in seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for Supabase
});

// Create Drizzle client
export const db = drizzle(client, { schema });

// Helper types
export type DbClient = typeof db;
export type Transaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
