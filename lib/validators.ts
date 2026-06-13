import { z } from "zod";

function isAcceptedImageValue(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("data:image/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  avatarUrl: z.string().trim().refine(isAcceptedImageValue, "Enter a valid image URL").default(""),
  jobTitle: z.string().trim().max(60, "Job title is too long").default(""),
  company: z.string().trim().max(80, "Company is too long").default(""),
  location: z.string().trim().max(80, "Location is too long").default(""),
  bio: z.string().trim().max(280, "Bio must be 280 characters or less").default("")
});

export const profilePreferencesSchema = z.object({
  emailNotifications: z.coerce.boolean().default(true),
  weeklyDigest: z.coerce.boolean().default(true),
  productUpdates: z.coerce.boolean().default(false)
});

export const profileSecuritySchema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    currentPassword: z.string().default(""),
    newPassword: z.string().default(""),
    confirmPassword: z.string().default("")
  })
  .superRefine((data, ctx) => {
    const hasPasswordChange = data.currentPassword.length > 0 || data.newPassword.length > 0 || data.confirmPassword.length > 0;

    if (hasPasswordChange) {
      if (data.currentPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currentPassword"],
          message: "Enter your current password"
        });
      }

      if (data.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: "New password must be at least 8 characters"
        });
      }

      if (data.confirmPassword !== data.newPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match"
        });
      }
    }
  });

export const budgetSchema = z.object({
  category: z.string().min(2),
  limit: z.coerce.number().positive()
});

export const goalSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().min(1)
});

export const whatIfSchema = z.object({
  scenarios: z.array(
    z.object({
      category: z.string().min(2),
      reductionPercent: z.coerce.number().min(0).max(100)
    })
  )
});
