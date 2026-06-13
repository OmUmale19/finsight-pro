import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { env } from "@/lib/env";

export async function ensureDirectory(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

function resolveUploadStorageDir() {
  if (process.env.VERCEL === "1" && !path.isAbsolute(env.UPLOAD_STORAGE_DIR)) {
    return path.join(tmpdir(), "finsight-pro-storage");
  }

  return path.resolve(env.UPLOAD_STORAGE_DIR);
}

export async function storeUploadedFile(userId: string, fileName: string, content: Buffer) {
  const userDir = path.join(resolveUploadStorageDir(), "raw", userId);
  await ensureDirectory(userDir);
  const safeName = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
  const target = path.join(userDir, safeName);
  await writeFile(target, content);
  return target;
}
