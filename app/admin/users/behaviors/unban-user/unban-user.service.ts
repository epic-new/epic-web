import "server-only";

import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const unbanUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type UnbanUserInput = z.input<typeof unbanUserInputSchema>;
export type UnbanUserResult = UserRecord;

export class UnbanUser {
  static async execute(command: {
    actor: UserActor;
    input: UnbanUserInput;
  }): Promise<UnbanUserResult> {
    const input = unbanUserInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    const record = await UserModel.update(target.id, {
      banned: false,
      banReason: null,
      banExpires: null,
    });
    if (!record) throw new Error("User not found");
    return record;
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canUnban(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
