import { describe, expect, it } from "vitest";

import { profileSchema } from "@/lib/validators";

describe("profile validation", () => {
  it("accepts optional professional profile fields", () => {
    const result = profileSchema.safeParse({
      name: "Byte Recon",
      avatarUrl: "",
      jobTitle: "Founder",
      company: "Byte Recon",
      location: "Pune, India",
      bio: "Building personal finance tools."
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid avatar urls", () => {
    const result = profileSchema.safeParse({
      name: "Byte Recon",
      avatarUrl: "not-a-url",
      jobTitle: "",
      company: "",
      location: "",
      bio: ""
    });

    expect(result.success).toBe(false);
  });
});
