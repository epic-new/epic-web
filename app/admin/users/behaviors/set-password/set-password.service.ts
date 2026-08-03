import "server-only";

import { BetterAuthAdminIntegration } from "@/shared/integrations/better-auth-admin";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const setPasswordInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type SetPasswordInput = z.input<typeof setPasswordInputSchema>;
export type SetPasswordResult = { userId: string };

export class SetPassword {
  static async execute(command: {
    actor: UserActor;
    input: SetPasswordInput;
    sessionToken: string;
  }): Promise<SetPasswordResult> {
    const input = setPasswordInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    await BetterAuthAdminIntegration.setPassword(command.sessionToken, input);
    return { userId: target.id };
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canSetPassword(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
