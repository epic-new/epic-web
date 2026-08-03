"use server";

import { signOut } from "@/shared/actions/sign-out.action";
import { SIGNUP_URL } from "@/app.config";

export async function signOutAction() {
  await signOut(true, SIGNUP_URL);
}
