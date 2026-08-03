"use server";

import { signOut } from "@/shared/actions/sign-out.action";
import { SIGNIN_URL } from "@/app.config";

export async function signOutAction() {
  await signOut(true, SIGNIN_URL);
}
