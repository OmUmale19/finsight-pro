import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  APP_URL: z.string().url().default("http://localhost:3000"),
  PYTHON_BIN: z.string().default("python"),
  UPLOAD_STORAGE_DIR: z.string().default("./storage"),
  ETL_TEMP_DIR: z.string().default("./tmp"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  PYTHON_BIN: process.env.PYTHON_BIN ?? "python",
  UPLOAD_STORAGE_DIR: process.env.UPLOAD_STORAGE_DIR ?? "./storage",
  ETL_TEMP_DIR: process.env.ETL_TEMP_DIR ?? "./tmp",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
});
