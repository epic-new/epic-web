import "server-only";

import { BetterAuthAdminIntegration } from "@/shared/integrations/better-auth-admin";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";

export type StopImpersonatingResult = { stopped: true };

export class StopImpersonating {
  static async execute(command: {
    actor: UserActor;
    sessionToken: string;
    impersonationCredential: string | null;
  }): Promise<StopImpersonatingResult> {
    this.authorize(command.actor, []);
    if (!command.impersonationCredential) {
      throw new Error("No impersonation session is active");
    }
    await BetterAuthAdminIntegration.stopImpersonating(
      command.sessionToken,
      command.impersonationCredential,
    );
    return { stopped: true };
  }

  private static authorize(actor: UserActor, records: readonly never[]): void {
    if (!UserPolicy.canStopImpersonating(actor, records)) {
      throw new Error("No impersonation session is active");
    }
  }
}
