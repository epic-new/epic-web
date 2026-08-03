"use client";

import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { useStopImpersonating } from "../users/behaviors/stop-impersonating/use-stop-impersonating.hook";
import { toast } from "sonner";

interface ImpersonationBannerProps {
  impersonatedUserName: string | null;
}

export function ImpersonationBanner({
  impersonatedUserName,
}: ImpersonationBannerProps) {
  const { handleStopImpersonating, isLoading } = useStopImpersonating();

  const handleStop = async () => {
    try {
      await handleStopImpersonating();
      // Will redirect on success
    } catch (error) {
      toast.error("Failed to stop impersonating", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-200/50 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-900 dark:text-amber-100 font-medium">
              Impersonating{" "}
              <span className="font-semibold">
                {impersonatedUserName || "a user"}
              </span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs text-amber-900 hover:bg-amber-100/50 dark:text-amber-100 dark:hover:bg-amber-900/30"
          >
            {isLoading ? (
              "Stopping..."
            ) : (
              <>
                <X className="h-3 w-3 mr-1.5" />
                Stop
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
