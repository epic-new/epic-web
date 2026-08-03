import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { signOut as signOutAction } from "@/shared/actions/sign-out.action";
import { redirect } from "next/navigation";
import { SIGNIN_URL } from "@/app.config";
import { ImpersonationBanner } from "@/app/admin/components/impersonation-banner";

async function handleSignOut() {
  "use server";
  await signOutAction();
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isImpersonating } = await getUser();

  if (!user) redirect(SIGNIN_URL);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <form action={handleSignOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {isImpersonating && (
        <ImpersonationBanner impersonatedUserName={user.name || user.email} />
      )}
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
