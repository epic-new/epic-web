// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const formAction = vi.fn();
vi.mock("../behaviors/signup/use-signup", () => ({
  useSignup: () => ({
    state: { error: null },
    formAction,
    isLoading: false,
  }),
}));

import SignUpForm from "./signup-form";

describe("signup form scenarios", () => {
  it("submits the entered account data to the behavior", () => {
    render(<SignUpForm redirectURL="/" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "securePassword123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "securePassword123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /CREATE ACCOUNT/ }).closest("form")!,
    );

    expect(formAction).toHaveBeenCalledOnce();
    const submitted = formAction.mock.calls[0][0] as FormData;
    expect(submitted.get("email")).toBe("user@example.com");
    expect(submitted.get("password")).toBe("securePassword123");
    expect(submitted.get("confirmPassword")).toBe("securePassword123");
  });
});
