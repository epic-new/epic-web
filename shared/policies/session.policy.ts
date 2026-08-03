import type { SessionRecord } from "@/shared/models/session";

export interface SessionActor {
  id: string;
}

export class SessionPolicy {
  static canSignOut(
    actor: SessionActor,
    records: readonly SessionRecord[],
  ): boolean {
    return records.length === 1 && records[0]?.userId === actor.id;
  }
}
