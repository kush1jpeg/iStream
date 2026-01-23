// validation/authSchemas.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(4, { message: "Password must be at least 4 characters" })
    .max(30, { message: "Password too long" })
    .regex(/[A-Za-z0-9!@#$%^&*]/, {
      message: "Password contains invalid characters",
    }),
});

export const forgotPassSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
});

// 2️⃣ Verify and change password (reset via token)
export const verifyAndChangePassSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  newPassword: z
    .string()
    .min(4, { message: "Password must be at least 4 characters" }),
});

// 3️⃣ Reset password (user logged in, old + new password)
export const resetPassSchema = z.object({
  oldPass: z.string().min(6, { message: "Old password is required" }),
  newPass: z
    .string()
    .min(4, { message: "New password must be at least 4 characters" }),
});
