import type { Config } from "drizzle-kit";

export default {
  schema: "./app/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/sqlite.db",
  },
} satisfies Config;
