import "server-only";

import { withTransaction } from "@/db";
import { SessionModel } from "@/shared/models/session";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const banUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  banReason: z.string().trim().optional(),
  banExpiresIn: z.number().positive().optional(),
});

export type BanUserInput = z.input<typeof banUserInputSchema>;
export type BanUserResult = UserRecord;

export class BanUser {
  static async execute(command: {
    actor: UserActor;
    input: BanUserInput;
  }): Promise<BanUserResult> {
    const input = banUserInputSchema.parse(command.input);
    return withTransaction(async (transaction) => {
      const target = await UserModel.find(input.userId, transaction);
      if (!target) throw new Error("User not found");
      this.authorize(command.actor, [target]);

      const record = await UserModel.update(target.id, {
        banned: true,
        banReason: input.banReason || null,
        banExpires: input.banExpiresIn
          ? new Date(Date.now() + input.banExpiresIn * 1000)
          : null,
      }, transaction);
      if (!record) throw new Error("User not found");
      await SessionModel.deleteByUser(target.id, transaction);
      return record;
    });
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canBan(actor, records)) {
      throw new Error(
        records[0]?.id === actor.id
          ? "Cannot ban your own account"
          : "Forbidden - admin role required",
      );
    }
  }
}
