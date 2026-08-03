"use server";

import { HOME_URL } from "@/app.config";
import { auth, getUser } from "@/lib/auth";
import { authErrorHandler, throwAuthError } from "@/lib/auth/error";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";
import { z } from "zod";

export interface ActionResult {
  error: string | null;
}

const signupSchema = z
  .object({
    email: z.string().email({ message: "INVALID_EMAIL" }),
    password: z
      .string()
      .min(6, { message: "WEAK_PASSWORD" })
      .max(255, { message: "WEAK_PASSWORD" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirmPassword"],
  });

export async function signup(
  _prevState: ActionResult,
  formData: FormData,
  redirectURL: string,
): Promise<ActionResult> {
  const { user } = await getUser();
  if (user) {
    return { error: "You are already logged in. Please sign out first." };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    const errorCode = parsed.error.issues[0].message;

    if (errorCode === "INVALID_EMAIL") {
      return { error: throwAuthError("invalidEmail").message };
    }

    if (errorCode === "WEAK_PASSWORD") {
      return { error: throwAuthError("weakPassword").message };
    }

    if (errorCode === "PASSWORDS_DO_NOT_MATCH") {
      return { error: "Passwords do not match" };
    }

    return { error: "Validation error" };
  }

  const { email, password } = parsed.data;

  const result = await auth.api
    .signUpEmail({
      body: {
        email,
        password,
        name: "",
      },
    })
    .catch((error) => ({ error: authErrorHandler(error).message }));

  if ("error" in result) return result;

  if (!result || (!result.user && !result.token)) {
    return { error: throwAuthError("internalServerError").message };
  }

  redirect(safeRedirectPath(redirectURL, HOME_URL));
}
