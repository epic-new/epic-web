// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const formAction = vi.fn();
vi.mock("../behaviors/signin/use-signin.hook", () => ({
  useSignIn: () => ({
    state: { error: null },
    formAction,
    isLoading: false,
  }),
}));

import SignInForm from "./signin-form";

describe("signin form scenarios", () => {
  it("submits the entered credentials to the behavior", () => {
    render(<SignInForm redirectURL="/" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "securePassword123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "SIGN IN" }).closest("form")!,
    );

    expect(formAction).toHaveBeenCalledOnce();
    const submitted = formAction.mock.calls[0][0] as FormData;
    expect(submitted.get("email")).toBe("user@example.com");
    expect(submitted.get("password")).toBe("securePassword123");
  });
});
