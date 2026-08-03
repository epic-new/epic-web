import "server-only";

import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const setRoleInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["user", "admin"]),
});

export type SetRoleInput = z.input<typeof setRoleInputSchema>;
export type SetRoleResult = UserRecord;

export class SetRole {
  static async execute(command: {
    actor: UserActor;
    input: SetRoleInput;
  }): Promise<SetRoleResult> {
    const input = setRoleInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target], input.role);
    const record = await UserModel.update(target.id, { role: input.role });
    if (!record) throw new Error("User not found");
    return record;
  }

  private static authorize(
    actor: UserActor,
    records: readonly UserRecord[],
    role: "user" | "admin",
  ): void {
    if (!UserPolicy.canSetRole(actor, records, role)) {
      throw new Error(
        records[0]?.id === actor.id && role === "user"
          ? "Cannot remove your own admin role"
          : "Forbidden - admin role required",
      );
    }
  }
}
