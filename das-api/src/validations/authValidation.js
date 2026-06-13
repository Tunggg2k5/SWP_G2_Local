import { z } from "zod";
import { nameSchema, passwordSchema, phoneSchema } from "../utils/validation.js";

export const registerSchema = z
  .object({
    fullName: nameSchema.optional(),
    phone: phoneSchema,
    gender: z.enum(["male", "female", "other", "unknown"]).default("unknown"),
    address: z.string().trim().max(255).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mat khau nhap lai khong khop.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  phone: phoneSchema
});

export const resetPasswordSchema = z.object({
  phone: phoneSchema,
  verificationCode: z.string().trim().min(4).max(12),
  newPassword: passwordSchema
});

const avatarSchema = z
  .string()
  .trim()
  .max(750000)
  .refine((value) => !value || value.startsWith("data:image/") || /^https?:\/\//i.test(value), {
    message: "Avatar phai la URL anh hoac anh upload hop le."
  })
  .optional()
  .or(z.literal(""));

export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  avatarUrl: avatarSchema,
  bio: z.string().trim().max(1000).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
});
