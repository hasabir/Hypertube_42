"use client";

import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .regex(/[A-Z]/, "Password must include one uppercase letter")
  .regex(/[a-z]/, "Password must include one lowercase letter")
  .regex(/[0-9]/, "Password must include one number");

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must contain at least 3 characters"),
    firstName: z.string().min(2, "First name must contain at least 2 characters"),
    lastName: z.string().min(2, "Last name must contain at least 2 characters"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const updateProfileSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  avatarUrl: z
    .string()
    .min(1, "Avatar is required")
    .refine(
      (val) =>
        val.startsWith("/") ||
        /^https?:\/\/.+/i.test(val) ||
        /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i.test(val),
      "Avatar must be a URL, site path, or image data URL",
    ),
  bio: z.string().max(250, "Bio must be 250 characters max").optional(),
  language: z.enum(["en", "fr"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "New passwords do not match",
  });
