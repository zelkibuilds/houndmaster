import * as dotenv from "dotenv";
import "dotenv/config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_PATH) {
  throw new Error("DATABASE_PATH environment variable is required");
}

// Initialize database
const sqlite = new Database(process.env.DATABASE_PATH);
const db = drizzle(sqlite);

// Run migrations
console.log("Running migrations...");
migrate(db, { migrationsFolder: "./drizzle" });
console.log("✓ Migrations completed successfully");
