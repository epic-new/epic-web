import "server-only";

import { SessionModel, type SessionRecord } from "@/shared/models/session";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const listSessionsInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ListSessionsInput = z.input<typeof listSessionsInputSchema>;
export type ListSessionsResult = SessionRecord[];

export class ListSessions {
  static async execute(command: {
    actor: UserActor;
    input: ListSessionsInput;
  }): Promise<ListSessionsResult> {
    const input = listSessionsInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    return SessionModel.listByUser(target.id);
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canManageSessions(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
