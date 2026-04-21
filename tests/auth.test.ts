process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/finsight_pro?schema=public";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-value-12345";

import { describe, expect, it } from "vitest";

describe("auth helpers", () => {
  it("hashes and verifies passwords", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("Password@123");
    await expect(verifyPassword("Password@123", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword", hash)).resolves.toBe(false);
  });
});
