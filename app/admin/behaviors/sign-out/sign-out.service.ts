import "server-only";

import { SessionModel, type SessionRecord } from "@/shared/models/session";
import {
  SessionPolicy,
  type SessionActor,
} from "@/shared/policies/session.policy";
import { z } from "zod";

const signOutInputSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required"),
});

export type SignOutInput = z.input<typeof signOutInputSchema>;
export type SignOutResult = { signedOut: true };

export class SignOut {
  static async execute(command: {
    actor: SessionActor;
    input: SignOutInput;
  }): Promise<SignOutResult> {
    const input = signOutInputSchema.parse(command.input);
    const currentSession = await SessionModel.findByToken(input.sessionToken);

    if (!currentSession) {
      throw new Error("Session not found");
    }

    this.authorize(command.actor, [currentSession]);

    if (!(await SessionModel.deleteByToken(currentSession.token))) {
      throw new Error("Session not found");
    }

    return { signedOut: true };
  }

  private static authorize(
    actor: SessionActor,
    records: readonly SessionRecord[],
  ): void {
    if (!SessionPolicy.canSignOut(actor, records)) {
      throw new Error("Unauthorized");
    }
  }
}
