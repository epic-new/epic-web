import type { UserRecord } from "@/shared/models/user";

export type UserActor = Pick<UserRecord, "id"> &
  Partial<Pick<UserRecord, "role">> & {
    impersonatedBy?: string | null;
  };

export class UserPolicy {
  private static isAdmin(actor: UserActor): boolean {
    return actor.role === "admin";
  }

  private static hasOneTarget(records: readonly UserRecord[]): boolean {
    return records.length === 1;
  }

  static canViewAdminStats(
    actor: UserActor,
    records: readonly UserRecord[],
  ): boolean {
    void records;

    return actor.role === "admin";
  }

  static canList(actor: UserActor, records: readonly UserRecord[]): boolean {
    void records;
    return this.isAdmin(actor);
  }

  static canCreate(actor: UserActor, records: readonly UserRecord[]): boolean {
    void records;
    return this.isAdmin(actor);
  }

  static canUpdate(actor: UserActor, records: readonly UserRecord[]): boolean {
    return this.isAdmin(actor) && this.hasOneTarget(records);
  }

  static canDelete(actor: UserActor, records: readonly UserRecord[]): boolean {
    return (
      this.isAdmin(actor) &&
      this.hasOneTarget(records) &&
      records[0]?.id !== actor.id
    );
  }

  static canBan(actor: UserActor, records: readonly UserRecord[]): boolean {
    return this.canDelete(actor, records);
  }

  static canUnban(actor: UserActor, records: readonly UserRecord[]): boolean {
    return this.isAdmin(actor) && this.hasOneTarget(records);
  }

  static canSetRole(
    actor: UserActor,
    records: readonly UserRecord[],
    role: "user" | "admin",
  ): boolean {
    if (!this.isAdmin(actor) || !this.hasOneTarget(records)) return false;
    return records[0]?.id !== actor.id || role === "admin";
  }

  static canSetPassword(
    actor: UserActor,
    records: readonly UserRecord[],
  ): boolean {
    return this.isAdmin(actor) && this.hasOneTarget(records);
  }

  static canManageSessions(
    actor: UserActor,
    records: readonly UserRecord[],
  ): boolean {
    return this.isAdmin(actor) && this.hasOneTarget(records);
  }

  static canImpersonate(
    actor: UserActor,
    records: readonly UserRecord[],
  ): boolean {
    return this.canDelete(actor, records);
  }

  static canStopImpersonating(
    actor: UserActor,
    records: readonly UserRecord[],
  ): boolean {
    void records;
    return !!actor.impersonatedBy;
  }
}
