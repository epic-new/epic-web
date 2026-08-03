import "server-only";

import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const updateUserInputSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    email: z.string().trim().email("Invalid email address").optional(),
    name: z.string().trim().min(1, "Name cannot be empty").optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine(({ email, name, role }) => email || name || role, "No changes provided");

export type UpdateUserInput = z.input<typeof updateUserInputSchema>;
export type UpdateUserResult = UserRecord;

export class UpdateUser {
  static async execute(command: {
    actor: UserActor;
    input: UpdateUserInput;
  }): Promise<UpdateUserResult> {
    const input = updateUserInputSchema.parse(command.input);
    const target = await UserModel.find(input.userId);
    if (!target) throw new Error("User not found");
    this.authorize(command.actor, [target], input.role);

    if (input.email && input.email !== target.email) {
      const duplicate = await UserModel.findByEmail(input.email);
      if (duplicate) throw new Error("Email already exists");
    }

    const record = await UserModel.update(target.id, {
      ...(input.email !== undefined && { email: input.email }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
    });
    if (!record) throw new Error("User not found");
    return record;
  }

  private static authorize(
    actor: UserActor,
    records: readonly UserRecord[],
    role?: "user" | "admin",
  ): void {
    const allowed = UserPolicy.canUpdate(actor, records) &&
      (!role || UserPolicy.canSetRole(actor, records, role));
    if (!allowed) {
      throw new Error(
        records[0]?.id === actor.id && role === "user"
          ? "Cannot remove your own admin role"
          : "Forbidden - admin role required",
      );
    }
  }
}
