"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, LogOut, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/app/admin/behaviors/sign-out/use-sign-out.hook";

const navItems = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Database,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const { handleSignOut, isLoading, error } = useSignOut();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await handleSignOut();
    } catch {
      // The hook exposes the mutation error for presentation below.
    }
  };

  return (
    <nav className="flex items-center justify-between w-full -ml-3">
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
      <form className="flex items-center gap-3" onSubmit={handleSubmit}>
        {error ? (
          <span className="text-sm text-destructive" role="alert">
            {error}
          </span>
        ) : null}
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? "Signing out…" : "Logout"}
        </Button>
      </form>
    </nav>
  );
}
