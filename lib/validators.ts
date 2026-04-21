import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
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
