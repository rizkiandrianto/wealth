import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", debug: true });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true
} satisfies Config;
