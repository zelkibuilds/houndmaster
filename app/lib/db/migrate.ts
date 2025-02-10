import * as dotenv from "dotenv";
import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize database
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

// Run migrations
console.log("Running migrations...");
migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("✓ Migrations completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Migration failed", err);
    process.exit(1);
  });
