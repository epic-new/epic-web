"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { APP_NAME } from "@/app.config";

export function AuthHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const isSignIn = pathname === "/auth/signin";
  const isSignUp = pathname === "/auth/signup";

  const redirectQuery = redirectTo
    ? `?redirectTo=${encodeURIComponent(redirectTo)}`
    : "";

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-xl font-semibold text-foreground">
            <Link href="/">{APP_NAME}</Link>
          </div>

          {isSignIn && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?
              </span>
              <Link
                href={`/auth/signup${redirectQuery}`}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {isSignUp && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Already have an account?
              </span>
              <Link
                href={`/auth/signin${redirectQuery}`}
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
