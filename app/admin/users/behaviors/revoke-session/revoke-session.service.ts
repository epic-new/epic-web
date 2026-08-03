import "server-only";

import { SessionModel } from "@/shared/models/session";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const revokeSessionInputSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required"),
});

export type RevokeSessionInput = z.input<typeof revokeSessionInputSchema>;
export type RevokeSessionResult = { sessionToken: string; userId: string };

export class RevokeSession {
  static async execute(command: {
    actor: UserActor;
    input: RevokeSessionInput;
  }): Promise<RevokeSessionResult> {
    const input = revokeSessionInputSchema.parse(command.input);
    const session = await SessionModel.findByToken(input.sessionToken);
    if (!session) throw new Error("Session not found");
    const target = await UserModel.find(session.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    if (!(await SessionModel.deleteByToken(session.token))) {
      throw new Error("Session not found");
    }
    return { sessionToken: session.token, userId: session.userId };
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canManageSessions(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
