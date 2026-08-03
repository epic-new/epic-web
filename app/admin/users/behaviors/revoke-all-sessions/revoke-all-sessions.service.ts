import "server-only";

import { SessionModel } from "@/shared/models/session";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const revokeAllSessionsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type RevokeAllSessionsInput = z.input<typeof revokeAllSessionsInputSchema>;
export type RevokeAllSessionsResult = { userId: string; revokedCount: number };

export class RevokeAllSessions {
  static async execute(command: {
    actor: UserActor;
    input: RevokeAllSessionsInput;
  }): Promise<RevokeAllSessionsResult> {
    const input = revokeAllSessionsInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    return {
      userId: target.id,
      revokedCount: await SessionModel.deleteByUser(target.id),
    };
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canManageSessions(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
