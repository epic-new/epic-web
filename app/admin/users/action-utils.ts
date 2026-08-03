import "server-only";

import { getUser } from "@/lib/auth";
import { z } from "zod";

export interface AdminUserActionContext {
  actor: {
    id: string;
    role?: string | null;
    impersonatedBy?: string | null;
  };
  credential: {
    sessionToken: string;
    impersonationCredential: string | null;
  };
}

export async function getAdminUserActionContext(): Promise<AdminUserActionContext | null> {
  const session = await getUser();
  if (!session.user || !session.sessionToken) return null;

  return {
    actor: {
      id: session.user.id,
      role: session.user.role,
      impersonatedBy: session.impersonatedBy,
    },
    credential: {
      sessionToken: session.sessionToken,
      impersonationCredential: session.impersonationCredential,
    },
  };
}

export function actionError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join(", ");
  }
  return error instanceof Error ? error.message : fallback;
}
