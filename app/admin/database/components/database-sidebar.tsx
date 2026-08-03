"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, RefreshCw, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTables } from "../behaviors/list-tables/use-list-tables.hook";
import { useState } from "react";

export function DatabaseSidebar({ actorId }: { actorId: string }) {
  const pathname = usePathname();
  const { tables, isLoading, error, handleRefresh } = useListTables(actorId);
  const [search, setSearch] = useState("");

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Database</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <p role="alert" className="text-sm text-destructive text-center py-4">
            {error}
          </p>
        ) : isLoading && tables.length === 0 ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tables found
          </p>
        ) : (
          <nav className="space-y-1">
            {filteredTables.map((table) => {
              const isActive = pathname === `/admin/database/${table.name}`;
              return (
                <Link
                  key={table.name}
                  href={`/admin/database/${table.name}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Table2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{table.name}</span>
                  </span>
                  <span className="text-xs tabular-nums">{table.rowCount}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
