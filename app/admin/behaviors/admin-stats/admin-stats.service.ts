import "server-only";

import {
  UserModel,
  type UserRecord,
  type UserStats,
} from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";

export type AdminStats = UserStats;

export class GetAdminStats {
  static async execute({ actor }: { actor: UserActor }): Promise<AdminStats> {
    this.authorize(actor, []);

    return UserModel.getStats();
  }

  private static authorize(
    actor: UserActor,
    records: readonly UserRecord[],
  ): void {
    if (!UserPolicy.canViewAdminStats(actor, records)) {
      throw new Error("Unauthorized");
    }
  }
}
