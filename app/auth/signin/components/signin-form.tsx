"use client";

import { useSignIn } from "../behaviors/signin/use-signin.hook";

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5 text-muted-foreground"
  >
    <path
      fillRule="evenodd"
      d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
      clipRule="evenodd"
    />
  </svg>
);

// Simple User Icon for Email Field
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5 text-muted-foreground"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

export default function SignInForm({ redirectURL }: { redirectURL: string }) {
  const { state, formAction, isLoading } = useSignIn(redirectURL);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div
          className="bg-destructive/10 border-2 border-dashed border-destructive/40 text-destructive px-4 py-3 relative font-mono"
          role="alert"
        >
          <span className="text-xs text-destructive/70 absolute top-1 left-2">
            ERROR
          </span>
          <div className="block sm:inline ml-2 mt-3 text-sm">
            <span>{state.error}</span>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="relative border border-dashed border-border rounded-lg p-3 bg-background">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <div className="absolute top-1/2 transform -translate-y-1/2 left-4 flex items-center pointer-events-none mt-2">
          <UserIcon />
        </div>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          className="block w-full pl-10 pr-3 py-2 bg-transparent border-none placeholder:text-muted-foreground text-foreground focus:outline-none text-sm"
        />
      </div>

      {/* Password Field */}
      <div className="relative border border-dashed border-border rounded-lg p-3 bg-background">
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <div className="absolute top-1/2 transform -translate-y-1/2 left-4 flex items-center pointer-events-none mt-2">
          <LockIcon />
        </div>
        <input
          type="password"
          id="password"
          name="password"
          required
          placeholder="••••••••"
          className="block w-full pl-10 pr-3 py-2 bg-transparent border-none placeholder:text-muted-foreground text-foreground focus:outline-none text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-primary-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="font-medium text-primary-foreground">
              SIGNING IN...
            </span>
          </>
        ) : (
          <span className="font-medium text-primary-foreground">SIGN IN</span>
        )}
      </button>
    </form>
  );
}
