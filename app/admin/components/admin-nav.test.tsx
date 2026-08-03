// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.hoisted(() => ({
  handleSignOut: vi.fn(),
  isLoading: false,
  error: null as string | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
}));

vi.mock("@/app/admin/behaviors/sign-out/use-sign-out.hook", () => ({
  useSignOut: () => signOut,
}));

import { AdminNav } from "./admin-nav";

describe("AdminNav sign-out scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.isLoading = false;
    signOut.error = null;
  });

  it("submits sign-out through the public behavior hook", async () => {
    signOut.handleSignOut.mockResolvedValue(undefined);
    render(<AdminNav />);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(signOut.handleSignOut).toHaveBeenCalledOnce());
  });

  it("renders the pending and error states exposed by the hook", () => {
    signOut.isLoading = true;
    signOut.error = "Unable to sign out";
    render(<AdminNav />);

    expect(screen.getByRole("button", { name: "Signing out…" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign out");
  });
});
