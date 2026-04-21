import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

export async function ensureDirectory(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function storeUploadedFile(userId: string, fileName: string, content: Buffer) {
  const userDir = path.resolve(env.UPLOAD_STORAGE_DIR, "raw", userId);
  await ensureDirectory(userDir);
  const safeName = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
  const target = path.join(userDir, safeName);
  await writeFile(target, content);
  return target;
}
