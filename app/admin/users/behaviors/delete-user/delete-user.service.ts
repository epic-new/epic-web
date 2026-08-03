import "server-only";

import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const deleteUserInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type DeleteUserInput = z.input<typeof deleteUserInputSchema>;
export type DeleteUserResult = { userId: string };

export class DeleteUser {
  static async execute(command: {
    actor: UserActor;
    input: DeleteUserInput;
  }): Promise<DeleteUserResult> {
    const input = deleteUserInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target]);
    if (!(await UserModel.delete(target.id))) throw new Error("User not found");
    return { userId: target.id };
  }

  private static authorize(actor: UserActor, records: readonly UserRecord[]): void {
    if (!UserPolicy.canDelete(actor, records)) {
      throw new Error(
        records[0]?.id === actor.id
          ? "Cannot delete your own account"
          : "Forbidden - admin role required",
      );
    }
  }
}
