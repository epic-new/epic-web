import "server-only";

import { BetterAuthAdminIntegration } from "@/shared/integrations/better-auth-admin";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const impersonateUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ImpersonateUserInput = z.input<typeof impersonateUserInputSchema>;
export type ImpersonateUserResult = { userId: string };

export class ImpersonateUser {
  static async execute(command: {
    actor: UserActor;
    input: ImpersonateUserInput;
    sessionToken: string;
  }): Promise<ImpersonateUserResult> {
    const input = impersonateUserInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    await BetterAuthAdminIntegration.impersonate(
      command.sessionToken,
      target.id,
    );
    return { userId: target.id };
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canImpersonate(actor, records)) {
      throw new Error(
        records[0]?.id === actor.id
          ? "Cannot impersonate yourself"
          : "Forbidden - admin role required",
      );
    }
  }
}
