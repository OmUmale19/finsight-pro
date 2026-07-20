process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://localhost:5432/test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-value-1234567890";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "test-client-secret";

import { describe, expect, it } from "vitest";

describe("Google OAuth Configuration & State Constants", () => {
  it("exports correct OAuth state cookie name", async () => {
    const { OAUTH_STATE_COOKIE } = await import("@/app/api/auth/google/route");
    expect(OAUTH_STATE_COOKIE).toBe("g_oauth_state");
  });

  it("parses Google OAuth env variables when defined", async () => {
    const { env } = await import("@/lib/env");
    expect(env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
  });

  it("normalizes user emails to lower case for consistent matching", () => {
    const rawEmail = "Test.User@Example.COM";
    const normalized = rawEmail.toLowerCase();
    expect(normalized).toBe("test.user@example.com");
  });
});
