import "server-only";

import { BetterAuthAdminIntegration } from "@/shared/integrations/better-auth-admin";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const createUserInputSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["user", "admin"]).default("user"),
});

export type CreateUserInput = z.input<typeof createUserInputSchema>;
export type CreateUserResult = UserRecord;

export class CreateUser {
  static async execute(command: {
    actor: UserActor;
    input: CreateUserInput;
    sessionToken: string;
  }): Promise<CreateUserResult> {
    const input = createUserInputSchema.parse(command.input);
    this.authorize(command.actor, []);

    if (await UserModel.findByEmail(input.email)) {
      throw new Error("Email already exists");
    }

    const created = await BetterAuthAdminIntegration.createUser(
      command.sessionToken,
      input,
    );
    const record = await UserModel.find(created.id);
    if (!record) throw new Error("Unable to create user");
    return record;
  }

  private static authorize(actor: UserActor, records: readonly never[]): void {
    if (!UserPolicy.canCreate(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
