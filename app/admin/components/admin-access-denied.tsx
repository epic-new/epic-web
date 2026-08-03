import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";


export function AdminAccessDenied() {
  return (
    <main className="flex flex-1 h-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          </div>
          <CardTitle className="text-2xl text-zinc-900 dark:text-zinc-50">
            Access Denied
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            You do not have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Admin Access Required
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This database administration interface is restricted to users
                with admin privileges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
